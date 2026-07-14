export type DateSlot = {
  date: string;
  time: string;
};

export type TreatmentBooking = {
  id: string;
  hospitalId: string;
  deptId: string;
  procedureId: string;
  procedureName: string;
  procedurePriceKRW: number;
  procedurePriceMaxKRW?: number;
  dateSlots: DateSlot[];   // 날짜·시간 각각 지정 (최대 5개)
  confirmedDate?: string;
  confirmedTime?: string;
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
