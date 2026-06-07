"""
KMTP 백엔드 — FastAPI 앱

실행:  (backend 폴더에서, 가상환경 활성화 후)
    uvicorn main:app --reload --port 8000

문서:  http://localhost:8000/docs  (자동 생성 API 문서)
"""

import os
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


class TransferUpdate(BaseModel):
    status: str  # scheduled / driver_arrived / boarded / completed


# 단계별 알림 규칙: stage -> 알림 받을 역할 목록
NOTIFY_RULES: dict[str, list[str]] = {
    "airport_pickup": ["patient", "agent", "hospital"],   # 공항 픽업 완료
    "visit_hospital": ["patient", "agent", "hospital"],   # 병원행 도착
    "surgery": ["patient", "agent", "hospital"],          # 시술 시작/종료
    "recovery": ["patient", "agent"],                     # 진료 종료(숙소 복귀)
    "follow_up": ["patient", "agent"],
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

    # 알림 규칙 적용
    created_notifications = []
    for role in NOTIFY_RULES.get(body.stage, []):
        content = f"[{STAGE_LABEL.get(body.stage, body.stage)}] 단계가 진행되었습니다."
        ncur = conn.execute(
            "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read) VALUES (?,?,?,?,?,0)",
            (body.patient_id, role, "in_app", content, now),
        )
        created_notifications.append(ncur.lastrowid)

    conn.commit()
    conn.close()
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

    # '탑승 완료(boarded)' 시 알림 생성 (가이드: 병원행 탑승 완료 → 환자·에이전트·병원)
    if body.status == "boarded":
        roles = ["patient", "agent"]
        if row["type"] == "stay_to_hospital":
            roles.append("hospital")
        kind = TRANSFER_LABEL.get(row["type"], "이동")
        for role in roles:
            conn.execute(
                "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read) VALUES (?,?,?,?,?,0)",
                (row["patient_id"], role, "in_app", f"[{kind}] 차량 탑승이 완료되었습니다.", now),
            )

    conn.commit()
    conn.close()
    return dict(row)


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
        "INSERT INTO notifications (patient_id, recipient_role, channel, content, sent_at, read) VALUES (?,?,?,?,?,0)",
        (body.patient_id, body.recipient_role, body.channel, body.content, _now_iso()),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = get_conn()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
