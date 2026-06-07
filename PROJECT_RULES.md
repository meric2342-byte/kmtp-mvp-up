# KMTP 프로젝트 규칙 (Project Rules)

> 이 파일은 KMTP 통합 업그레이드 작업의 **운영 규칙 + 회고(결정·실수·제약·속도개선)** 를 모은 문서입니다.
> 새 작업을 시작하기 전에 이 파일을 먼저 읽으세요. (`CLAUDE.md`에서 자동 로드됨)

---

## 0. 작업 방식 (Working Agreement)

- **"정말 중요한 것"만 먼저 확인**하고 나머지는 묻지 말고 진행한다.
  - 정말 중요한 것 = ① 파일/폴더 대량 삭제 ② git 강제 푸시·리셋 ③ **인터넷 배포** ④ **비용 발생·외부로 데이터가 나가는 작업**(예: 저장소 public 전환, 외부 발송).
- 일반 작업(코드 작성·수정·파일 생성·패키지 설치·로컬 실행)은 확인 없이 진행한다.
- 의미 있는 단계가 끝날 때마다 **한국어로 "무엇을 했고 어떻게 확인하는지" 짧게** 보고한다.
- **단계마다 git 커밋**한다. (커밋 메시지는 작업 번호/내용 명시)
- 사용자는 코딩 초보 → 결과 요약 + 확인 방법 위주로 설명.

---

## 1. 기술/구조 규칙

