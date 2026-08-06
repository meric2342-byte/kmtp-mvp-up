"""
KMTP 백엔드 — FastAPI 앱

실행:  (backend 폴더에서, 가상환경 활성화 후)
    uvicorn main:app --reload --port 8000

문서:  http://localhost:8000/docs  (자동 생성 API 문서)
"""

import json
import os
import urllib.request
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import init_db, get_conn, STAGES


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 DB 초기화(테이블 생성 + 시드)
    init_db()
    yield


app = FastAPI(title="KMTP API", version="0.1.0", lifespan=lifespan)

# CORS 허용 출처
# - 기본: 로컬 개발(localhost:3000) + 배포된 프론트(Vercel)
# - 추가: 환경변수 ALLOWED_ORIGINS (콤마로 여러 개)로 더 넣을 수 있음
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://kmtp-mvp.vercel.app",
]
_extra = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = DEFAULT_ORIGINS + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Vercel 프리뷰 배포(https://kmtp-*.vercel.app)도 허용
    allow_origin_regex=r"https://kmtp-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _now_iso() -> str:
    return datetime.now().replace(microsecond=0).isoformat()


# b2b(Railway) 운영 콘솔로 이벤트 브리지 — 관리자가 b2b에서 SSE·웹푸시로 여정 알림 수신.
# 서버-투-서버(백엔드→백엔드), 실패해도 여정 처리에 영향 없음(best-effort).
B2B_INGEST_URL = os.getenv(
    "B2B_INGEST_URL",
    "https://kmtp-b2b-api-production.up.railway.app/notifications/ingest",
)


def _patient_name(conn, patient_id: str) -> str:
    row = conn.execute("SELECT name FROM patients WHERE id = ?", (patient_id,)).fetchone()
    return (row["name"] if row and row["name"] else patient_id)


def _forward_to_b2b(event_type: str, message: str, audience: str = "admin",
                    link: str = "/admin/insights", patient_name: str = "") -> None:
    """b2b 알림함으로 이벤트 전달(관리자 + 환자명으로 담당 에이전시 자동 라우팅). 조용히 실패."""
    try:
        data = json.dumps(
            {"audience": audience, "event_type": event_type, "message": message,
             "link": link, "patient_name": patient_name or None},
            ensure_ascii=False,
        ).encode("utf-8")
        req = urllib.request.Request(
            B2B_INGEST_URL, data=data,
            headers={"Content-Type": "application/json"}, method="POST",
        )
        urllib.request.urlopen(req, timeout=4).close()
    except Exception:
        pass  # 브리지 실패는 무시(여정 기록은 그대로 유지)


def _rows(cur) -> list[dict]:
    return [dict(r) for r in cur.fetchall()]


# ------------------------------------------------------------
# 요청 바디 모델
# ------------------------------------------------------------
class JourneyEventIn(BaseModel):
    patient_id: str
    stage: str
    note: Optional[str] = None


class NotificationIn(BaseModel):
    patient_id: str
    recipient_role: str  # patient / agent / hospital
    content: str
    channel: str = "in_app"
    sender: str = "KMTP 케어"


class DriverMessageIn(BaseModel):
    patient_id: str
    content: str


# ---- 인증/계정 ----
class LoginIn(BaseModel):
    login_id: str
    password: str


class PatientRegisterIn(BaseModel):
    login_id: str
    password: str
    name: Optional[str] = None
    nationality: Optional[str] = None
    department: Optional[str] = None


class AdminAccountIn(BaseModel):
    admin_login_id: str
    admin_password: str
    login_id: str
    password: str
    role: str  # agent | hospital
    name: Optional[str] = None
    contact: Optional[str] = None


class AdminAuthIn(BaseModel):
    admin_login_id: str
    admin_password: str


class TransferUpdate(BaseModel):
    status: str  # scheduled / driver_arrived / boarded / completed


class TransferCreate(BaseModel):
    patient_id: str
    type: str = "airport_to_stay"  # airport_to_stay / stay_to_hospital / hospital_to_stay
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    car_number: Optional[str] = None
    gate: Optional[str] = None
    pickup_scheduled: Optional[str] = None
    driver_photo: Optional[str] = None  # 기사 사진 URL(항목6: 공항도착 시 사진·전화 전달)


class InterpreterIn(BaseModel):
    patient_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    lang: Optional[str] = None
    note: Optional[str] = None


class EscrowConfirmIn(BaseModel):
    patient_id: str
    amount: Optional[float] = None


class PatientRegIn(BaseModel):
    patient_id: str
    reg_no: Optional[str] = None
    hospital: Optional[str] = None


# 단계별 카톡 메시지: stage -> (메시지 내용, 받을 역할 목록)
# 각 상황마다 친근한 카톡 메시지를 자동 발송합니다.
# 모든 단계 알림은 환자·담당 에이전트·운영관리자(admin)에게 전달한다.
# (여정 시작=depart_home 부터 admin·agent에게 알람이 가도록 admin 포함)
STAGE_MESSAGES: dict[str, tuple[str, list[str]]] = {
    "depart_home": ("✈️ 현지에서 출발하셨습니다. 안전한 여정 되세요!", ["patient", "agent", "admin"]),
    "arrive_airport": ("🛬 한국 공항에 도착하셨습니다. 픽업 기사님이 대기 중입니다.", ["patient", "agent", "admin"]),
    "airport_pickup": ("🚐 공항 픽업이 완료되었습니다. 숙소로 이동합니다.", ["patient", "agent", "hospital", "admin"]),
    "checkin_stay": ("🏨 회복스테이 체크인 완료. 편히 쉬세요.", ["patient", "agent", "admin"]),
    "visit_hospital": ("🏥 병원에 도착하셨습니다. 국제진료센터에서 안내해 드립니다.", ["patient", "agent", "hospital", "admin"]),
    "surgery": ("🩺 시술/수술이 진행되었습니다. 회복을 도와드릴게요.", ["patient", "agent", "hospital", "admin"]),
    "recovery": ("🌿 진료 종료 후 숙소로 복귀하셨습니다. 회복 잘 하세요!", ["patient", "agent", "admin"]),
    "follow_up": ("📋 재진이 완료되었습니다. 경과가 양호합니다.", ["patient", "agent", "admin"]),
    "departure": ("🛫 출국하셨습니다. 한국에서의 치료 여정을 마칩니다. 건강하세요!", ["patient", "agent", "admin"]),
}

TRANSFER_LABEL: dict[str, str] = {
    "airport_to_stay": "공항 → 숙소",
    "stay_to_hospital": "숙소 → 병원",
    "hospital_to_stay": "병원 → 숙소",
}

STAGE_LABEL: dict[str, str] = {
    "depart_home": "현지 출발",
    "arrive_airport": "공항 도착",
    "airport_pickup": "공항 픽업 완료",
    "checkin_stay": "숙소/회복스테이 체크인",
    "visit_hospital": "병원 방문",
    "surgery": "수술·시술",
    "recovery": "회복(숙소 복귀)",
    "follow_up": "재진",
    "departure": "출국",
}


# ------------------------------------------------------------
# 기본 / 메타
# ------------------------------------------------------------
@app.get("/health")
def health():
    return {"ok": True, "time": _now_iso()}


@app.get("/stages")
def stages():
    """여정 단계 목록 (키 + 한글 라벨)."""
    return [{"key": s, "label": STAGE_LABEL.get(s, s)} for s in STAGES]


# ------------------------------------------------------------
# 환자 / 에이전트 / 병원
# ------------------------------------------------------------
@app.get("/patients")
def list_patients(agent_id: Optional[str] = None, hospital_id: Optional[str] = None):
    conn = get_conn()
    q = "SELECT * FROM patients"
    params: list = []
    conds = []
    if agent_id:
        conds.append("agent_id = ?")
        params.append(agent_id)
    if hospital_id:
        conds.append("hospital_id = ?")
        params.append(hospital_id)
    if conds:
        q += " WHERE " + " AND ".join(conds)
    rows = _rows(conn.execute(q, params))
    conn.close()
    return rows


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "patient not found")
    return dict(row)


