// ============================================================
// KMTP MVP — 목(mock) 데이터 & 도메인 타입
// 백엔드/DB 없이 이 파일의 데이터로 데모가 동작합니다.
// ============================================================

// 가격잠금 타입 3종
// - full  : 총액 고정 (뷰티·치과·안과·검진)
// - range : 최소~최대 범위 + 변동 룰 (암·척추·관절)
// - none  : 상담 견적 (응급·이식)
export type LockType = "full" | "range" | "none";

// 가격잠금 타입별 라벨/설명/색상 (UI에서 배지로 사용)
export const LOCK_META: Record<
  LockType,
  { label: string; short: string; tone: string }
> = {
  full: {
    label: "Full Lock · 총액 고정",
    short: "총액 고정",
    tone: "bg-primary text-white",
  },
  range: {
    label: "Range Lock · 범위 보장",
    short: "범위 보장",
    tone: "bg-primary-light text-primary-dark",
  },
  none: {
    label: "No Lock · 상담 견적",
    short: "상담 견적",
    tone: "bg-amber-100 text-amber-800",
  },
};

// 국가(시장)
export type Persona = {
  age: string; // 대표 연령대
  gender: string; // 성별
  interest: string; // 관심 진료과
  stay: string; // 평균 체류기간
};

export type Country = {
  id: string;
  name: string;
  flag: string; // 이모지 국기/아이콘
  note: string; // 짧은 설명
  popularDepts: string[]; // 인기 진료과 id (앞쪽일수록 인기)
  persona: Persona; // 대표 환자 페르소나
};

export const COUNTRIES: Country[] = [
  {
    id: "cn",
    name: "중국",
    flag: "🇨🇳",
    note: "뷰티·피부·검진 수요 상위",
    popularDepts: ["derma", "checkup", "dental"],
    persona: { age: "30대", gender: "여성", interest: "피부·미용", stay: "7박" },
  },
  {
    id: "mn",
    name: "몽골",
    flag: "🇲🇳",
    note: "갑상선·암 정밀치료 수요",
    popularDepts: ["thyroid", "checkup"],
    persona: { age: "40대", gender: "여성", interest: "갑상선", stay: "14박" },
  },
  {
    id: "me",
    name: "중동",
    flag: "🕌",
    note: "정형외과·척추 중증 치료",
    popularDepts: ["joint", "spine"],
    persona: { age: "50대", gender: "남성", interest: "관절·척추", stay: "21박" },
  },
  {
    id: "jp",
    name: "일본",
    flag: "🇯🇵",
    note: "미용·검진 단기 방문",
    popularDepts: ["derma", "checkup"],
    persona: { age: "30대", gender: "여성", interest: "미용·검진", stay: "4박" },
  },
  {
    id: "vn",
    name: "베트남",
    flag: "🇻🇳",
    note: "피부·성형 단기 수요",
    popularDepts: ["derma", "eye"],
    persona: { age: "20대", gender: "여성", interest: "피부·성형", stay: "5박" },
  },
  {
    id: "ru",
    name: "러시아·CIS",
    flag: "🇷🇺",
    note: "종합검진+심혈관 정밀",
    popularDepts: ["checkup", "thyroid"],
    persona: { age: "50대", gender: "남성", interest: "종합검진·심혈관", stay: "7박" },
  },
  {
    id: "us",
    name: "미국 교포",
    flag: "🇺🇸",
    note: "치과+검진 패키지",
    popularDepts: ["dental", "checkup"],
    persona: { age: "40대", gender: "남녀", interest: "치과·검진", stay: "6박" },
  },
];

// 진료과
export type Department = {
  id: string;
  name: string;
  icon: string; // 이모지 아이콘
  lockType: LockType;
  desc: string; // 한 줄 설명
  recoveryNights: number; // 표준 회복기간(박) — 회복스테이 객실 자동 매칭에 사용
};

export const DEPARTMENTS: Department[] = [
  // checkup first
  { id: "checkup", name: "종합검진", icon: "🩺", lockType: "full", desc: "프리미엄 건강검진 패키지", recoveryNights: 2 },

  // Range Lock — 범위 보장 + 변동 룰
  { id: "thyroid", name: "갑상선", icon: "🦋", lockType: "range", desc: "갑상선 결절·암 수술", recoveryNights: 14 },
  { id: "cancer", name: "암 치료", icon: "🎗️", lockType: "range", desc: "암 수술·항암·방사선", recoveryNights: 30 },
  { id: "cardio", name: "심장내과", icon: "❤️", lockType: "range", desc: "심장 스텐트·판막 수술", recoveryNights: 21 },
  { id: "spine", name: "척추", icon: "🦴", lockType: "range", desc: "디스크·협착증 수술", recoveryNights: 21 },
  { id: "joint", name: "관절·정형외과", icon: "🦵", lockType: "range", desc: "인공관절·연골 재건", recoveryNights: 21 },
  { id: "neuro", name: "신경외과", icon: "🧠", lockType: "range", desc: "뇌·신경 수술·종양", recoveryNights: 21 },

  // Full Lock — 총액 고정
  { id: "derma", name: "피부과", icon: "✨", lockType: "full", desc: "미용·피부·레이저 시술", recoveryNights: 7 },
  { id: "plastic", name: "성형외과", icon: "💎", lockType: "full", desc: "안면·코·가슴 성형", recoveryNights: 10 },
  { id: "dental", name: "치과", icon: "🦷", lockType: "full", desc: "임플란트·교정·미백", recoveryNights: 5 },
  { id: "eye", name: "안과", icon: "👁️", lockType: "full", desc: "라식·라섹·백내장", recoveryNights: 3 },
  { id: "hair", name: "모발이식", icon: "💆", lockType: "full", desc: "FUE·FUT 모발이식", recoveryNights: 5 },
  { id: "derm_adv", name: "피부과 (고급)", icon: "🌟", lockType: "full", desc: "리프팅·필러·보톡스 프리미엄", recoveryNights: 5 },
  { id: "weightloss", name: "비만클리닉", icon: "⚡", lockType: "full", desc: "체중감량·지방흡입", recoveryNights: 7 },

  // Range Lock (continued)
  { id: "fertility", name: "난임·불임", icon: "🌸", lockType: "range", desc: "시험관아기·난임 치료", recoveryNights: 7 },
  { id: "rehab", name: "재활의학", icon: "🏃", lockType: "range", desc: "수술 후 재활·물리치료", recoveryNights: 14 },

  // No Lock — 상담 견적
  { id: "transplant", name: "장기이식", icon: "🫀", lockType: "none", desc: "신장·간 이식", recoveryNights: 28 },
  { id: "emergency", name: "응급의학", icon: "🚑", lockType: "none", desc: "응급·중환자", recoveryNights: 10 },
  { id: "internal", name: "내과 일반", icon: "🏥", lockType: "none", desc: "내과 진단·치료·입원", recoveryNights: 7 },
];

