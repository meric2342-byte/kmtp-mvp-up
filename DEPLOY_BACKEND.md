# 백엔드 인터넷 배포 가이드 (Render 무료 티어)

프론트는 이미 Vercel(https://kmtp-mvp.vercel.app)에 있습니다.
이 문서대로 백엔드를 올리면 "내 여정 / 에이전트 / 병원" 화면까지 라이브에서 동작합니다.

> ⚠️ 무료 티어 주의:
> - SQLite DB는 **재시작·재배포 시 초기화**됩니다(서버가 켜질 때 샘플 데이터를 다시 넣음). 데모용으론 충분합니다.
> - Render 무료 웹서비스는 **15분 미사용 시 잠들고**, 다음 접속 시 깨어나는 데 수십 초 걸릴 수 있습니다.

## 사전 준비 — GitHub에 코드 올리기

Render는 GitHub 저장소를 연결해 배포합니다. 아직 원격 저장소가 없다면:

1. GitHub에서 새 저장소 생성 (예: `kmtp-mvp-up`, private 가능)
2. 로컬에서 연결 후 푸시:
   ```powershell
   cd C:\projects\kmtp-mvp-up
   git remote add origin https://github.com/<내아이디>/kmtp-mvp-up.git
   git push -u origin main
   ```

## Render에서 배포

1. https://render.com 가입/로그인 (GitHub 계정으로 가능)
2. **New +** → **Blueprint** 선택 → 방금 올린 저장소 연결
   - 저장소 루트의 `render.yaml`을 자동으로 읽어 `kmtp-backend` 서비스를 만듭니다.
   - (Blueprint 대신 수동: **New + → Web Service**, Root Directory `backend`,
     Build `pip install -r requirements.txt`, Start `uvicorn main:app --host 0.0.0.0 --port $PORT`)
3. 배포가 끝나면 주소가 나옵니다 — 예: `https://kmtp-backend.onrender.com`
4. 확인: 브라우저에서 `https://kmtp-backend.onrender.com/health` → `{"ok": true, ...}`

## 마지막 — 프론트 연결

배포된 백엔드 주소를 받으면 (예: `https://kmtp-backend.onrender.com`):

```powershell
cd C:\projects\kmtp-mvp-up
# Vercel 프로덕션 환경변수 설정
npx vercel env add NEXT_PUBLIC_API_BASE production
#  → 값 입력: https://kmtp-backend.onrender.com
# 재배포
npx vercel --prod --yes
```

- 백엔드 CORS에는 이미 `https://kmtp-mvp.vercel.app`와 `https://kmtp-*.vercel.app`(프리뷰)가 허용돼 있습니다.
- 프론트 도메인이 다르면 Render 환경변수 `ALLOWED_ORIGINS`에 추가하세요.

> **백엔드 주소가 나오면 알려주세요 — 위 프론트 연결(환경변수+재배포)은 제가 대신 처리하겠습니다.**
