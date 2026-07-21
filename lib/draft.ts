import { type TreatmentBooking, type ServiceItem } from "@/lib/booking";

export type CaseDraft = {
  caseId: string;
  nationality: string;
  companions: number;  // 0/1/2+
  bookings: TreatmentBooking[];
  accommodationId: string | null;
  accommodationRoomId: string;
  nights: number;
  services: ServiceItem[];
  step: number;
  savedAt: string;
};

// ⚠️ draft는 반드시 '계정별'로 분리 저장한다.
// 과거엔 전역 키 하나(kmtp_case_draft)에 저장해, 같은 브라우저에서 다른 아이디로
// 로그인해도 이전 계정의 선택 시술이 그대로 합쳐져 보이는 버그가 있었다.
// 이제는 계정 id로 네임스페이스를 붙여(kmtp_case_draft:{accountId}) 서로 섞이지 않게 한다.
const BASE_KEY = "kmtp_case_draft";

function keyFor(accountId?: string): string {
  return accountId ? `${BASE_KEY}:${accountId}` : BASE_KEY;
}

// 과거 전역 키에 남아 있던(계정 뒤섞인) 데이터를 1회 제거 — 다시 합쳐져 보이지 않도록.
function purgeLegacy(): void {
  try { localStorage.removeItem(BASE_KEY); } catch {}
}

function newCaseId(): string {
  return "KMTP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function saveDraft(draft: Omit<CaseDraft, "savedAt">, accountId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: CaseDraft = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(keyFor(accountId), JSON.stringify(toSave));
  } catch {}
}

export function loadDraft(accountId?: string): CaseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    if (accountId) purgeLegacy();
    const raw = localStorage.getItem(keyFor(accountId));
    return raw ? (JSON.parse(raw) as CaseDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(accountId?: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(keyFor(accountId)); } catch {}
}

export { newCaseId };