// 환율 안내 (견적 화면 공통 문구)
export const EXCHANGE_NOTE =
  "표시 가격은 원화(KRW) 기준이며, 예약 시점 환율로 주요 통화 환산액을 함께 표기합니다. 입국 시점의 환율 변동은 ±3% 이내에서 자동 흡수됩니다.";

// 다통화 환산 (mock 환율 · 1 통화당 KRW) — 결제 전 자국통화 환산액 병기(No-Surprise)
export const RATES: { code: string; symbol: string; krwPer: number }[] = [
  { code: "USD", symbol: "$", krwPer: 1360 },
  { code: "CNY", symbol: "¥", krwPer: 190 },
];

// KRW → "≈ $2,574 · ¥18,421" 환산 문자열
export const formatFX = (krw: number) =>
  "≈ " +
  RATES.map(
    (r) => `${r.symbol}${Math.round(krw / r.krwPer).toLocaleString("en-US")}`,
  ).join(" · ");

// 예약금(슬롯 선결제) — 노쇼 구조적 차단. 최종 진료비에서 차감.
export const SLOT_DEPOSIT = 200000;

// 환불 정책 — 사전 고지·동의 + 자동 환불 (신뢰/No-Surprise 강화)
export const REFUND_POLICY = {
  fullRefundHours: 48,
  summary: "예약 48시간 전까지 취소하면 예약금을 100% 자동 환불합니다.",
  lines: [
    "48시간 전 취소 — 예약금 100% 자동 환불",
    "48시간 이내 취소 — 예약금 50% 환불",
    "노쇼(미방문) — 예약금 환불 불가",
  ],
};

// 호텔 객실 (체류 기간 동안 함께 예약되는 숙소)
export type RoomType = {
  id: "standard" | "deluxe" | "family";
  name: string;
  perNight: number; // 1박 요금(KRW)
  desc: string;
};

export const RECOVERY_ROOMS: RoomType[] = [
  { id: "standard", name: "스탠다드 룸", perNight: 150000, desc: "1인 · 기본 객실" },
  { id: "deluxe", name: "디럭스 룸", perNight: 250000, desc: "넓은 1인실" },
  { id: "family", name: "스위트 룸", perNight: 400000, desc: "보호자 동반 · 2베드" },
];

export const findRoom = (id: string) =>
  RECOVERY_ROOMS.find((r) => r.id === id) ?? RECOVERY_ROOMS[0];

// ============================================================
// 병원 + 시술별 가격잠금 견적 (병원 선택 → 시술별 견적 매핑)
// ============================================================

export type HospitalTreatmentQuote = {
  deptId: string;
  items: { label: string; amount: number }[];
  total: number;
  includes: string[];
};

export type HospitalOption = {
  id: string;
  name: string;
  area: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  treatments: HospitalTreatmentQuote[];
  // Extended fields (optional, mock/placeholder for now)
  address?: string;
  lat?: number;
  lng?: number;
  intro?: string;
  photos?: string[];
  doctors?: { name: string; specialty: string }[];
};