@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "agent not found")
    return dict(row)


@app.get("/hospitals/{hospital_id}")
def get_hospital(hospital_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM hospitals WHERE id = ?", (hospital_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "hospital not found")
    return dict(row)


# ------------------------------------------------------------
# 여정 (journey_events)
# ------------------------------------------------------------
@app.get("/journey/{patient_id}")
def get_journey(patient_id: str):
    """환자의 완료된 단계 + 현재 단계 계산."""
    conn = get_conn()
    events = _rows(
        conn.execute(
            "SELECT * FROM journey_events WHERE patient_id = ? ORDER BY id",
            (patient_id,),
        )
    )
    conn.close()
    done_stages = [e["stage"] for e in events]
    # 현재 단계 = 아직 완료되지 않은 첫 단계
    current = next((s for s in STAGES if s not in done_stages), None)
    return {
        "patient_id": patient_id,
        "events": events,
        "done_stages": done_stages,
        "current_stage": current,
    }


@app.post("/journey")
def add_journey_event(body: JourneyEventIn):
    """단계 진행 기록 + 규칙에 따른 알림 자동 생성."""
    if body.stage not in STAGES:
        raise HTTPException(400, f"unknown stage: {body.stage}")

    conn = get_conn()
    now = _now_iso()
    cur = conn.execute(
        "INSERT INTO journey_events (patient_id, stage, occurred_at, note) VALUES (?,?,?,?)",
        (body.patient_id, body.stage, now, body.note),
    )
    event_id = cur.lastrowid

    # 상황별 카톡 메시지 자동 발송
    created_notifications = []
    if body.stage == "arrive_airport":
        # 공항 도착 → 운영관리자가 배정한 픽업 기사·차량·게이트 정보를 상세히 안내(알림).
        tr = conn.execute(
            "SELECT driver_name, driver_phone, car_number, gate FROM transfers "
            "WHERE patient_id = ? AND type = 'airport_to_stay' ORDER BY id DESC LIMIT 1",
            (body.patient_id,),
        ).fetchone()
        if tr and (tr["driver_name"] or tr["car_number"]):
            gate_txt = f"{tr['gate']}번 게이트" if tr["gate"] else "안내된 게이트"
            content = (
                f"🚐 [공항 픽업 안내] {tr['driver_name'] or '픽업'} 기사님이 {gate_txt} 앞에서 기다리고 있습니다.\n"
                f"• 차량번호: {tr['car_number'] or '-'}\n"
                f"• 기사 연락처: {tr['driver_phone'] or '-'}\n"
                f"게이트로 나오시면 기사님이 도와드립니다."
            )
        else:
            content = "🚐 공항 픽업 기사님이 대기 중입니다. 잠시만 기다려 주세요."
        # 환자에게 알림 + 에이전트·운영관리자에게도 공유. 발신자 = 운영관리자.
        for role in ("patient", "agent", "admin"):
            ncur = conn.execute(
                "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                (body.patient_id, role, "in_app", content, now, "KMTP 운영관리자"),
            )
            created_notifications.append(ncur.lastrowid)
    else:
        msg = STAGE_MESSAGES.get(body.stage)
        if msg:
            content, roles = msg
            for role in roles:
                ncur = conn.execute(
                    "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                    (body.patient_id, role, "in_app", content, now, "KMTP 케어"),
                )
                created_notifications.append(ncur.lastrowid)

    pname = _patient_name(conn, body.patient_id)
    conn.commit()
    conn.close()
    # b2b 관리자 콘솔로 여정 이벤트 브리지(여정 시작 포함) → SSE·웹푸시
    _forward_to_b2b("여정", f"{pname}님 여정 진행: {STAGE_LABEL.get(body.stage, body.stage)}", link="/admin/insights", patient_name=pname)
    return {"event_id": event_id, "notifications": created_notifications}


# ------------------------------------------------------------
# 픽업 (transfers)
# ------------------------------------------------------------
@app.get("/transfers")
def list_transfers(patient_id: Optional[str] = None):
    conn = get_conn()
    if patient_id:
        rows = _rows(
            conn.execute("SELECT * FROM transfers WHERE patient_id = ?", (patient_id,))
        )
    else:
        rows = _rows(conn.execute("SELECT * FROM transfers"))
    conn.close()
    return rows


@app.post("/transfers")
def create_transfer(body: TransferCreate):
    """운영자(admin)가 픽업 기사 정보를 배정/수정한다(환자+이동유형 기준 upsert).
    이후 공항도착·탑승 이벤트 알림에 이 기사 정보(이름·차량·연락처·게이트)가 포함된다."""
    conn = get_conn()
    row = conn.execute(
        "SELECT id FROM transfers WHERE patient_id = ? AND type = ? ORDER BY id DESC LIMIT 1",
        (body.patient_id, body.type),
    ).fetchone()
    if row:
        conn.execute(
            "UPDATE transfers SET driver_name=?, driver_phone=?, car_number=?, gate=?, pickup_scheduled=?, driver_photo=? WHERE id=?",
            (body.driver_name, body.driver_phone, body.car_number, body.gate, body.pickup_scheduled, body.driver_photo, row["id"]),
        )
        tid = row["id"]
    else:
        cur = conn.execute(
            "INSERT INTO transfers (patient_id, type, driver_name, driver_phone, car_number, gate, pickup_scheduled, driver_photo, status) "
            "VALUES (?,?,?,?,?,?,?,?, 'scheduled')",
            (body.patient_id, body.type, body.driver_name, body.driver_phone, body.car_number, body.gate, body.pickup_scheduled, body.driver_photo),
        )
        tid = cur.lastrowid
    conn.commit()
    out = dict(conn.execute("SELECT * FROM transfers WHERE id=?", (tid,)).fetchone())
    conn.close()
    return out


@app.patch("/transfers/{transfer_id}")
def update_transfer(transfer_id: int, body: TransferUpdate):
    conn = get_conn()
    now = _now_iso()
    # 상태에 따라 해당 시각 컬럼도 채움
    col = {"driver_arrived": "driver_arrived", "boarded": "boarded"}.get(body.status)
    if col:
        conn.execute(
            f"UPDATE transfers SET status = ?, {col} = ? WHERE id = ?",
            (body.status, now, transfer_id),
        )
    else:
        conn.execute(
            "UPDATE transfers SET status = ? WHERE id = ?", (body.status, transfer_id)
        )

    row = conn.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "transfer not found")

    kind = TRANSFER_LABEL.get(row["type"], "이동")
    sender = f"기사 {row['driver_name']}" if row["driver_name"] else "기사"
    # 기사 연락처 안내(환자가 기사와 직접 소통할 수 있도록 이름·차량·전화 포함)
    driver_line = (
        f"기사 {row['driver_name'] or '-'} · 차량 {row['car_number'] or '-'} · 연락처 {row['driver_phone'] or '-'}"
    )

    # '기사 도착(driver_arrived)' 시: 환자에게 기사 연락처 안내 + 관리자·에이전트 공유
    if body.status == "driver_arrived":
        roles = ["patient", "agent", "admin"]
        content = f"🚕 [{kind}] 기사님이 도착했습니다.\n{driver_line}\n전화·메시지로 연락하실 수 있습니다."
        for role in roles:
            conn.execute(
                "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                (row["patient_id"], role, "in_app", content, now, "KMTP 운영관리자"),
            )

    # '탑승 완료(boarded)' 시 알림 생성 → 환자·에이전트·운영관리자(+병원행이면 병원)
    if body.status == "boarded":
        roles = ["patient", "agent", "admin"]
        if row["type"] == "stay_to_hospital":
            roles.append("hospital")
        content = f"🚗 [{kind}] 차량 탑승이 완료되었습니다.\n{driver_line}"
        for role in roles:
            conn.execute(
                "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                (row["patient_id"], role, "in_app", content, now, sender),
            )

    pname = _patient_name(conn, row["patient_id"])
    conn.commit()
    conn.close()
    # 배차/픽업/기사 이벤트를 b2b 관리자 콘솔로 브리지(기사 연락처 포함)
    if body.status in ("driver_arrived", "boarded"):
        label = "기사 도착" if body.status == "driver_arrived" else "탑승 완료"
        _forward_to_b2b("픽업", f"{pname}님 [{kind}] {label} · {driver_line}", link="/admin/insights", patient_name=pname)
    return dict(row)


