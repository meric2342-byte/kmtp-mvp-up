"""
KMTP 백엔드 — SQLite 데이터베이스 (스키마 + 시드)

- 표준 라이브러리 sqlite3만 사용 (추가 ORM 의존성 없음)
- 서버가 처음 켜질 때 테이블이 없으면 만들고 샘플 데이터를 넣습니다.
- DB 파일: backend/kmtp.db (git에는 올리지 않음 — .gitignore)
"""

import os
import re
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "kmtp.db")

# DATABASE_URL 있으면 PostgreSQL(영구·동시성 안전), 없으면 SQLite(로컬·기존 동작 그대로).
DATABASE_URL = os.getenv("DATABASE_URL")
IS_PG = bool(DATABASE_URL)

# SERIAL id를 가진 테이블(INSERT 시 lastrowid용 RETURNING id 필요). 나머지는 TEXT PK/복합키.
_SERIAL_TABLES = {
    "appointments", "transfers", "journey_events", "notifications",
    "recovery_monitoring", "satisfaction", "interpreters", "patient_registration",
}


# ═══════════════════════════════════════════════════════════════
# PostgreSQL 어댑터 — conn/cursor를 sqlite3처럼 보이게 (DATABASE_URL 있을 때만)
#  · ? → %s,  PRAGMA → no-op,  INSERT OR IGNORE → ON CONFLICT DO NOTHING
#  · SERIAL 테이블 INSERT엔 RETURNING id 붙여 lastrowid 채움
#  · row["col"] 접근(dict_row), executescript/executemany 지원
# ═══════════════════════════════════════════════════════════════
class _PgCursor:
    def __init__(self, cur=None, last_id=None):
        self._cur = cur
        self.lastrowid = last_id

    def fetchone(self):
        return self._cur.fetchone() if self._cur else None

    def fetchall(self):
        return self._cur.fetchall() if self._cur else []

    def __iter__(self):
        return iter(self.fetchall())


def _table_of(up_sql: str) -> str:
    m = re.search(r"INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+([A-Za-z_]+)", up_sql, re.IGNORECASE)
    return m.group(1).lower() if m else ""


class _PgConn:
    def __init__(self, raw):
        self._conn = raw

    def execute(self, sql: str, params=()):
        from psycopg.rows import dict_row
        # psycopg는 쿼리문의 리터럴 %(LIKE 패턴 등)를 플레이스홀더로 오인 → %%로 이스케이프.
        # 원본 SQLite SQL엔 %s가 없으므로(플레이스홀더는 ?) 먼저 %를 이중화한 뒤 ?→%s 변환.
        s = sql.replace("%", "%%").replace("?", "%s")
        up = s.strip().upper()
        if up.startswith("PRAGMA"):
            return _PgCursor()
        conflict = False
        if up.startswith("INSERT OR IGNORE"):
            s = re.sub(r"^\s*INSERT\s+OR\s+IGNORE", "INSERT", s, flags=re.IGNORECASE)
            conflict = True
            up = s.strip().upper()
        cur = self._conn.cursor(row_factory=dict_row)
        if up.startswith("INSERT"):
            table = _table_of(s)
            if conflict:
                s = s.rstrip().rstrip(";") + " ON CONFLICT DO NOTHING"
            if table in _SERIAL_TABLES and "RETURNING" not in up:
                s = s.rstrip().rstrip(";") + " RETURNING id"
                cur.execute(s, params or ())
                row = cur.fetchone()
                return _PgCursor(cur, row["id"] if row else None)
            cur.execute(s, params or ())
            return _PgCursor(cur)
        cur.execute(s, params or ())
        return _PgCursor(cur)

    def executemany(self, sql: str, seq):
        for params in seq:
            self.execute(sql, params)
        return _PgCursor()

    def executescript(self, script: str):
        for stmt in script.split(";"):
            if stmt.strip():
                self.execute(stmt)
        return _PgCursor()

    def commit(self):
        try:
            self._conn.commit()
        except Exception:
            pass

    def close(self):
        self._conn.close()

# ------------------------------------------------------------
# 환자 여정 9단계 (작업 4 타임라인과 동일 순서)
# 프론트의 lib/journey.ts STAGES와 키를 맞춥니다.
# ------------------------------------------------------------
STAGES = [
    "depart_home",      # 현지 출발
    "arrive_airport",   # 공항 도착
    "airport_pickup",   # 공항 픽업
    "checkin_stay",     # 숙소/회복스테이 체크인
    "visit_hospital",   # 병원 방문
    "surgery",          # 수술·시술
    "recovery",         # 회복
    "follow_up",        # 재진
    "departure",        # 출국
]