export const HOSPITALS: HospitalOption[] = [
  {
    id: "H001",
    name: "서울 메디케어 국제병원",
    area: "서울 강남 · 국제진료센터",
    rating: 4.8,
    reviewCount: 1284,
    badges: ["JCI 인증", "외국인 전담 코디", "에스크로 제휴"],
    treatments: [
      {
        deptId: "derma",
        items: [
          { label: "시술비 (레이저·리프팅 패키지)", amount: 2600000 },
          { label: "진정·마취 및 약제", amount: 350000 },
          { label: "사후관리 2회", amount: 300000 },
          { label: "통역·코디네이터", amount: 250000 },
        ],
        total: 3500000,
        includes: ["시술 전 진단", "회복 케어 키트", "귀국 후 화상 상담 1회"],
      },
      {
        deptId: "dental",
        items: [
          { label: "임플란트 2개 (픽스처+크라운)", amount: 3200000 },
          { label: "CT·진단 및 디자인", amount: 400000 },
          { label: "사후관리·통역", amount: 600000 },
        ],
        total: 4200000,
        includes: ["3D 진단", "임시 보철", "귀국 후 원격 점검"],
      },
      {
        deptId: "eye",
        items: [
          { label: "시력교정 수술 (양안)", amount: 2200000 },
          { label: "정밀 검사 패키지", amount: 350000 },
          { label: "사후관리·통역", amount: 250000 },
        ],
        total: 2800000,
        includes: ["정밀 안검사", "보호 안경", "1개월 점안제"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "프리미엄 종합검진", amount: 1100000 },
          { label: "영상검사 (MRI 포함)", amount: 300000 },
          { label: "통역·결과 상담", amount: 100000 },
        ],
        total: 1500000,
        includes: ["당일 결과 요약", "영문/현지어 리포트", "전문의 화상 상담"],
      },
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술 (기본)", amount: 6500000 },
          { label: "마취·회복 관리", amount: 800000 },
          { label: "통역·코디네이터", amount: 500000 },
        ],
        total: 7800000,
        includes: ["수술 전 정밀검사", "1주 회복 관리", "귀국 후 원격 진료"],
      },
      {
        deptId: "plastic",
        items: [
          { label: "안면 성형 (눈·코 기본)", amount: 3500000 },
          { label: "마취·수술 관리", amount: 700000 },
          { label: "사후관리 3회·통역", amount: 500000 },
        ],
        total: 4700000,
        includes: ["수술 전 상담", "사후관리 3회", "귀국 후 화상 상담"],
      },
      {
        deptId: "hair",
        items: [
          { label: "모발이식 (FUE 2,000모)", amount: 2800000 },
          { label: "마취·시술 관리", amount: 500000 },
          { label: "사후관리·통역", amount: 300000 },
        ],
        total: 3600000,
        includes: ["모발 진단", "사후 두피 케어 키트", "결과 사진 관리"],
      },
    ],
  },
  {
    id: "H002",
    name: "강남 뷰티메디컬센터",
    area: "서울 강남 · 뷰티·피부 전문",
    rating: 4.7,
    reviewCount: 892,
    badges: ["뷰티 전문", "에스크로 제휴", "한·영·중 통역"],
    treatments: [
      {
        deptId: "derma",
        items: [
          { label: "시술비 (레이저·필러 패키지)", amount: 2200000 },
          { label: "마취 크림·약제", amount: 200000 },
          { label: "사후관리 3회", amount: 450000 },
          { label: "통역", amount: 150000 },
        ],
        total: 3000000,
        includes: ["피부 진단", "맞춤 케어 키트", "화상 사후 상담 2회"],
      },
      {
        deptId: "eye",
        items: [
          { label: "라식/라섹 수술 (양안)", amount: 1900000 },
          { label: "정밀 안검사", amount: 300000 },
          { label: "사후관리", amount: 200000 },
        ],
        total: 2400000,
        includes: ["정밀 각막 검사", "보호 안경", "점안제 1개월"],
      },
      {
        deptId: "plastic",
        items: [
          { label: "안면 성형 (눈·코·윤곽)", amount: 4200000 },
          { label: "마취·수술 관리", amount: 800000 },
          { label: "사후관리 5회·통역", amount: 600000 },
        ],
        total: 5600000,
        includes: ["수술 전 3D 시뮬레이션", "사후관리 5회", "귀국 후 화상 상담 2회"],
      },
      {
        deptId: "hair",
        items: [
          { label: "모발이식 (FUE 2,500모)", amount: 3200000 },
          { label: "마취·시술 관리", amount: 600000 },
          { label: "사후관리·통역", amount: 400000 },
        ],
        total: 4200000,
        includes: ["모발 진단", "두피 케어 키트", "결과 관리 1개월"],
      },
      {
        deptId: "derm_adv",
        items: [
          { label: "리프팅·필러·보톡스 프리미엄 패키지", amount: 3500000 },
          { label: "마취·약제", amount: 400000 },
          { label: "사후관리 5회·통역", amount: 500000 },
        ],
        total: 4400000,
        includes: ["피부 정밀 진단", "맞춤 케어 키트", "화상 사후 상담 3회"],
      },
    ],
  },
  {
    id: "H003",
    name: "연세 정형척추병원",
    area: "서울 서대문 · 정형·척추 전문",
    rating: 4.9,
    reviewCount: 643,
    badges: ["정형외과 전문", "로봇수술 도입", "에스크로 제휴"],
    treatments: [
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 12500000 },
          { label: "마취·수술 관리", amount: 1500000 },
          { label: "재활 치료 2주", amount: 1000000 },
          { label: "통역·코디", amount: 500000 },
        ],
        total: 15500000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 2회"],
      },
      {
        deptId: "spine",
        items: [
          { label: "척추 디스크 수술 (단일 분절)", amount: 9500000 },
          { label: "마취·회복 관리", amount: 1200000 },
          { label: "재활 치료 1주", amount: 800000 },
          { label: "통역·코디", amount: 500000 },
        ],
        total: 12000000,
        includes: ["수술 전 MRI", "1주 재활", "귀국 후 원격 진료"],
      },
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술", amount: 7000000 },
          { label: "마취·회복 관리", amount: 900000 },
          { label: "통역·코디", amount: 500000 },
        ],
        total: 8400000,
        includes: ["수술 전 초음파", "입원 3일", "귀국 후 원격 진료"],
      },
      {
        deptId: "rehab",
        items: [
          { label: "수술 후 재활 집중 프로그램 (4주)", amount: 3500000 },
          { label: "물리치료 20회", amount: 1200000 },
          { label: "통역·코디", amount: 500000 },
        ],
        total: 5200000,
        includes: ["개인 재활 계획", "운동 처방", "귀국 후 원격 상담"],
      },
    ],
  },
  // ── 추가 병원 9개 ──
  {
    id: "H002new",
    name: "신촌 세브란스병원",
    area: "서울 서대문 · 연세의료원",
    rating: 4.9,
    reviewCount: 2156,
    badges: ["연세의료원", "갑상선·암 전문", "외국인 전담"],
    treatments: [
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술 (세브란스 프로토콜)", amount: 6800000 },
          { label: "마취·회복 관리", amount: 900000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 8500000,
        includes: ["수술 전 정밀검사", "입원 4일", "귀국 후 원격 진료"],
      },
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 13000000 },
          { label: "마취·수술 관리", amount: 1800000 },
          { label: "재활 치료 2주", amount: 1200000 },
        ],
        total: 16000000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 2회"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "프리미엄 종합검진", amount: 1300000 },
          { label: "영상검사 (MRI 포함)", amount: 350000 },
          { label: "통역·결과 상담", amount: 150000 },
        ],
        total: 1800000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
      {
        deptId: "spine",
        items: [
          { label: "척추 디스크 수술 (단일 분절)", amount: 10500000 },
          { label: "마취·회복 관리", amount: 1500000 },
          { label: "재활 치료 1주", amount: 1000000 },
        ],
        total: 13000000,
        includes: ["수술 전 MRI", "1주 재활", "귀국 후 원격 진료"],
      },
      {
        deptId: "cancer",
        items: [
          { label: "암 절제 수술 (표준)", amount: 18000000 },
          { label: "마취·입원 관리 (7일)", amount: 3500000 },
          { label: "통역·코디네이터", amount: 1000000 },
        ],
        total: 22500000,
        includes: ["수술 전 정밀검사", "항암 상담", "귀국 후 원격 진료 3회"],
      },
      {
        deptId: "cardio",
        items: [
          { label: "심장 스텐트 시술 (단일 혈관)", amount: 8000000 },
          { label: "마취·입원 관리 (5일)", amount: 2500000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 11300000,
        includes: ["수술 전 심장 정밀검사", "입원 5일", "귀국 후 원격 진료"],
      },
      {
        deptId: "neuro",
        items: [
          { label: "신경외과 수술 (기본)", amount: 15000000 },
          { label: "마취·수술 관리", amount: 3000000 },
          { label: "재활·통역", amount: 1500000 },
        ],
        total: 19500000,
        includes: ["수술 전 MRI/CT", "집중 재활", "귀국 후 원격 진료 3회"],
      },
    ],
  },
  {
    id: "H003new",
    name: "서울대학교병원",
    area: "서울 종로 · 국립대병원",
    rating: 4.9,
    reviewCount: 1893,
    badges: ["국립대병원", "로봇수술", "에스크로 제휴"],
    treatments: [
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술 (로봇수술)", amount: 7200000 },
          { label: "마취·회복 관리", amount: 1000000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 9000000,
        includes: ["수술 전 정밀검사", "입원 3일", "귀국 후 원격 진료"],
      },
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 14000000 },
          { label: "마취·수술 관리", amount: 2000000 },
          { label: "재활 치료 2주", amount: 1500000 },
        ],
        total: 17500000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 3회"],
      },
      {
        deptId: "spine",
        items: [
          { label: "척추 유합술 (단일 분절)", amount: 11500000 },
          { label: "마취·회복 관리", amount: 1500000 },
          { label: "재활·통역", amount: 1000000 },
        ],
        total: 14000000,
        includes: ["수술 전 MRI", "1주 재활", "귀국 후 원격 진료"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "국립대 프리미엄 종합검진", amount: 1500000 },
          { label: "영상검사 (MRI·CT)", amount: 350000 },
          { label: "통역·결과 상담", amount: 150000 },
        ],
        total: 2000000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
      {
        deptId: "cancer",
        items: [
          { label: "암 절제 수술 (로봇)", amount: 22000000 },
          { label: "마취·입원 관리 (7일)", amount: 4000000 },
          { label: "통역·코디네이터", amount: 1000000 },
        ],
        total: 27000000,
        includes: ["수술 전 정밀검사", "로봇수술 최소침습", "귀국 후 원격 진료 4회"],
      },
      {
        deptId: "cardio",
        items: [
          { label: "심장 판막 치환술", amount: 18000000 },
          { label: "마취·입원 관리 (7일)", amount: 3500000 },
          { label: "통역·코디네이터", amount: 1000000 },
        ],
        total: 22500000,
        includes: ["수술 전 심장정밀검사", "입원 7일", "귀국 후 원격 진료 3회"],
      },
      {
        deptId: "neuro",
        items: [
          { label: "신경외과 수술 (정밀)", amount: 20000000 },
          { label: "마취·수술 관리", amount: 4000000 },
          { label: "재활·통역", amount: 2000000 },
        ],
        total: 26000000,
        includes: ["수술 전 MRI/CT/PET", "집중 재활", "귀국 후 원격 진료 4회"],
      },
      {
        deptId: "fertility",
        items: [
          { label: "시험관아기 시술 (1주기)", amount: 4500000 },
          { label: "약제·호르몬 치료", amount: 1200000 },
          { label: "통역·코디네이터", amount: 600000 },
        ],
        total: 6300000,
        includes: ["사전 검사", "배아 동결 보관 1년", "귀국 후 원격 상담"],
      },
    ],
  },
  {
    id: "H004new",
    name: "서울성모병원",
    area: "서울 서초 · 가톨릭의료원",
    rating: 4.8,
    reviewCount: 1421,
    badges: ["가톨릭의료원", "혈액종양 전문", "에스크로 제휴"],
    treatments: [
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술", amount: 6500000 },
          { label: "마취·회복 관리", amount: 900000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 8200000,
        includes: ["수술 전 정밀검사", "입원 3일", "귀국 후 원격 진료"],
      },
      {
        deptId: "dental",
        items: [
          { label: "임플란트 2개 (픽스처+크라운)", amount: 3800000 },
          { label: "CT·진단 및 디자인", amount: 500000 },
          { label: "사후관리·통역", amount: 500000 },
        ],
        total: 4800000,
        includes: ["3D 진단", "임시 보철", "귀국 후 원격 점검"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "가톨릭 프리미엄 종합검진", amount: 1400000 },
          { label: "영상검사 (MRI 포함)", amount: 350000 },
          { label: "통역·결과 상담", amount: 150000 },
        ],
        total: 1900000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
    ],
  },
  {
    id: "H005new",
    name: "서울아산병원",
    area: "서울 송파 · 울산의대",
    rating: 5.0,
    reviewCount: 2341,
    badges: ["국내 1위 수술건수", "에스크로 제휴", "외국인 전담팀"],
    treatments: [
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 14500000 },
          { label: "마취·수술 관리", amount: 2000000 },
          { label: "재활 치료 2주", amount: 1500000 },
        ],
        total: 18000000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 3회"],
      },
      {
        deptId: "spine",
        items: [
          { label: "척추 디스크 수술 (단일 분절)", amount: 12000000 },
          { label: "마취·회복 관리", amount: 1800000 },
          { label: "재활·통역", amount: 1200000 },
        ],
        total: 15000000,
        includes: ["수술 전 MRI", "1주 재활", "귀국 후 원격 진료 2회"],
      },
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술 (아산 프로토콜)", amount: 7500000 },
          { label: "마취·회복 관리", amount: 1200000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 9500000,
        includes: ["수술 전 정밀검사", "입원 4일", "귀국 후 원격 진료"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "아산 VIP 종합검진", amount: 1600000 },
          { label: "영상검사 (MRI·CT)", amount: 400000 },
          { label: "통역·결과 상담", amount: 200000 },
        ],
        total: 2200000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
      {
        deptId: "derma",
        items: [
          { label: "피부 시술 패키지 (레이저·리프팅)", amount: 3200000 },
          { label: "마취·약제", amount: 500000 },
          { label: "사후관리 2회·통역", amount: 300000 },
        ],
        total: 4000000,
        includes: ["피부 진단", "케어 키트", "화상 사후 상담 1회"],
      },
    ],
  },
  {
    id: "H006new",
    name: "삼성서울병원",
    area: "서울 강남 · 삼성의료원",
    rating: 4.9,
    reviewCount: 1987,
    badges: ["삼성의료원", "암·정밀의학", "에스크로 제휴"],
    treatments: [
      {
        deptId: "derma",
        items: [
          { label: "피부 시술 패키지 (레이저·필러)", amount: 3400000 },
          { label: "마취·약제", amount: 500000 },
          { label: "사후관리 2회·통역", amount: 300000 },
        ],
        total: 4200000,
        includes: ["피부 진단", "케어 키트", "화상 사후 상담 1회"],
      },
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 13500000 },
          { label: "마취·수술 관리", amount: 2000000 },
          { label: "재활 치료 2주", amount: 1500000 },
        ],
        total: 17000000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 2회"],
      },
      {
        deptId: "spine",
        items: [
          { label: "척추 디스크 수술 (단일 분절)", amount: 11500000 },
          { label: "마취·회복 관리", amount: 1800000 },
          { label: "재활·통역", amount: 1200000 },
        ],
        total: 14500000,
        includes: ["수술 전 MRI", "1주 재활", "귀국 후 원격 진료"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "삼성 프리미엄 종합검진", amount: 1550000 },
          { label: "영상검사 (MRI·CT)", amount: 400000 },
          { label: "통역·결과 상담", amount: 150000 },
        ],
        total: 2100000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
    ],
  },
  {
    id: "H007new",
    name: "KMI 한국의학연구소",
    area: "서울 강남 · 검진 전문",
    rating: 4.7,
    reviewCount: 934,
    badges: ["검진 전문기관", "당일 결과", "외국인 특화"],
    treatments: [
      {
        deptId: "checkup",
        items: [
          { label: "외국인 특화 프리미엄 종합검진", amount: 850000 },
          { label: "영상검사 (MRI·초음파)", amount: 250000 },
          { label: "통역·결과 상담 (당일)", amount: 100000 },
        ],
        total: 1200000,
        includes: ["당일 결과 요약", "영문/현지어 리포트", "전문의 화상 상담"],
      },
    ],
  },
  {
    id: "H008new",
    name: "강남차병원",
    area: "서울 강남 · 미용·뷰티 전문",
    rating: 4.7,
    reviewCount: 763,
    badges: ["뷰티·미용 전문", "에스크로 제휴", "한·영·중 통역"],
    treatments: [
      {
        deptId: "derma",
        items: [
          { label: "뷰티 시술 패키지 (레이저·필러·보톡스)", amount: 2200000 },
          { label: "마취·약제", amount: 400000 },
          { label: "사후관리 3회·통역", amount: 200000 },
        ],
        total: 2800000,
        includes: ["피부 진단", "케어 키트", "화상 사후 상담 2회"],
      },
      {
        deptId: "eye",
        items: [
          { label: "시력교정 수술 (양안)", amount: 1700000 },
          { label: "정밀 안검사", amount: 300000 },
          { label: "사후관리·통역", amount: 200000 },
        ],
        total: 2200000,
        includes: ["정밀 각막 검사", "보호 안경", "점안제 1개월"],
      },
      {
        deptId: "dental",
        items: [
          { label: "임플란트 2개 (픽스처+크라운)", amount: 3100000 },
          { label: "CT·진단 및 디자인", amount: 500000 },
          { label: "사후관리·통역", amount: 300000 },
        ],
        total: 3900000,
        includes: ["3D 진단", "임시 보철", "귀국 후 원격 점검"],
      },
    ],
  },
  {
    id: "H009new",
    name: "고려대학교안암병원",
    area: "서울 성북 · 고려의대",
    rating: 4.8,
    reviewCount: 1123,
    badges: ["고려의대", "에스크로 제휴", "외국인 코디"],
    treatments: [
      {
        deptId: "thyroid",
        items: [
          { label: "갑상선 절제술", amount: 6300000 },
          { label: "마취·회복 관리", amount: 900000 },
          { label: "통역·코디네이터", amount: 800000 },
        ],
        total: 8000000,
        includes: ["수술 전 초음파·정밀검사", "입원 3일", "귀국 후 원격 진료"],
      },
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 12500000 },
          { label: "마취·수술 관리", amount: 1800000 },
          { label: "재활 치료 2주", amount: 1200000 },
        ],
        total: 15500000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료 2회"],
      },
      {
        deptId: "checkup",
        items: [
          { label: "고려대 프리미엄 종합검진", amount: 1200000 },
          { label: "영상검사 (MRI 포함)", amount: 350000 },
          { label: "통역·결과 상담", amount: 150000 },
        ],
        total: 1700000,
        includes: ["당일 결과 요약", "영문 리포트", "전문의 화상 상담"],
      },
    ],
  },
  {
    id: "H010new",
    name: "한양대학교병원",
    area: "서울 성동 · 한양의대",
    rating: 4.7,
    reviewCount: 892,
    badges: ["한양의대", "에스크로 제휴"],
    treatments: [
      {
        deptId: "derma",
        items: [
          { label: "피부 시술 패키지 (레이저·리프팅)", amount: 2600000 },
          { label: "마취·약제", amount: 400000 },
          { label: "사후관리 2회·통역", amount: 200000 },
        ],
        total: 3200000,
        includes: ["피부 진단", "케어 키트", "화상 사후 상담 1회"],
      },
      {
        deptId: "eye",
        items: [
          { label: "시력교정 수술 (양안)", amount: 2000000 },
          { label: "정밀 안검사", amount: 400000 },
          { label: "사후관리·통역", amount: 200000 },
        ],
        total: 2600000,
        includes: ["정밀 각막 검사", "보호 안경", "점안제 1개월"],
      },
      {
        deptId: "dental",
        items: [
          { label: "임플란트 2개 (픽스처+크라운)", amount: 3200000 },
          { label: "CT·진단 및 디자인", amount: 500000 },
          { label: "사후관리·통역", amount: 300000 },
        ],
        total: 4000000,
        includes: ["3D 진단", "임시 보철", "귀국 후 원격 점검"],
      },
      {
        deptId: "joint",
        items: [
          { label: "인공관절 치환술 (편측)", amount: 11500000 },
          { label: "마취·수술 관리", amount: 1800000 },
          { label: "재활 치료 2주", amount: 1200000 },
        ],
        total: 14500000,
        includes: ["수술 전 정밀검사", "2주 재활", "귀국 후 원격 진료"],
      },
    ],
  },
];

