// ============================================================
// 역할 기반 로그인 (mock) — 복잡한 인증 없이 데모용 계정만
// patient / agent / hospital 3개 역할
// ============================================================

export type Role = "patient" | "agent" | "hospital";

export type Account = {
  id: string; // 백엔드 patient/agent/hospital 식별과 연결되는 코드
  loginId: string; // 로그인 아이디 (patient/agent/hospital)
  role: Role;
  name: string; // 화면에 표시할 이름
  sub: string; // 부가 설명 (소속/국적 등)
};

// 데모 공통 비밀번호
export const DEMO_PASSWORD = "0000";

// 역할별 라벨/설명 (로그인 화면 카드용)
export const ROLE_META: Record<
  Role,
  { label: string; icon: string; desc: string; tone: string }
> = {
  patient: {
    label: "환자",
    icon: "🧑‍⚕️",
    desc: "견적·예약·신뢰 확인 + 내 여정 실시간 추적",
    tone: "border-primary",
  },
  agent: {
    label: "에이전트 (유치업자)",
    icon: "🤝",
    desc: "담당 환자 여정 관리 · 픽업 진행",
    tone: "border-amber-400",
  },
  hospital: {
    label: "병원",
    icon: "🏥",
    desc: "예약 환자 도착 상태 · 진료 일정",
    tone: "border-sky-400",
  },
};

// 데모 계정 (각 역할 1개씩) — 백엔드 샘플 데이터의 id와 맞춥니다.
export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "P001",
    loginId: "patient",
    role: "patient",
    name: "환자 데모 계정",
    sub: "몽골 · 갑상선 · 14박 일정",
  },
  {
    id: "A001",
    loginId: "agent",
    role: "agent",
    name: "에이전트 데모 계정",
    sub: "골든브릿지 메디투어",
  },
  {
    id: "H001",
    loginId: "hospital",
    role: "hospital",
    name: "병원 데모 계정",
    sub: "서울 메디케어 국제병원 · 국제진료센터",
  },
];

export const findAccount = (role: Role) =>
  MOCK_ACCOUNTS.find((a) => a.role === role) ?? null;

// 아이디 + 비밀번호로 로그인 검증 → 계정 또는 null
export function authenticate(loginId: string, password: string): Account | null {
  const id = loginId.trim().toLowerCase();
  const account = MOCK_ACCOUNTS.find((a) => a.loginId === id);
  if (!account || password !== DEMO_PASSWORD) return null;
  return account;
}
