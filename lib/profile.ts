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

// ⚠️ profile은 반드시 '계정별'로 분리 저장한다(draft.ts와 동일 원칙).
// 과거엔 전역 키 하나(kmtp_patient_profile)에 저장해, 같은 브라우저에서 다른 아이디로
// 로그인하면 이전 계정의 이름·국적·진료과가 그대로 남아 → patient_name이 뒤섞이고
// 그 이름으로 요청·견적이 조회돼 '다른 사람 시술이 누적'되어 보이는 버그가 있었다.
// 이제는 계정 id로 네임스페이스를 붙여(kmtp_patient_profile:{accountId}) 섞이지 않게 한다.
const BASE_KEY = "kmtp_patient_profile";

function keyFor(accountId?: string): string {
  return accountId ? `${BASE_KEY}:${accountId}` : BASE_KEY;
}

// 과거 전역 키에 남아 있던(계정 뒤섞인) 프로필을 1회 제거 — 다시 새 계정에 새어 들지 않도록.
function purgeLegacy(): void {
  try { localStorage.removeItem(BASE_KEY); } catch {}
}

// 성 + 이름 → 표시용 전체 이름 (여권 영문 표기 순서)
export const fullName = (p: Pick<PatientProfile, "surname" | "givenName">) =>
  [p.surname, p.givenName].filter(Boolean).join(" ").trim();

export function saveProfile(p: PatientProfile, accountId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(accountId), JSON.stringify(p));
  } catch {
    // 저장 실패는 무시 (프로필은 부가 정보)
  }
}

export function loadProfile(accountId?: string): PatientProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    if (accountId) purgeLegacy();
    const raw = localStorage.getItem(keyFor(accountId));
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : { ...EMPTY_PROFILE };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function clearProfile(accountId?: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(keyFor(accountId)); } catch {}
}