export const findHospital = (id: string | null) =>
  HOSPITALS.find((h) => h.id === id) ?? null;

// 병원에서 선택 시술들의 총 가격잠금 견적
export const hospitalTotalQuote = (hospital: HospitalOption, deptIds: string[]) =>
  hospital.treatments
    .filter((t) => deptIds.includes(t.deptId))
    .reduce((sum, t) => sum + t.total, 0);

// 헬퍼: id로 국가/진료과 찾기
export const findCountry = (id: string | null) =>
  COUNTRIES.find((c) => c.id === id) ?? null;

export const findDepartment = (id: string | null) =>
  DEPARTMENTS.find((d) => d.id === id) ?? null;

// ============================================================
// 2단계 — 가격잠금 견적 데이터
// 진료과의 lockType에 따라 견적 카드 모양이 달라집니다.
// ============================================================

// Full Lock: 총액이 고정된 견적
export type FullQuote = {
  type: "full";
  items: { label: string; amount: number }[]; // 세부 항목
  total: number; // 고정 총액 (KRW)
  includes: string[]; // 포함 사항
  validDays: number; // 가격잠금 유효기간(일)
};

// Range Lock: 최소~최대 범위 + 변동 룰
export type RangeQuote = {
  type: "range";
  base: string; // 기준 시술/수술
  min: number;
  max: number;
  rules: { factor: string; effect: string }[]; // 가격 변동 룰
  validDays: number;
};