def get_conn():
    """DATABASE_URL 있으면 PostgreSQL, 없으면 SQLite(자동커밋). 라우터 API는 동일."""
    if IS_PG:
        import psycopg
        raw = psycopg.connect(DATABASE_URL, autocommit=True)
        return _PgConn(raw)
    # isolation_level=None(자동커밋): 장기 쓰기 트랜잭션 제거 → 'database is locked' 누수 차단.
    conn = sqlite3.connect(DB_PATH, timeout=30, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 8000")
    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except sqlite3.OperationalError:
        pass  # 일부 파일시스템에서 WAL 불가 시 무시
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    agency_name TEXT NOT NULL,
    contact TEXT
);

CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT
);

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,            -- 익명 표기 (예: B***)
    nationality TEXT,
    department TEXT,               -- 진료과 id (lib/data.ts와 동일)
    agent_id TEXT REFERENCES agents(id),
    hospital_id TEXT REFERENCES hospitals(id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    hospital_id TEXT REFERENCES hospitals(id),
    scheduled_at TEXT,             -- 예약 시간 (ISO)
    actual_start TEXT,             -- 실제 진료 시작
    actual_end TEXT,               -- 실제 진료 종료
    status TEXT DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    type TEXT,                     -- airport_to_stay / stay_to_hospital / hospital_to_stay
    driver_name TEXT,
    driver_phone TEXT,
    car_number TEXT,
    gate TEXT,                     -- 공항 픽업 대기 게이트(예: "14")
    pickup_scheduled TEXT,         -- 픽업 예정 시각
    driver_arrived TEXT,           -- 기사 도착 시각
    boarded TEXT,                  -- 탑승 완료 시각
    driver_photo TEXT,             -- 기사 사진 URL(항목6)
    status TEXT DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS journey_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    stage TEXT,                    -- STAGES 중 하나
    occurred_at TEXT,              -- 발생 시각 (ISO)
    note TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
    login_id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,            -- patient / agent / hospital / admin
    name TEXT,
    sub TEXT,
    ref_id TEXT,                   -- 연결된 P###/A###/H### (admin은 NULL)
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    recipient_role TEXT,           -- patient / agent / hospital
    channel TEXT DEFAULT 'in_app', -- 지금은 인앱 알림만 (나중에 sms/kakao)
    content TEXT,
    sent_at TEXT,
    read INTEGER DEFAULT 0,
    sender TEXT DEFAULT 'KMTP 케어' -- 보낸 사람 표시 (카톡 UI용). '나'=환자 본인 발신
);

-- 나중에 값 채울 빈 테이블 --
CREATE TABLE IF NOT EXISTS recovery_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    measured_at TEXT,
    metric TEXT,                   -- 예: ECG, 심박수
    value TEXT,
    source TEXT DEFAULT 'seers'    -- 씨어스 웨어러블
);

