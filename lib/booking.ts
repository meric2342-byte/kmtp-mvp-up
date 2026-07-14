// ============================================================
// 예약 관련 공유 타입 — 모든 스텝 컴포넌트에서 공통 사용
// ============================================================

export type TreatmentBooking = {
  id: string;
  hospitalId: string;
  deptId: string;
  date: string;
  time: string;
};

export type ServiceItem = {
  id: string;
  type: "택시" | "배차" | "통역";
  from: string;
  to: string;
  date: string;
  time: string;
  language: string;
  hours: string;
};
