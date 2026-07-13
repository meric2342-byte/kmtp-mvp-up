// ============================================================
// 환자 프로필 — b2b 환자 등록 수준의 상세 정보
// mvp 인증(Render)은 name/nationality/department만 저장하므로,
// 여권 등 추가 정보는 이 프로필(localStorage)에 보관하고
// 부가서비스·검진 요청 시 b2b로 함께 전달한다.
// ============================================================

// 국적 드롭다운 (b2b overseas/patients/new 와 동일 목록)
export const NATIONALITIES = [
  "베트남", "중국", "일본", "몽골", "러시아", "카자흐스탄", "우즈베키스탄",
  "태국", "인도네시아", "필리핀", "말레이시아", "싱가포르", "대만", "홍콩",
  "미국", "캐나다", "사우디아라비아", "아랍에미리트(UAE)", "카타르", "쿠웨이트",
  "호주", "기타",
];

export type PatientProfile = {
  surname: string;        // 성 (Surname)
  givenName: string;      // 이름 (Given Name)
  nationality: string;
  passportNumber: string; // 여권번호
  passportExpiry: string; // 여권 만료일
  department: string;     // 진료과 (자유입력)
};

export const EMPTY_PROFILE: PatientProfile = {
  surname: "",
  givenName: "",
  nationality: "",
  passportNumber: "",
  passportExpiry: "",
  department: "",
};

const KEY = "kmtp_patient_profile";

// 성 + 이름 → 표시용 전체 이름 (여권 영문 표기 순서)
export const fullName = (p: Pick<PatientProfile, "surname" | "givenName">) =>
  [p.surname, p.givenName].filter(Boolean).join(" ").trim();

export function saveProfile(p: PatientProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 저장 실패는 무시 (프로필은 부가 정보)
  }
}

export function loadProfile(): PatientProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : { ...EMPTY_PROFILE };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}