CREATE TABLE IF NOT EXISTS satisfaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),
    phase TEXT,                    -- 1주 / 1개월 / 3개월
    score INTEGER,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS interpreters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),  -- 환자 1인당 1건(업서트)
    name TEXT,                     -- 통역사 이름
    phone TEXT,                    -- 통역사 연락처
    lang TEXT,                     -- 통역 언어(예: 영어, 중국어)
    note TEXT,                     -- 비고(가능 시간 등)
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS patient_registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT REFERENCES patients(id),  -- 환자 1인당 1건(업서트)
    reg_no TEXT,                   -- 병원이 발급한 환자별 등록번호(개인마다 다름)
    hospital TEXT,                 -- 발급 병원명(선택)
    created_at TEXT
);
"""

# PostgreSQL 스키마 — SQLite와 동일 구조, AUTOINCREMENT→SERIAL. (DATABASE_URL 있을 때만)
SCHEMA_PG = """
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY, agency_name TEXT NOT NULL, contact TEXT
);
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT
);
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, nationality TEXT, department TEXT,
    agent_id TEXT REFERENCES agents(id), hospital_id TEXT REFERENCES hospitals(id)
);
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    hospital_id TEXT REFERENCES hospitals(id), scheduled_at TEXT,
    actual_start TEXT, actual_end TEXT, status TEXT DEFAULT 'scheduled'
);
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id), type TEXT,
    driver_name TEXT, driver_phone TEXT, car_number TEXT, gate TEXT,
    pickup_scheduled TEXT, driver_arrived TEXT, boarded TEXT, driver_photo TEXT,
    status TEXT DEFAULT 'scheduled'
);
CREATE TABLE IF NOT EXISTS journey_events (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    stage TEXT, occurred_at TEXT, note TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
    login_id TEXT PRIMARY KEY, password TEXT NOT NULL, role TEXT NOT NULL,
    name TEXT, sub TEXT, ref_id TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    recipient_role TEXT, channel TEXT DEFAULT 'in_app', content TEXT,
    sent_at TEXT, read INTEGER DEFAULT 0, sender TEXT DEFAULT 'KMTP 케어'
);
CREATE TABLE IF NOT EXISTS recovery_monitoring (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    measured_at TEXT, metric TEXT, value TEXT, source TEXT DEFAULT 'seers'
);
CREATE TABLE IF NOT EXISTS satisfaction (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    phase TEXT, score INTEGER, comment TEXT
);
CREATE TABLE IF NOT EXISTS interpreters (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    name TEXT, phone TEXT, lang TEXT, note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS patient_registration (
    id SERIAL PRIMARY KEY, patient_id TEXT REFERENCES patients(id),
    reg_no TEXT, hospital TEXT, created_at TEXT
);
"""


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def init_db(reset: bool = False) -> None:
    """테이블 생성 + (비어 있으면) 샘플 데이터 시드."""
    if reset and not IS_PG and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = get_conn()
    if IS_PG:
        conn.executescript(SCHEMA_PG)
        # PG 가벼운 마이그레이션(기존 DB에 컬럼 보강) — 이미 있으면 무시
        for stmt in (
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender TEXT",
            "ALTER TABLE transfers ADD COLUMN IF NOT EXISTS gate TEXT",
            "ALTER TABLE transfers ADD COLUMN IF NOT EXISTS driver_photo TEXT",
        ):
            try:
                conn.execute(stmt)
            except Exception:
                pass
    else:
        conn.executescript(SCHEMA)
        conn.commit()
        # 가벼운 마이그레이션(SQLite): PRAGMA로 컬럼 유무 확인 후 추가
        cols = [r[1] for r in conn.execute("PRAGMA table_info(notifications)")]
        if "sender" not in cols:
            conn.execute("ALTER TABLE notifications ADD COLUMN sender TEXT")
            conn.commit()
        tcols = [r[1] for r in conn.execute("PRAGMA table_info(transfers)")]
        if "gate" not in tcols:
            conn.execute("ALTER TABLE transfers ADD COLUMN gate TEXT")
            conn.commit()
        if "driver_photo" not in tcols:
            conn.execute("ALTER TABLE transfers ADD COLUMN driver_photo TEXT")
            conn.commit()

    # 이미 시드되어 있으면 건너뜀
    already = conn.execute("SELECT COUNT(*) AS n FROM patients").fetchone()["n"]
    if already == 0:
        _seed(conn)

    # DB 초기화 여부와 무관하게 실계정을 항상 보장
    _ensure_users(conn)

    conn.close()


def _ensure_users(conn: sqlite3.Connection) -> None:
    """서버 재시작 후 DB가 초기화돼도 실사용 계정을 항상 복원한다.
    INSERT OR IGNORE 로 중복 삽입을 방지하므로 몇 번 호출해도 안전하다."""
    now = _iso(datetime.now())
    real_users = [
        # (login_id, password, role, name, sub, patient_id)
        ("meric", "0715", "patient", "meric", "환자", "P_meric"),
    ]
    for login_id, pw, role, name, sub, pid in real_users:
        # 환자 행이 없으면 생성
        conn.execute(
            "INSERT OR IGNORE INTO patients (id, name) VALUES (?, ?)",
            (pid, name),
        )
        # 계정이 없으면 생성
        conn.execute(
            "INSERT OR IGNORE INTO accounts "
            "(login_id, password, role, name, sub, ref_id, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (login_id, pw, role, name, sub, pid, now),
        )
    conn.commit()


def _seed(conn: sqlite3.Connection) -> None:
    now = datetime.now()

    # 에이전트 / 병원
    conn.execute(
        "INSERT INTO agents (id, agency_name, contact) VALUES (?,?,?)",
        ("A001", "골든브릿지 메디투어", "+82-2-555-0101"),
    )
    conn.execute(
        "INSERT INTO hospitals (id, name, contact) VALUES (?,?,?)",
        ("H001", "서울 메디케어 국제병원", "+82-2-3700-0000"),
    )

    # 환자 3명 (로그인 데모 계정 P001 포함)
    patients = [
        ("P001", "B***", "몽골", "thyroid", "A001", "H001"),
        ("P002", "L***", "중국", "derma", "A001", "H001"),
        ("P003", "A***", "중동", "joint", "A001", "H001"),
    ]
    conn.executemany(
        "INSERT INTO patients (id, name, nationality, department, agent_id, hospital_id) VALUES (?,?,?,?,?,?)",
        patients,
    )

    # 로그인 계정 (데모) — admin 포함. 비밀번호는 데모라 평문(0000)
    accounts = [
        ("admin", "0000", "admin", "관리자", "KMTP 운영", None),
        ("patient", "0000", "patient", "환자 데모 계정", "몽골 · 갑상선 · 14박 일정", "P001"),
        ("agent", "0000", "agent", "에이전트 데모 계정", "골든브릿지 메디투어", "A001"),
        ("hospital", "0000", "hospital", "병원 데모 계정", "서울 메디케어 국제병원 · 국제진료센터", "H001"),
    ]
    conn.executemany(
        "INSERT INTO accounts (login_id, password, role, name, sub, ref_id, created_at) VALUES (?,?,?,?,?,?,?)",
        [(a[0], a[1], a[2], a[3], a[4], a[5], _iso(now)) for a in accounts],
    )

    # 예약 (각 환자 1건)
    appts = [
        ("P001", "H001", _iso(now + timedelta(days=1, hours=2)), None, None, "scheduled"),
        ("P002", "H001", _iso(now + timedelta(hours=3)), None, None, "scheduled"),
        ("P003", "H001", _iso(now - timedelta(days=2)), _iso(now - timedelta(days=2, hours=-1)), _iso(now - timedelta(days=2, hours=-3)), "done"),
    ]
    conn.executemany(
        "INSERT INTO appointments (patient_id, hospital_id, scheduled_at, actual_start, actual_end, status) VALUES (?,?,?,?,?,?)",
        appts,
    )

    # 픽업 (공항→숙소) — P001은 기사 배정/예정 상태. gate=공항 픽업 대기 게이트.
    transfers = [
        ("P001", "airport_to_stay", "김민수", "010-2345-6789", "12가 3456", "14",
         _iso(now + timedelta(minutes=90)), None, None, "scheduled"),
        ("P002", "stay_to_hospital", "이정호", "010-9876-5432", "34나 7890", None,
         _iso(now + timedelta(minutes=30)), _iso(now + timedelta(minutes=25)), None, "driver_arrived"),
        ("P003", "hospital_to_stay", "박상우", "010-1122-3344", "56다 1212", None,
         _iso(now - timedelta(days=2, hours=-4)), _iso(now - timedelta(days=2, hours=-4)), _iso(now - timedelta(days=2, hours=-4)), "completed"),
    ]
    conn.executemany(
        "INSERT INTO transfers (patient_id, type, driver_name, driver_phone, car_number, gate, pickup_scheduled, driver_arrived, boarded, status) VALUES (?,?,?,?,?,?,?,?,?,?)",
        transfers,
    )

    # 여정 이벤트 — 환자마다 진행 정도를 다르게
    # P001: 병원 방문까지 완료 (다음 = 수술·시술)
    # P002: 공항 픽업까지 완료 (다음 = 숙소 체크인)
    # P003: 회복까지 완료 (다음 = 재진)
    progress = {
        "P001": 5,  # STAGES 인덱스 0..4 완료
        "P002": 3,  # 0..2 완료
        "P003": 7,  # 0..6 완료
    }
    for pid, done_count in progress.items():
        for i in range(done_count):
            occurred = now - timedelta(days=3) + timedelta(hours=i * 6)
            conn.execute(
                "INSERT INTO journey_events (patient_id, stage, occurred_at, note) VALUES (?,?,?,?)",
                (pid, STAGES[i], _iso(occurred), None),
            )

    # 카톡 메시지 샘플 (P001 데모 계정의 대화 내역)
    p001_msgs = [
        ("KMTP 케어", "✈️ 현지에서 출발하셨습니다. 안전한 여정 되세요!", 30),
        ("KMTP 운영관리자",
         "🚐 [공항 픽업 안내] 김민수 기사님이 14번 게이트 앞에서 기다리고 있습니다.\n"
         "• 차량번호: 12가 3456\n• 기사 연락처: 010-2345-6789\n"
         "게이트로 나오시면 기사님이 도와드립니다.", 26),
        ("기사 김민수", "안녕하세요! 14번 게이트 앞에서 기다리고 있습니다 🚐", 25),
        ("KMTP 케어", "🚐 공항 픽업이 완료되었습니다. 숙소로 이동합니다.", 24),
        ("KMTP 케어", "🏨 회복스테이 체크인 완료. 편히 쉬세요.", 20),
        ("KMTP 케어", "🏥 병원에 도착하셨습니다. 국제진료센터에서 안내해 드립니다.", 6),
    ]
    for sender, content, hrs in p001_msgs:
        conn.execute(
            "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,?,?)",
            ("P001", "patient", "in_app", content, _iso(now - timedelta(hours=hrs)), 1, sender),
        )

    # P002 공항 픽업 완료 알림
    conn.execute(
        "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,?,?)",
        ("P002", "patient", "in_app", "🚐 공항 픽업이 완료되었습니다. 숙소로 이동합니다.",
         _iso(now - timedelta(hours=2)), 0, "KMTP 케어"),
    )

    conn.commit()