// No Lock: 상담 견적 (사전 가격 잠금 불가)
export type NoneQuote = {
  type: "none";
  reason: string; // 가격을 미리 잠글 수 없는 이유
  steps: string[]; // 상담 진행 절차
};

export type Quote = FullQuote | RangeQuote | NoneQuote;

// 진료과 id → 견적
export const QUOTES: Record<string, Quote> = {
  // ----- Full Lock -----
  derma: {
    type: "full",
    items: [
      { label: "시술비 (레이저·리프팅 패키지)", amount: 2600000 },
      { label: "진정·마취 및 약제", amount: 350000 },
      { label: "사후관리 2회", amount: 300000 },
      { label: "통역·코디네이터", amount: 250000 },
    ],
    total: 3500000,
    includes: ["시술 전 진단", "회복 케어 키트", "귀국 후 화상 상담 1회"],
    validDays: 30,
  },
  dental: {
    type: "full",
    items: [
      { label: "임플란트 2개 (픽스처+크라운)", amount: 3200000 },
      { label: "CT·진단 및 디자인", amount: 400000 },
      { label: "사후관리·통역", amount: 600000 },
    ],
    total: 4200000,
    includes: ["3D 진단", "임시 보철", "귀국 후 원격 점검"],
    validDays: 45,
  },
  eye: {
    type: "full",
    items: [
      { label: "시력교정 수술 (양안)", amount: 2200000 },
      { label: "정밀 검사 패키지", amount: 350000 },
      { label: "사후관리·통역", amount: 250000 },
    ],
    total: 2800000,
    includes: ["정밀 안검사", "보호 안경", "1개월 점안제"],
    validDays: 30,
  },
  checkup: {
    type: "full",
    items: [
      { label: "프리미엄 종합검진", amount: 1100000 },
      { label: "영상검사 (MRI 포함)", amount: 300000 },
      { label: "통역·결과 상담", amount: 100000 },
    ],
    total: 1500000,
    includes: ["당일 결과 요약", "영문/현지어 리포트", "전문의 화상 상담"],
    validDays: 60,
  },

  // ----- Range Lock -----
  thyroid: {
    type: "range",
    base: "갑상선 절제술 (결절 크기·악성 여부에 따라 변동)",
    min: 6000000,
    max: 11000000,
    rules: [
      { factor: "악성(암) 확인 시", effect: "림프절 절제 추가 — 상한선 적용" },
      { factor: "결절 4cm 초과", effect: "수술 난이도 +1단계, 비용 상향" },
      { factor: "단순 양성 결절", effect: "하한선 근처로 확정" },
    ],
    validDays: 21,
  },
  spine: {
    type: "range",
    base: "척추 디스크/협착 수술 (분절 수에 따라 변동)",
    min: 9000000,
    max: 18000000,
    rules: [
      { factor: "단일 분절 시술", effect: "하한선 적용" },
      { factor: "다분절·유합술 필요", effect: "상한선 적용" },
      { factor: "고정용 기구(케이지) 추가", effect: "기구비 별도 합산" },
    ],
    validDays: 21,
  },
  joint: {
    type: "range",
    base: "인공관절 치환술 (편측/양측에 따라 변동)",
    min: 12000000,
    max: 22000000,
    rules: [
      { factor: "편측(한쪽) 치환", effect: "하한선 적용" },
      { factor: "양측 동시 치환", effect: "상한선 적용" },
      { factor: "재치환(재수술)", effect: "난이도 가산" },
    ],
    validDays: 21,
  },

  // ----- No Lock -----
  emergency: {
    type: "none",
    reason:
      "응급·중환자 치료는 환자 상태가 실시간으로 변하기 때문에 사전에 가격을 잠글 수 없습니다.",
    steps: [
      "응급의료 코디네이터 즉시 배정",
      "현지 의료기록 기반 1차 원격 평가",
      "도착 후 정밀 진단 → 단계별 견적 제시",
    ],
  },
  transplant: {
    type: "none",
    reason:
      "장기이식은 적합성 검사·대기·면역 관리 등 변수가 많아 상담을 통한 맞춤 견적이 필요합니다.",
    steps: [
      "이식 전문 상담팀 배정",
      "공여자/수혜자 적합성 사전 검토",
      "단계별 치료 계획 및 비용 안내",
    ],
  },
};

