# KMTP 로컬 실행 가이드 (업그레이드판)

이 앱은 **프론트(Next.js) + 백엔드(FastAPI)** 두 개가 함께 켜져 있어야 데이터가 보입니다.
**백엔드를 먼저** 켜는 것을 권장합니다.

---

## 1) 백엔드 (FastAPI · 포트 8000)

PowerShell 창 하나를 열고:

```powershell
cd C:\projects\kmtp-mvp-up\backend

# 가상환경 켜기 (처음 한 번만 만들었다면 이후엔 이 줄만)
.\.venv\Scripts\Activate.ps1

# 서버 시작
uvicorn main:app --reload --port 8000
```

- 확인: 브라우저에서 http://localhost:8000/health → `{"ok": true, ...}`
- API 문서: http://localhost:8000/docs

> 가상환경이 아직 없다면(처음 1회):
> ```powershell
> cd C:\projects\kmtp-mvp-up\backend
> & "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv .venv
> .\.venv\Scripts\Activate.ps1
> pip install -r requirements.txt
> ```

---

## 2) 프론트 (Next.js · 포트 3000)

**다른** PowerShell 창을 열고:

```powershell
cd C:\projects\kmtp-mvp-up
npm run dev
```

- 브라우저에서 http://localhost:3000 접속

---

## 3) 시연 시나리오

1. **인트로** 화면 → "이해관계자 맵"으로 누가 연결되는지 확인 → "시작하기"
2. **환자(🧑‍⚕️)** 로그인
   - "내 여정" 탭: 타임라인·픽업 연락처·📞전화, **「단계」 완료 →** 버튼으로 진행 → 🔔 알림 배지
   - "견적·예약·신뢰" 탭: 국가 선택(페르소나·인기진료과) → 견적(환율·회복기간) → 슬롯+회복스테이 → 에스크로 → No-Surprise 증명 → Trust Score 5축·회복경과
3. **에이전트(🤝)** 로그인: 담당 환자 여정·픽업 제어, 유치업자 지원·MSO 안내 (견적·수수료 안 보임)
4. **병원(🏥)** 로그인: 예약 환자 도착 상태·예약 시간 (에이전트·수수료 안 보임)
5. 한 역할에서 단계를 진행하면 → 다른 역할의 🔔 알림에 반영 (5초 폴링)

---

## 데이터 초기화

`backend/kmtp.db` 파일을 지우고 백엔드를 다시 켜면 샘플 데이터가 새로 들어갑니다.

## 끄기

각 창에서 `Ctrl + C`.
