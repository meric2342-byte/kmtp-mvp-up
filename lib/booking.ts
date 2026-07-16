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
  vehicleGrade?: string;
  flightNumber?: string;
  interpLang?: string;
  interpDuration?: string;
  priceKRW?: number;
};

// Top-level booking session state (not per-procedure)
export type BookingSession = {
  caseId: string;
  companions: number;  // 0 = 환자 단독, 1 = 보호자 1명, 2 = 보호자 2명+
};

export type AccommodationBooking = {
  accommodationId: string;
  roomId: string;
  nights: number;
};