- **Next.js 16**은 학습데이터와 다를 수 있음 → 코드 작성 전 `node_modules/next/dist/docs/` 참고 (`AGENTS.md`).
- 프론트는 기존 **`"use client"` 단일 페이지 + 상태 기반 화면 전환** 패턴을 유지·확장한다 (복잡한 라우팅/인증 지양, 데모 목적).
- 디자인은 **틸(teal) 테마** 유지: `bg-primary`(#1F6F78), `text-primary-dark`(#12525A), `bg-primary-light`(#DCEEEF). `app/globals.css`의 `@theme`.
- mock 데이터는 `lib/data.ts`, 실제 저장 데이터는 **백엔드(FastAPI+SQLite, `backend/`)**.
- 프론트↔백엔드: `lib/api.ts` 헬퍼 경유. 백엔드 주소는 `NEXT_PUBLIC_API_BASE`(기본 localhost:8000).
- 백엔드는 표준 라이브러리 `sqlite3`만 사용(ORM 미사용). 스키마 변경 시 `init_db`에 **안전 마이그레이션**(`PRAGMA table_info` 후 `ALTER TABLE`) 추가.
- 화이트라벨 원칙: **환자 화면엔 KMTP를 노출하지 않음**(중립 브랜드 "Care Journey"). 에이전트/병원/관리자는 KMTP 콘솔.
- 역할별 격리: 환자에게 견적·여정, 에이전트/병원에게는 **견적·수수료 미노출**.

---

## 2. 배포/운영 규칙

- **프론트 재배포:** `npx vercel --prod --yes` (프로젝트 루트).
- **백엔드 재배포:** `& "C:\Users\user\AppData\Local\Programs\render\render.exe" deploys create srv-d8ifpau7r5hc73cs9gmg --confirm`
  - ⚠️ Render는 저장소를 **URL로 연결**해서 `git push` 자동배포 웹훅이 **없음** → 반드시 수동 트리거.
- 환경변수 변경(예: `NEXT_PUBLIC_API_BASE`)은 **빌드 시 주입**되므로 변경 후 **재배포 필수**.
- 라이브 주소: 프론트 https://kmtp-mvp.vercel.app · 백엔드 https://kmtp-backend.onrender.com
- 저장소: https://github.com/meric2342-byte/kmtp-mvp-up (public, main)

---

## 3. 회고 — AI가 틀렸던 순간 → 규칙에 추가할 것

> 같은 실수를 반복하지 않기 위한 규칙. 새 작업 시 반드시 확인.

| # | 틀렸던 것 | 추가 규칙 |
|---|---|---|
| R1 | `git push`하면 Render가 자동 재배포될 거라 가정했으나, URL 연결 서비스는 웹훅이 없어 **자동배포 안 됨** | 백엔드 배포는 **항상 `render deploys create`로 수동 트리거**. "push했으니 됐다"고 가정 금지. |
| R2 | 무료 CLI 배포로 **Railway(유료)부터 설치**하려 함. 사용자가 "Render CLI 있잖아"라고 정정 | 새 도구 도입 전 **사용자가 이미 쓰는/무료인 플랫폼의 CLI를 먼저 확인**. 비용 발생 옵션은 후순위 + 반드시 비용 고지. |
| R3 | 시드/스키마 변경 후 **낡은 `kmtp.db`로 테스트**해 옛 데이터가 나옴(sender 빈값) | 시드·스키마 변경을 검증할 땐 **반드시 `kmtp.db` 삭제 후 새 DB로 테스트**. |
| R4 | 새로 설치한 CLI(git/python/gh/render)를 **같은 세션 PATH에서 호출 시도**해 실패 | winget/스크립트 설치 후엔 **전체 경로로 실행**(같은 셸은 PATH 갱신 안 됨). 사용자에겐 "새 터미널" 안내. |
| R5 | private 저장소로 Render 서비스 생성 시도 → "unfetchable" 400 | Render 무료 CLI 배포는 **public 저장소 또는 GitHub App 연결**이 필요. private면 사전에 public 전환(외부 공개 = 사용자 확인) 또는 연결 안내. |

---

## 4. 회고 — 핵심 의사결정 로그 (Decision Log)

| 결정 | 내용 | 이유 |
|---|---|---|
| 작업 폴더 분리 | 업그레이드는 `C:\projects\kmtp-mvp-up`(원본 복사본, .git 포함) | 원본 데모 보존 + 안전한 백업 |
| 진행 속도 | Part 단위 묶음 진행 후 보고 | 초보자가 따라가되 너무 느리지 않게 |
| 자율 모드 | "정말 중요한 것만 확인" | 잦은 확인보다 결과 요약 선호 |
| 로그인 | 아이디(역할명)+비번 `0000` | 데모 단순화 |
| 환자 흐름 | 에스크로 완료 → 내 여정 → No-Surprise → 신뢰 | 결제 후 여정 추적을 자연스럽게 강조 |
| 카톡 | 실제 알림톡(유료·심사) 대신 **말풍선 UI 시뮬레이션** | 비용 없이 데모 효과 |
| 배포 | 웹 대시보드 대신 **CLI** (사용자가 로그인만) | 사용자 요청 — 클릭 최소화 |
| 호스팅 | Railway(유료) 대신 **Render(무료)** | 비용 0 |
| 저장소 공개 | private → **public** 전환 | Render 무료가 private fetch 불가 (mock 데이터라 위험 낮음) |
| 계정 권한 | 환자=셀프 가입, 에이전트·병원=**admin만** | 신뢰 인프라 운영 모델 반영 |

---

## 5. 회고 — 외부 서비스의 예상 못한 제약 (Constraints)

- **Windows 환경:** git/python/gh/Render CLI 미설치 → winget/직접 다운로드로 설치. **설치 후 같은 세션 PATH 미갱신**(전체 경로 사용).
- **Microsoft Store `python.exe` 스텁:** 진짜 파이썬이 아닌 가짜 실행파일이 PATH에 먼저 잡힘 → winget으로 실설치 후 `%LOCALAPPDATA%\Programs\Python\Python312\python.exe` 사용.
- **PowerShell `-NonInteractive`:** 브라우저 로그인(`gh auth login`, `render login`, `vercel login`)은 **하네스에서 실행 불가** → 사용자가 자기 터미널에서 직접 수행.
- **Vercel:** `NEXT_PUBLIC_*`는 **빌드 타임 주입** → 값 바꾸면 재배포 필요. 누구나 보임(민감정보 금지).
- **Render 무료 티어:** ① URL 연결 시 **push 자동배포 웹훅 없음**(수동 deploy) ② **15분 미사용 시 슬립**(첫 접속 30~60초) ③ **SQLite 휘발성**(재시작/재배포 시 초기화 → 시드 재생성, 가입 데이터 소실) ④ private 저장소 fetch 불가.
- **Railway:** 무료 티어 종료(체험 크레딧 후 과금).
- **Git on Windows:** `LF will be replaced by CRLF` 경고 다수 → 무해(무시).

---

## 6. 회고 — 다음에 더 빨리 하는 방법 (Speed-ups)

1. **툴체인 선설치:** 작업 초기에 git, gh, python, (배포면) Render CLI를 winget으로 한 번에 설치하고 **전체 경로를 변수로 저장**.
   - git `C:\Program Files\Git\cmd\git.exe` · python `C:\Users\user\AppData\Local\Programs\Python\Python312\python.exe` · gh `C:\Program Files\GitHub CLI\gh.exe` · render `C:\Users\user\AppData\Local\Programs\render\render.exe`
2. **인터랙티브 로그인은 한 번에 안내:** GitHub·Render 로그인을 처음에 모아서 사용자에게 요청.
3. **배포 레시피(정형화):**
   - 코드 public 저장소 → `gh repo create <name> --public --source=. --push`
   - 백엔드: `render services create --name ... --type web_service --repo <url> --runtime python --root-directory backend --build-command "pip install -r requirements.txt" --start-command 'uvicorn main:app --host 0.0.0.0 --port $PORT' --plan free --region singapore --health-check-path /health --confirm`
   - 프론트 연결: `vercel env add NEXT_PUBLIC_API_BASE production` → `vercel --prod --yes`
   - 워크스페이스 미설정 시: API `/v1/owners`로 ID 조회 → `render workspace set <id> --confirm`
4. **DB 변경 검증:** 항상 `Remove-Item kmtp.db` 후 새 포트로 기동해 시드 확인.
5. **빌드/커밋 배치:** 논리 단위로 `tsc --noEmit` → `npm run build` → 커밋. start-command의 `$PORT`는 PowerShell에서 **단일따옴표**로 리터럴 전달.
6. **백엔드 스모크 테스트 스크립트** 재사용: uvicorn 백그라운드 기동 → `Invoke-RestMethod`로 핵심 엔드포인트 검증 → 종료.

---

## 7. 보안/주의 (데모 한계 — 실서비스 전 반드시 개선)

- 비밀번호 **평문 저장** → 해시(bcrypt 등) 필요.
- 세션/토큰 없음 → 새로고침 시 로그아웃, admin 비번을 클라이언트 메모리 보관.
- 역할 검증 일부 클라이언트 신뢰 → 서버 권한 검증 강화 필요.
- SQLite 휘발성 → 영구 DB(Postgres) 필요.
- 실제 결제·카톡·웨어러블 미연동(전부 mock).
