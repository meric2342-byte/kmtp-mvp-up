"""
KMTP 백엔드 — SQLite 데이터베이스 (스키마 + 시드)

- 표준 라이브러리 sqlite3만 사용 (추가 ORM 의존성 없음)
- 서버가 처음 켜질 때 테이블이 없으면 만들고 샘플 데이터를 넣습니다.
- DB 파일: backend/kmtp.db (git에는 올리지 않음 — .gitignore)
"""

import os
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "kmtp.db")

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


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
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
    pickup_scheduled TEXT,         -- 픽업 예정 시각
    driver_arrived TEXT,           -- 기사 도착 시각
    boarded TEXT,                  -- 탑승 완료 시각
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
"""


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def init_db(reset: bool = False) -> None:
    """테이블 생성 + (비어 있으면) 샘플 데이터 시드."""
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()

    # 가벼운 마이그레이션: notifications.sender 컬럼이 없으면 추가
    cols = [r[1] for r in conn.execute("PRAGMA table_info(notifications)")]
    if "sender" not in cols:
        conn.execute("ALTER TABLE notifications ADD COLUMN sender TEXT")
        conn.commit()

    # 이미 시드되어 있으면 건너뜀
    already = conn.execute("SELECT COUNT(*) AS n FROM patients").fetchone()["n"]
    if already == 0:
        _seed(conn)

    conn.close()


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

    # 픽업 (공항→숙소) — P001은 기사 배정/예정 상태
    transfers = [
        ("P001", "airport_to_stay", "김민수", "010-2345-6789", "12가 3456",
         _iso(now + timedelta(minutes=90)), None, None, "scheduled"),
        ("P002", "stay_to_hospital", "이정호", "010-9876-5432", "34나 7890",
         _iso(now + timedelta(minutes=30)), _iso(now + timedelta(minutes=25)), None, "driver_arrived"),
        ("P003", "hospital_to_stay", "박상우", "010-1122-3344", "56다 1212",
         _iso(now - timedelta(days=2, hours=-4)), _iso(now - timedelta(days=2, hours=-4)), _iso(now - timedelta(days=2, hours=-4)), "completed"),
    ]
    conn.executemany(
        "INSERT INTO transfers (patient_id, type, driver_name, driver_phone, car_number, pickup_scheduled, driver_arrived, boarded, status) VALUES (?,?,?,?,?,?,?,?,?)",
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
        ("KMTP 케어", "🛬 한국 공항에 도착하셨습니다. 픽업 기사님이 대기 중입니다.", 26),
        ("기사 김민수", "안녕하세요! 공항 1번 출구에서 기다리고 있습니다 🚐", 25),
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