export const findQuote = (deptId: string | null): Quote | null =>
  deptId ? (QUOTES[deptId] ?? null) : null;

// 통화 표기 헬퍼: 1234567 → "₩1,234,567"
export const formatKRW = (n: number) => "₩" + n.toLocaleString("ko-KR");

// ============================================================
// 3단계 — 예약 슬롯 & 추천 병원 (mock)
// ============================================================

// 추천 협력병원 (데모용 고정 mock)
export type Hospital = {
  name: string;
  area: string;
  rating: number; // 5점 만점
  reviewCount: number;
  badges: string[];
};

export const RECOMMENDED_HOSPITAL: Hospital = {
  name: "서울 메디케어 국제병원",
  area: "서울 강남 · 국제진료센터",
  rating: 4.8,
  reviewCount: 1284,
  badges: ["JCI 인증", "외국인 전담 코디", "에스크로 제휴"],
};

export type CaseManager = {
  id: string;
  name: string;
  photo: string;   // placeholder
  languages: string[];
  waPhone: string; // WhatsApp number (international format, no +)
  slaNote: string;
};

export const CASE_MANAGERS: CaseManager[] = [
  {
    id: "CM001",
    name: "김도균 대표",
    photo: "/placeholder/coordinator-kim.jpg",
    languages: ["한국어", "영어", "중국어"],
    waPhone: "821055057004",
    slaNote: "총괄 코디네이터 · 픽업·배차·통역·여정 전담 · 평일 09:00–18:00",
  },
];

