// KMTP 과별 개별 시술 카탈로그 (procedure-level)
// - deptId 는 kmtp-mvp-up/lib/data.ts 의 DEPARTMENTS.id 와 일치.
// - priceKRW: 대표 가격(원). range=true 면 min~max 범위(변동 진료).
// - 금액은 참고용 목업(mock)입니다. 실제 파트너 병원 견적으로 교체 예정.
// - 환자 플로우: 과 선택 → 이 시술 목록 표시 → 시술 클릭 → 그 시술 제공 병원 목록 → 병원 선택.

export type Procedure = {
  id: string;          // 전역 유일 id (deptId-슬러그)
  deptId: string;      // 소속 진료과
  name: string;        // 시술명(환자에게 표시)
  priceKRW: number;    // 대표가(원)
  priceMaxKRW?: number; // 있으면 범위 상한(원)
  note?: string;       // 부가 설명(선택)
  quote?: boolean;     // true = 금액 미표기, 상담 견적
};

export const PROCEDURES: Procedure[] = [
  // ── 피부과 (derma) ──
  { id: "derma-toning", deptId: "derma", name: "레이저 토닝", priceKRW: 300000 },
  { id: "derma-fraxel", deptId: "derma", name: "프락셀 레이저", priceKRW: 500000 },
  { id: "derma-thermage", deptId: "derma", name: "써마지 리프팅", priceKRW: 2500000 },
  { id: "derma-filler", deptId: "derma", name: "필러 (1cc)", priceKRW: 400000 },
  { id: "derma-botox", deptId: "derma", name: "보톡스 (부위당)", priceKRW: 200000 },

  // ── 피부과 고급 (derm_adv) ──
  { id: "dermadv-ulthera", deptId: "derm_adv", name: "울쎄라 리프팅", priceKRW: 4000000 },
  { id: "dermadv-inmode", deptId: "derm_adv", name: "인모드 리프팅", priceKRW: 2000000 },
  { id: "dermadv-rejuran", deptId: "derm_adv", name: "리쥬란 힐러", priceKRW: 600000 },
  { id: "dermadv-skinbooster", deptId: "derm_adv", name: "백옥/물광 주사", priceKRW: 150000 },

  // ── 치과 (dental) ──
  { id: "dental-implant", deptId: "dental", name: "임플란트 (1개)", priceKRW: 1500000 },
  { id: "dental-laminate", deptId: "dental", name: "라미네이트 (1개)", priceKRW: 800000 },
  { id: "dental-ortho", deptId: "dental", name: "치아교정 (전체)", priceKRW: 5000000 },
  { id: "dental-whitening", deptId: "dental", name: "전문가 미백", priceKRW: 400000 },
  { id: "dental-endo", deptId: "dental", name: "신경치료 (1치)", priceKRW: 300000 },

  // ── 안과 (eye) ──
  { id: "eye-lasik", deptId: "eye", name: "라식", priceKRW: 2000000 },
  { id: "eye-lasek", deptId: "eye", name: "라섹", priceKRW: 1800000 },
  { id: "eye-smile", deptId: "eye", name: "스마일 라식", priceKRW: 3500000 },
  { id: "eye-cataract", deptId: "eye", name: "백내장 (단초점)", priceKRW: 3000000 },
  { id: "eye-icl", deptId: "eye", name: "안내렌즈삽입술(ICL)", priceKRW: 6000000 },

  // ── 종합검진 (checkup) ──
  { id: "checkup-basic", deptId: "checkup", name: "기본 종합검진", priceKRW: 800000 },
  { id: "checkup-premium", deptId: "checkup", name: "프리미엄 종합검진", priceKRW: 2000000 },
  { id: "checkup-cancer", deptId: "checkup", name: "암 정밀검진", priceKRW: 3500000 },
  { id: "checkup-cardio", deptId: "checkup", name: "심혈관 정밀검진", priceKRW: 2500000 },

  // ── 성형외과 (plastic) ──
  { id: "plastic-rhino", deptId: "plastic", name: "코 성형", priceKRW: 4000000 },
  { id: "plastic-eyelid", deptId: "plastic", name: "쌍꺼풀", priceKRW: 1500000 },
  { id: "plastic-contour", deptId: "plastic", name: "안면윤곽", priceKRW: 8000000 },
  { id: "plastic-breast", deptId: "plastic", name: "가슴 성형", priceKRW: 10000000 },
  { id: "plastic-fatgraft", deptId: "plastic", name: "지방이식", priceKRW: 3000000 },

  // ── 모발이식 (hair) ──
  { id: "hair-fue1000", deptId: "hair", name: "FUE 모발이식 (1,000모)", priceKRW: 3000000 },
  { id: "hair-fue2000", deptId: "hair", name: "FUE 모발이식 (2,000모)", priceKRW: 5500000 },
  { id: "hair-fut", deptId: "hair", name: "FUT 모발이식", priceKRW: 4000000 },
  { id: "hair-hairline", deptId: "hair", name: "여성 헤어라인 교정", priceKRW: 4000000 },

  // ── 비만클리닉 (weightloss) ──
  { id: "weight-lipo-abdomen", deptId: "weightloss", name: "지방흡입 (복부)", priceKRW: 3500000 },
  { id: "weight-lipo-thigh", deptId: "weightloss", name: "지방흡입 (허벅지)", priceKRW: 4000000 },
  { id: "weight-carboxy", deptId: "weightloss", name: "카복시테라피 (회)", priceKRW: 200000 },
  { id: "weight-med", deptId: "weightloss", name: "비만 약물처방 (월)", priceKRW: 150000 },

  // ── 갑상선 (thyroid) ── range
  { id: "thyroid-rfa", deptId: "thyroid", name: "갑상선 결절 고주파절제(RFA)", priceKRW: 3000000 },
  { id: "thyroid-lobectomy", deptId: "thyroid", name: "갑상선 반절제술", priceKRW: 5000000, priceMaxKRW: 6000000 },
  { id: "thyroid-total", deptId: "thyroid", name: "갑상선 전절제술", priceKRW: 7000000, priceMaxKRW: 9000000 },

  // ── 척추 (spine) ── range
  { id: "spine-endo-disc", deptId: "spine", name: "디스크 내시경 수술", priceKRW: 6000000, priceMaxKRW: 8000000 },
  { id: "spine-stenosis", deptId: "spine", name: "척추관 협착증 수술", priceKRW: 8000000, priceMaxKRW: 12000000 },
  { id: "spine-adr", deptId: "spine", name: "인공디스크 치환술", priceKRW: 12000000, priceMaxKRW: 16000000 },
  { id: "spine-nerve", deptId: "spine", name: "신경성형술", priceKRW: 2500000 },

  // ── 관절·정형외과 (joint) ── range
  { id: "joint-knee-tkr", deptId: "joint", name: "인공관절 치환술 (무릎)", priceKRW: 10000000, priceMaxKRW: 14000000 },
  { id: "joint-rotator", deptId: "joint", name: "회전근개 봉합술 (어깨)", priceKRW: 5000000, priceMaxKRW: 7000000 },
  { id: "joint-meniscus", deptId: "joint", name: "반월상 연골 수술", priceKRW: 3500000 },
  { id: "joint-acl", deptId: "joint", name: "십자인대 재건술", priceKRW: 4500000, priceMaxKRW: 6000000 },

  // ── 암 치료 (cancer) ── range
  { id: "cancer-surgery", deptId: "cancer", name: "고형암 수술", priceKRW: 15000000, priceMaxKRW: 25000000 },
  { id: "cancer-robot", deptId: "cancer", name: "로봇 암 수술", priceKRW: 25000000, priceMaxKRW: 35000000 },
  { id: "cancer-chemo", deptId: "cancer", name: "항암 치료 (1주기)", priceKRW: 3000000, priceMaxKRW: 6000000 },
  { id: "cancer-radiation", deptId: "cancer", name: "방사선 치료 (1코스)", priceKRW: 5000000, priceMaxKRW: 9000000 },

  // ── 심장내과 (cardio) ── range
  { id: "cardio-stent", deptId: "cardio", name: "관상동맥 스텐트 (1개 혈관)", priceKRW: 8000000, priceMaxKRW: 12000000 },
  { id: "cardio-angio", deptId: "cardio", name: "관상동맥 조영술", priceKRW: 2500000 },
  { id: "cardio-valve", deptId: "cardio", name: "심장 판막 수술", priceKRW: 20000000, priceMaxKRW: 30000000 },
  { id: "cardio-ablation", deptId: "cardio", name: "부정맥 전극도자절제술", priceKRW: 9000000, priceMaxKRW: 13000000 },

  // ── 신경외과 (neuro) ── range
  { id: "neuro-tumor", deptId: "neuro", name: "뇌종양 수술", priceKRW: 20000000, priceMaxKRW: 35000000 },
  { id: "neuro-aneurysm", deptId: "neuro", name: "뇌동맥류 클립결찰술", priceKRW: 18000000, priceMaxKRW: 28000000 },
  { id: "neuro-gamma", deptId: "neuro", name: "감마나이프", priceKRW: 12000000, priceMaxKRW: 18000000 },

  // ── 난임·불임 (fertility) ── range
  { id: "fertility-ivf", deptId: "fertility", name: "시험관 아기 (1주기)", priceKRW: 4500000, priceMaxKRW: 6000000 },
  { id: "fertility-iui", deptId: "fertility", name: "인공수정 (1회)", priceKRW: 800000 },
  { id: "fertility-eggfreeze", deptId: "fertility", name: "난자 냉동", priceKRW: 3000000 },

  // ── 재활의학 (rehab) ──
  { id: "rehab-manual", deptId: "rehab", name: "도수치료 (1회)", priceKRW: 100000 },
  { id: "rehab-program", deptId: "rehab", name: "재활 프로그램 (주)", priceKRW: 800000 },
  { id: "rehab-physio", deptId: "rehab", name: "물리치료 (1회)", priceKRW: 50000 },

  // ── 상담 견적(금액 미표기) ──
  { id: "transplant-kidney", deptId: "transplant", name: "신장 이식", priceKRW: 0, quote: true },
  { id: "transplant-liver", deptId: "transplant", name: "간 이식", priceKRW: 0, quote: true },
  { id: "emergency-general", deptId: "emergency", name: "응급·중환자 진료", priceKRW: 0, quote: true },
  { id: "internal-general", deptId: "internal", name: "내과 진단·입원", priceKRW: 0, quote: true },
];

// deptId → 시술 목록
export const proceduresByDept = (deptId: string) =>
  PROCEDURES.filter((p) => p.deptId === deptId);

export const findProcedure = (id: string | null) =>
  PROCEDURES.find((p) => p.id === id) ?? null;