# ------------------------------------------------------------
# 통역사 (interpreters) — 운영자가 환자별 통역사를 배정한다(환자 1인당 1건 업서트).
# ------------------------------------------------------------
@app.get("/interpreters")
def list_interpreters(patient_id: Optional[str] = None):
    conn = get_conn()
    if patient_id:
        rows = _rows(conn.execute("SELECT * FROM interpreters WHERE patient_id = ? ORDER BY id DESC", (patient_id,)))
    else:
        rows = _rows(conn.execute("SELECT * FROM interpreters ORDER BY id DESC"))
    conn.close()
    return rows


@app.post("/interpreters")
def upsert_interpreter(body: InterpreterIn):
    """운영자(admin)가 통역사 정보를 배정/수정한다. 배정 즉시 환자·에이전트·관리자에 안내 알림."""
    conn = get_conn()
    now = _now_iso()
    try:
        row = conn.execute(
            "SELECT id FROM interpreters WHERE patient_id = ? ORDER BY id DESC LIMIT 1", (body.patient_id,)
        ).fetchone()
        if row:
            conn.execute(
                "UPDATE interpreters SET name=?, phone=?, lang=?, note=? WHERE id=?",
                (body.name, body.phone, body.lang, body.note, row["id"]),
            )
            iid = row["id"]
        else:
            cur = conn.execute(
                "INSERT INTO interpreters (patient_id, name, phone, lang, note, created_at) VALUES (?,?,?,?,?,?)",
                (body.patient_id, body.name, body.phone, body.lang, body.note, now),
            )
            iid = cur.lastrowid

        # 배정 안내 알림(환자가 통역사와 직접 소통할 수 있도록 이름·언어·연락처 포함)
        if body.name or body.phone:
            lang_txt = f"({body.lang})" if body.lang else ""
            content = (
                f"🗣️ [통역사 배정] {body.name or '통역사'}님{lang_txt}이 배정되었습니다.\n"
                f"• 연락처: {body.phone or '-'}"
                + (f"\n• 비고: {body.note}" if body.note else "")
            )
            for role in ("patient", "agent", "admin"):
                conn.execute(
                    "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                    (body.patient_id, role, "in_app", content, now, "KMTP 운영관리자"),
                )
        pname = _patient_name(conn, body.patient_id)
        conn.commit()
        out = dict(conn.execute("SELECT * FROM interpreters WHERE id=?", (iid,)).fetchone())
    finally:
        conn.close()
    if body.name or body.phone:
        _forward_to_b2b("통역", f"{pname}님 통역사 배정: {body.name or '-'} · {body.lang or '-'} · {body.phone or '-'}",
                        link="/admin/journey", patient_name=pname)
    return out