// mock 시간표: 날짜별 시간 슬롯 (available=false는 마감)
export type DaySlots = {
  date: string; // 표시용 날짜 라벨
  weekday: string; // 요일
  slots: { time: string; available: boolean }[];
};

export const SCHEDULE: DaySlots[] = [
  {
    date: "6월 9일",
    weekday: "월",
    slots: [
      { time: "09:30", available: true },
      { time: "11:00", available: true },
      { time: "13:30", available: false },
      { time: "15:00", available: true },
      { time: "16:30", available: true },
    ],
  },
  {
    date: "6월 10일",
    weekday: "화",
    slots: [
      { time: "09:30", available: false },
      { time: "11:00", available: true },
      { time: "13:30", available: true },
      { time: "15:00", available: false },
      { time: "16:30", available: true },
    ],
  },
  {
    date: "6월 11일",
    weekday: "수",
    slots: [
      { time: "09:30", available: true },
      { time: "11:00", available: false },
      { time: "13:30", available: true },
      { time: "15:00", available: true },
      { time: "16:30", available: false },
    ],
  },
  {
    date: "6월 12일",
    weekday: "목",
    slots: [
      { time: "09:30", available: true },
      { time: "11:00", available: true },
      { time: "13:30", available: true },
      { time: "15:00", available: true },
      { time: "16:30", available: true },
    ],
  },
  {
    date: "6월 13일",
    weekday: "금",
    slots: [
      { time: "09:30", available: false },
      { time: "11:00", available: false },
      { time: "13:30", available: true },
      { time: "15:00", available: true },
      { time: "16:30", available: true },
    ],
  },
];

// ============================================================
// 5단계 — 신뢰 점수 & 검증 후기 (mock)
// ============================================================

// 종합 신뢰 점수 (100점 만점) + 5축 항목별 점수
// bar = 막대 길이(0~100, 클수록 좋음), value = 실제 표시값
export type TrustFactor = {
  label: string;
  bar: number;
  value: string;
  desc: string;
};

export type TrustData = {
  score: number;
  factors: TrustFactor[];
};

export const TRUST: TrustData = {
  score: 94,
  factors: [
    { label: "가격잠금 준수율", bar: 98, value: "98%", desc: "잠근 가격대로 청구된 비율" },
    { label: "슬롯등록 성실도", bar: 95, value: "95%", desc: "예약 슬롯 실시간 동기화율" },
    { label: "결과지표 응답률", bar: 90, value: "90%", desc: "시술 후 결과지표 회신 비율" },
    { label: "환자 만족도", bar: 96, value: "4.8/5", desc: "검증 환자 평균 만족도" },
    { label: "합병증율 (낮을수록 좋음)", bar: 97, value: "1.8%", desc: "동일 시술군 대비 낮은 합병증율" },
  ],
};

// 회복 경과 추적 (시술 후 1주/1개월/3개월) — mock
export type RecoveryPoint = {
  phase: string;
  status: "done" | "upcoming";
  result: string;
  note: string;
};

