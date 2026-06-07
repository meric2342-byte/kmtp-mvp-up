# KMTP — 한국 의료관광 신뢰 인프라 플랫폼 (MVP 데모)

가격잠금 견적부터 에스크로 결제, 검증된 후기까지 — **안심하고 받는 한국 의료관광**을 단계별 흐름으로 보여주는 MVP 데모입니다.

🌐 **라이브 데모:** https://kmtp-mvp.vercel.app

> ⬆️ **업그레이드판(통합):** 이 폴더는 Patient/Agent/Hospital **3역할 로그인 + 실시간 여정 추적 + Python(FastAPI) 백엔드**가 추가된 통합 버전입니다.
> 프론트와 백엔드를 함께 켜야 동작합니다 — **실행법은 [`RUN.md`](./RUN.md)** 참고. 백엔드 상세는 [`backend/README.md`](./backend/README.md).

---

## ✨ 주요 기능 (5단계 흐름)

| 단계 | 화면 | 설명 |
|---|---|---|
| 1 | **국가 · 진료과 선택** | 중국 / 몽골 / 중동 + 9개 진료과를 가격잠금 타입별로 표시 |
| 2 | **가격잠금 견적** | 진료과에 따라 카드가 3가지로 분기 |
| 3 | **예약 슬롯 선택** | mock 시간표에서 날짜 → 시간 선택 (마감 슬롯 표시) |
| 4 | **에스크로 결제** | "예치 → 치료 완료 확인 → 병원 정산" mock 화면 (실제 결제 없음) |
| 5 | **신뢰 점수 · 검증 후기** | 종합 신뢰 점수 + 항목별 점수 + 검증된 후기 |

### 가격잠금(Price Lock) 3종

- 🟢 **Full Lock (총액 고정)** — 뷰티·치과·안과·검진 → 총액이 변하지 않음
- 🔵 **Range Lock (범위 보장)** — 암·척추·관절 → 최소~최대 범위 + 변동 룰 표시
- 🟡 **No Lock (상담 견적)** — 응급·이식 → 사전 가격 잠금 불가, 상담 진행

---

## 🛠 기술 스택

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- 백엔드/DB 없이 **mock 데이터**로 동작 (`lib/data.ts`)

### 디자인 테마 (틸 계열)

| 용도 | 색상 |
|---|---|
| primary | `#1F6F78` |
| dark | `#12525A` |
| light fill | `#DCEEEF` |

색상은 `app/globals.css`의 `@theme`에 등록되어 있어 `bg-primary`, `text-primary-dark`, `bg-primary-light` 등으로 사용합니다.

---

## 📁 폴더 구조

```
KMTP-MVP/
├── app/
│   ├── layout.tsx          # 전체 골격 · 한국어 설정 · 메타데이터
│   ├── page.tsx            # 메인 페이지 (단계 흐름 상태 관리) ★
│   └── globals.css         # Tailwind + 틸 색상 테마
├── components/
│   ├── Stepper.tsx         # 상단 5단계 진행 표시줄
│   ├── StepCountryDept.tsx # 1단계: 국가 · 진료과 선택
│   ├── StepQuote.tsx       # 2단계: 가격잠금 견적 카드
│   ├── StepSlot.tsx        # 3단계: 예약 슬롯 선택
│   ├── StepEscrow.tsx      # 4단계: 에스크로 결제 (mock)
│   └── StepTrust.tsx       # 5단계: 신뢰 점수 · 검증 후기
├── lib/
│   └── data.ts             # 모든 mock 데이터 & 도메인 타입 ★
├── package.json
└── README.md
```

> ★ 표시는 가장 자주 수정하게 되는 핵심 파일입니다.

---

## 🚀 로컬에서 실행하기

### 사전 준비

- [Node.js](https://nodejs.org) (LTS 권장) 설치

### 실행

```bash
# 1) 의존성 설치 (처음 한 번)
npm install

# 2) 개발 서버 시작
npm run dev
```

브라우저에서 **http://localhost:3000** 접속 → 코드를 저장하면 자동 새로고침됩니다.
개발 서버를 끌 때는 터미널에서 `Ctrl + C`.

### 기타 명령어

```bash
npm run build   # 프로덕션 빌드 (배포 전 검증)
npm run start   # 빌드 결과 로컬 실행
npm run lint    # 코드 검사
```

---

## ☁️ 배포 (Vercel)

이 프로젝트는 **Vercel CLI 직접 배포** 방식으로 운영됩니다.

```bash
# 최초 1회만: 로그인
npx vercel login

# 코드 수정 후 재배포 (이후로는 이 한 줄)
npx vercel --prod --yes
```

- 프로젝트는 Vercel에 `kmtp-mvp`로 연결되어 있습니다.
- 배포가 끝나면 `https://kmtp-mvp.vercel.app` 주소로 즉시 반영됩니다.

---

## 🧩 mock 데이터 수정 방법

모든 데이터는 `lib/data.ts` 한 파일에 모여 있습니다. 코드를 몰라도 값만 바꾸면 화면에 바로 반영됩니다.

- `COUNTRIES` — 국가 목록
- `DEPARTMENTS` — 진료과 목록 (+ 가격잠금 타입 `lockType`)
- `QUOTES` — 진료과별 견적 (금액 · 항목 · 변동 룰)
- `SCHEDULE` — 예약 가능 날짜/시간표
- `RECOMMENDED_HOSPITAL` — 추천 병원 정보
- `TRUST` — 신뢰 점수 및 항목
- `REVIEWS` — 검증 후기

---

## ⚠️ 참고

- 본 프로젝트는 **데모(MVP)** 입니다. 실제 결제·진료 예약은 이루어지지 않습니다.
- 가격, 후기, 병원 정보 등은 모두 예시용 mock 데이터입니다.