# ------------------------------------------------------------
# 환자 병원 등록번호 (patient_registration) — 병원이 발급한 환자별 등록번호를
# 운영자가 저장/조회한다(환자 1인당 1건 업서트). 병원 도착 전 환자에게 WhatsApp으로 전달.
# ------------------------------------------------------------
@app.get("/patient-registration")
def get_patient_registration(patient_id: Optional[str] = None):
    conn = get_conn()
    if patient_id:
        rows = _rows(conn.execute("SELECT * FROM patient_registration WHERE patient_id = ? ORDER BY id DESC", (patient_id,)))
    else:
        rows = _rows(conn.execute("SELECT * FROM patient_registration ORDER BY id DESC"))
    conn.close()
    return rows


@app.post("/patient-registration")
def upsert_patient_registration(body: PatientRegIn):
    """운영자가 병원 발급 환자 등록번호를 저장/수정(환자별 1건)."""
    conn = get_conn()
    now = _now_iso()
    try:
        row = conn.execute(
            "SELECT id FROM patient_registration WHERE patient_id = ? ORDER BY id DESC LIMIT 1", (body.patient_id,)
        ).fetchone()
        if row:
            conn.execute("UPDATE patient_registration SET reg_no=?, hospital=? WHERE id=?",
                         (body.reg_no, body.hospital, row["id"]))
            rid = row["id"]
        else:
            cur = conn.execute(
                "INSERT INTO patient_registration (patient_id, reg_no, hospital, created_at) VALUES (?,?,?,?)",
                (body.patient_id, body.reg_no, body.hospital, now),
            )
            rid = cur.lastrowid
        conn.commit()
        out = dict(conn.execute("SELECT * FROM patient_registration WHERE id=?", (rid,)).fetchone())
    finally:
        conn.close()
    return out


