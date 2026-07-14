// ============================================================
// 예약 관련 공유 타입
// ============================================================

export type TreatmentBooking = {
  id: string;
  hospitalId: string;
  deptId: string;
  // 개별 시술 (procedures.ts 기반)
  procedureId: string;
  procedureName: string;
  procedurePriceKRW: number;
  procedurePriceMaxKRW?: number;
  // 날짜 (최대 5개, 병원 컨펌)
  dates: string[];
  time: string;
  confirmedDate?: string;
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
