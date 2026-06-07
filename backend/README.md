# KMTP 백엔드 (FastAPI + SQLite)

환자 여정 데이터를 저장하는 로컬 백엔드입니다. 프론트(Next.js, localhost:3000)에서 호출합니다.

## 처음 한 번 — 가상환경 + 패키지 설치

Windows PowerShell 기준, `backend` 폴더에서:

```powershell
# 1) 가상환경 만들기
python -m venv .venv

# 2) 가상환경 켜기
.\.venv\Scripts\Activate.ps1

# 3) 패키지 설치
pip install -r requirements.txt
```

> `python`이 안 잡히면 설치된 전체 경로를 쓰세요. (예: `C:\Users\<이름>\AppData\Local\Programs\Python\Python312\python.exe`)

## 서버 실행

```powershell
# backend 폴더에서, 가상환경이 켜진 상태로
uvicorn main:app --reload --port 8000
```

- API 문서(자동 생성): http://localhost:8000/docs
- 헬스 체크: http://localhost:8000/health

처음 켜지면 `kmtp.db`가 만들어지고 샘플 데이터(환자 P001~P003, 에이전트 A001, 병원 H001)가 들어갑니다.

## 데이터 초기화

DB를 처음 상태로 되돌리려면 `backend/kmtp.db` 파일을 지우고 서버를 다시 켜세요.

## 주요 API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/stages` | 여정 9단계 목록 |
| GET | `/patients?agent_id=&hospital_id=` | 환자 목록 (역할별 필터) |
| GET | `/patients/{id}` | 환자 1명 |
| GET | `/journey/{patient_id}` | 완료 단계 + 현재 단계 |
| POST | `/journey` | 단계 진행 기록 (+ 알림 자동 생성) |
| GET | `/transfers?patient_id=` | 픽업 정보 |
| PATCH | `/transfers/{id}` | 픽업 상태 갱신 |
| GET | `/appointments?patient_id=&hospital_id=` | 예약 |
| GET | `/notifications?recipient_role=&patient_id=&unread_only=` | 알림 조회 |
| POST | `/notifications` | 알림 생성 |
| POST | `/notifications/{id}/read` | 알림 읽음 처리 |