# ------------------------------------------------------------
# 에스크로 (escrow) — 예치 확정 시 환자·에이전트·관리자에 실시간 알림 + b2b 브리지
# ------------------------------------------------------------
@app.post("/escrow/confirm")
def escrow_confirm(body: EscrowConfirmIn):
    """환자가 에스크로 예치를 완료하면 확정 알림을 생성한다(항목4: 에스크로 확정 알람)."""
    conn = get_conn()
    now = _now_iso()
    try:
        amt = f" (₩{int(body.amount):,})" if body.amount else ""
        content = f"🔒 [에스크로 확정] 결제금{amt}이 KMTP 에스크로에 안전하게 예치되었습니다. 여정을 시작합니다."
        for role in ("patient", "agent", "admin"):
            conn.execute(
                "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
                (body.patient_id, role, "in_app", content, now, "KMTP 운영관리자"),
            )
        pname = _patient_name(conn, body.patient_id)
        conn.commit()
    finally:
        conn.close()
    _forward_to_b2b("에스크로", f"{pname}님 에스크로 예치 확정{(' ₩'+format(int(body.amount),',')) if body.amount else ''}",
                    link="/admin/insights", patient_name=pname)
    return {"ok": True}


# ------------------------------------------------------------
# 예약 (appointments)
# ------------------------------------------------------------
@app.get("/appointments")
def list_appointments(patient_id: Optional[str] = None, hospital_id: Optional[str] = None):
    conn = get_conn()
    q = "SELECT * FROM appointments"
    params: list = []
    conds = []
    if patient_id:
        conds.append("patient_id = ?")
        params.append(patient_id)
    if hospital_id:
        conds.append("hospital_id = ?")
        params.append(hospital_id)
    if conds:
        q += " WHERE " + " AND ".join(conds)
    rows = _rows(conn.execute(q, params))
    conn.close()
    return rows