export const RECOVERY_PROGRESS: RecoveryPoint[] = [
  { phase: "1주", status: "done", result: "양호", note: "통증 경미 · 경과 정상" },
  { phase: "1개월", status: "done", result: "양호", note: "일상 복귀 · 합병증 없음" },
  { phase: "3개월", status: "upcoming", result: "예정", note: "최종 경과 확인 예정" },
];

// 검증 후기 (에스크로 치료 완료 환자만 작성 → '검증됨' 배지)
export type Review = {
  id: string;
  name: string; // 익명 처리된 이름
  country: string; // 국가 이모지+이름
  dept: string; // 진료과
  rating: number; // 5점 만점
  date: string;
  text: string;
  verified: boolean; // 에스크로 완료 검증 여부
  hospitalId?: string;
  procedureId?: string;
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "L***",
    country: "🇨🇳 중국",
    dept: "피부과",
    rating: 5,
    date: "2026-05-21",
    text: "견적 그대로 결제돼서 추가 비용 걱정이 없었어요. 통역 코디 덕분에 편했습니다.",
    verified: true,
  },
  {
    id: "r2",
    name: "B***",
    country: "🇲🇳 몽골",
    dept: "갑상선",
    rating: 5,
    date: "2026-05-14",
    text: "수술비가 범위 안에서 확정됐고, 에스크로라 안심하고 맡겼습니다. 결과도 만족.",
    verified: true,
  },
  {
    id: "r3",
    name: "A***",
    country: "🕌 중동",
    dept: "관절·정형외과",
    rating: 4,
    date: "2026-05-03",
    text: "회복까지 코디네이터가 챙겨줬습니다. 일정이 한 번 변경된 점만 아쉬웠어요.",
    verified: true,
  },
  {
    id: "r4",
    name: "W***",
    country: "🇨🇳 중국",
    dept: "치과",
    rating: 5,
    date: "2026-04-27",
    text: "임플란트 총액 고정이라 비교하기 쉬웠어요. 사후 원격 점검까지 좋았습니다.",
    verified: true,
  },
  {
    id: "r5",
    name: "D***",
    country: "🇷🇺 러시아",
    dept: "갑상선",
    rating: 5,
    date: "2026-06-15",
    text: "갑상선 수술 후 회복까지 전담 코디가 케어해줬습니다. 범위 견적 그대로 청구되어 신뢰할 수 있었어요.",
    verified: true,
    hospitalId: "H002new",
    procedureId: "thyroid-total",
  },
  {
    id: "r6",
    name: "K***",
    country: "🇲🇳 몽골",
    dept: "종합검진",
    rating: 5,
    date: "2026-06-28",
    text: "프리미엄 검진 결과를 영문+몽골어로 받았고, 이상 소견에 대한 원격 설명까지 제공받았습니다.",
    verified: true,
    hospitalId: "H007new",
    procedureId: "checkup-premium",
  },
  {
    id: "r7",
    name: "A***",
    country: "🕌 중동",
    dept: "관절·정형외과",
    rating: 5,
    date: "2026-07-01",
    text: "인공관절 수술 후 위브리빙에서 3주 회복했습니다. 취사 가능하고 코디와 매일 소통할 수 있어 안심이었습니다.",
    verified: true,
    hospitalId: "H003new",
    procedureId: "joint-knee-tkr",
  },
  {
    id: "r8",
    name: "N***",
    country: "🇻🇳 베트남",
    dept: "피부과",
    rating: 4,
    date: "2026-07-05",
    text: "써마지 시술 가격이 예약 때와 동일하게 청구되었습니다. 통역 코디 덕분에 불편함 없이 진행했습니다.",
    verified: true,
    hospitalId: "H001",
    procedureId: "derma-thermage",
  },
];

// ============================================================
// 호텔 데이터 (10개 협력 호텔 · 각 3개 룸 타입)
// ============================================================

export type HotelRoomType = {
  id: string;
  name: string;
  perNight: number;
  desc: string;
};

export type HotelOption = {
  id: string;
  name: string;
  area: string;
  rating: number;
  rooms: HotelRoomType[];
};

export const HOTELS: HotelOption[] = [
  {
    id: "HT001",
    name: "파라다이스 시티 서울",
    area: "서울 강남",
    rating: 4.8,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 280000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 450000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 850000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT002",
    name: "롯데호텔 서울",
    area: "서울 을지로",
    rating: 4.7,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 240000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 380000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 720000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT003",
    name: "신라호텔 서울",
    area: "서울 장충동",
    rating: 4.9,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 320000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 500000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 950000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT004",
    name: "포시즌스 호텔 서울",
    area: "서울 광화문",
    rating: 5.0,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 380000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 580000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 1200000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT005",
    name: "JW 메리어트 서울",
    area: "서울 반포",
    rating: 4.8,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 290000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 440000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 820000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT006",
    name: "콘래드 서울",
    area: "서울 여의도",
    rating: 4.8,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 270000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 420000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 780000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT007",
    name: "더 스탠다드 강남",
    area: "서울 강남",
    rating: 4.6,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 180000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 280000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 500000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT008",
    name: "그랜드 힐튼 서울",
    area: "서울 홍은동",
    rating: 4.5,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 200000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 310000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 560000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT009",
    name: "노보텔 강남",
    area: "서울 강남",
    rating: 4.5,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 170000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 260000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 480000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
  {
    id: "HT010",
    name: "레스케이프 호텔",
    area: "서울 중구",
    rating: 4.7,
    rooms: [
      { id: "standard", name: "스탠다드", perNight: 230000, desc: "1인 · 기본 객실" },
      { id: "deluxe", name: "디럭스", perNight: 360000, desc: "넓은 1인실 · 시티뷰" },
      { id: "suite", name: "스위트", perNight: 680000, desc: "보호자 동반 · 2베드룸" },
    ],
  },
];

export const findHotel = (id: string | null) =>
  HOTELS.find((h) => h.id === id) ?? null;

export const findHotelRoom = (hotel: HotelOption, roomId: string) =>
  hotel.rooms.find((r) => r.id === roomId) ?? hotel.rooms[0];
