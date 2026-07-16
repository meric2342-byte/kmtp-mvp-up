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

const KEY = "kmtp_case_draft";

function newCaseId(): string {
  return "KMTP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function saveDraft(draft: Omit<CaseDraft, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: CaseDraft = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch {}
}

export function loadDraft(): CaseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CaseDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

export { newCaseId };