# ------------------------------------------------------------
# 알림 (notifications)
# ------------------------------------------------------------
@app.get("/notifications")
def list_notifications(
    recipient_role: Optional[str] = None,
    patient_id: Optional[str] = None,
    unread_only: bool = False,
):
    conn = get_conn()
    q = "SELECT * FROM notifications"
    params: list = []
    conds = []
    if recipient_role:
        conds.append("recipient_role = ?")
        params.append(recipient_role)
    if patient_id:
        conds.append("patient_id = ?")
        params.append(patient_id)
    if unread_only:
        conds.append("read = 0")
    if conds:
        q += " WHERE " + " AND ".join(conds)
    q += " ORDER BY id DESC"
    rows = _rows(conn.execute(q, params))
    conn.close()
    return rows


@app.post("/notifications")
def add_notification(body: NotificationIn):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
        (body.patient_id, body.recipient_role, body.channel, body.content, _now_iso(), body.sender),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.post("/messages/driver")
def send_driver_message(body: DriverMessageIn):
    """환자가 기사에게 카톡 메시지 전송 → 내 말풍선 저장 + 기사 자동 답장."""
    conn = get_conn()
    now = _now_iso()
    # 환자 본인이 보낸 메시지 (오른쪽 말풍선, sender='나')
    conn.execute(
        "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,1,?)",
        (body.patient_id, "patient", "in_app", body.content, now, "나"),
    )
    # 담당 기사 이름 조회 후 자동 답장
    tr = conn.execute(
        "SELECT driver_name FROM transfers WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
        (body.patient_id,),
    ).fetchone()
    driver = f"기사 {tr['driver_name']}" if tr and tr["driver_name"] else "기사"
    conn.execute(
        "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read, sender) VALUES (?,?,?,?,?,0,?)",
        (body.patient_id, "patient", "in_app", "네, 확인했습니다! 곧 도착하겠습니다 🚐", now, driver),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = get_conn()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ------------------------------------------------------------
# 인증 / 계정 관리
# ------------------------------------------------------------
def _account_dict(row) -> dict:
    """DB 계정 행 → 프론트 Account 형태."""
    return {
        "id": row["ref_id"] or row["login_id"].upper(),
        "loginId": row["login_id"],
        "role": row["role"],
        "name": row["name"],
        "sub": row["sub"],
    }


def _next_id(conn, prefix: str, table: str) -> str:
    """P001/A001/H001 식 다음 ID 생성."""
    rows = conn.execute(f"SELECT id FROM {table}").fetchall()
    maxn = 0
    for r in rows:
        v = r["id"]
        if v and v.startswith(prefix):
            try:
                maxn = max(maxn, int(v[len(prefix):]))
            except ValueError:
                pass
    return f"{prefix}{maxn + 1:03d}"


def _is_admin(conn, login_id: str, password: str) -> bool:
    row = conn.execute(
        "SELECT * FROM accounts WHERE login_id = ? AND role = 'admin'",
        (login_id.strip().lower(),),
    ).fetchone()
    return bool(row and row["password"] == password)


@app.post("/auth/login")
def auth_login(body: LoginIn):
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM accounts WHERE login_id = ?", (body.login_id.strip().lower(),)
    ).fetchone()
    conn.close()
    if not row or row["password"] != body.password:
        raise HTTPException(401, "아이디 또는 비밀번호가 올바르지 않습니다")
    return _account_dict(row)


@app.post("/auth/register/patient")
def auth_register_patient(body: PatientRegisterIn):
    """환자 셀프 회원가입 (누구나 가능)."""
    lid = body.login_id.strip().lower()
    if not lid or len(body.password) < 4:
        raise HTTPException(400, "아이디와 4자 이상 비밀번호가 필요합니다")
    conn = get_conn()
    try:
        if conn.execute("SELECT 1 FROM accounts WHERE login_id = ?", (lid,)).fetchone():
            raise HTTPException(409, "이미 사용 중인 아이디입니다")
        pid = _next_id(conn, "P", "patients")
        name = body.name or f"{lid} 님"
        conn.execute(
            "INSERT INTO patients (id, name, nationality, department, agent_id, hospital_id) VALUES (?,?,?,?,?,?)",
            (pid, name, body.nationality, body.department, None, None),
        )
        sub = " · ".join([x for x in [body.nationality, body.department] if x]) or "신규 환자"
        conn.execute(
            "INSERT INTO accounts (login_id, password, role, name, sub, ref_id, created_at) VALUES (?,?,?,?,?,?,?)",
            (lid, body.password, "patient", name, sub, pid, _now_iso()),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM accounts WHERE login_id = ?", (lid,)).fetchone()
        return _account_dict(row)
    finally:
        conn.close()


@app.post("/auth/accounts")
def admin_create_account(body: AdminAccountIn):
    """관리자만 에이전트/병원 계정 생성."""
    conn = get_conn()
    if not _is_admin(conn, body.admin_login_id, body.admin_password):
        conn.close()
        raise HTTPException(403, "관리자 권한이 필요합니다")
    if body.role not in ("agent", "hospital"):
        conn.close()
        raise HTTPException(400, "agent 또는 hospital만 생성할 수 있습니다")
    lid = body.login_id.strip().lower()
    if not lid or len(body.password) < 4:
        conn.close()
        raise HTTPException(400, "아이디와 4자 이상 비밀번호가 필요합니다")
    if conn.execute("SELECT 1 FROM accounts WHERE login_id = ?", (lid,)).fetchone():
        conn.close()
        raise HTTPException(409, "이미 사용 중인 아이디입니다")
    name = body.name or lid
    if body.role == "agent":
        rid = _next_id(conn, "A", "agents")
        conn.execute(
            "INSERT INTO agents (id, agency_name, contact) VALUES (?,?,?)",
            (rid, name, body.contact),
        )
    else:
        rid = _next_id(conn, "H", "hospitals")
        conn.execute(
            "INSERT INTO hospitals (id, name, contact) VALUES (?,?,?)",
            (rid, name, body.contact),
        )
    conn.execute(
        "INSERT INTO accounts (login_id, password, role, name, sub, ref_id, created_at) VALUES (?,?,?,?,?,?,?)",
        (lid, body.password, body.role, name, name, rid, _now_iso()),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM accounts WHERE login_id = ?", (lid,)).fetchone()
    conn.close()
    return _account_dict(row)


@app.post("/auth/accounts/list")
def admin_list_accounts(body: AdminAuthIn):
    """관리자만 전체 계정 목록 조회."""
    conn = get_conn()
    if not _is_admin(conn, body.admin_login_id, body.admin_password):
        conn.close()
        raise HTTPException(403, "관리자 권한이 필요합니다")
    rows = _rows(
        conn.execute(
            "SELECT login_id, role, name, sub, ref_id, created_at FROM accounts ORDER BY created_at, login_id"
        )
    )
    conn.close()
    return rows
