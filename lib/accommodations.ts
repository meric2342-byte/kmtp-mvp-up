// KMTP 숙소 카탈로그 — 실제 진행 가능한 2곳
export type RoomTier = {
  id: string;
  name: string;
  capacity: number;
  priceKRW: number;
  features: string[];
};

export type Accommodation = {
  id: string;
  name: string;
  kind: "hotel" | "residence";
  billing: "nightly";
  minNights: number;
  badge: string;
  summary: string;
  address: string;
  mapQuery: string;
  mapUrl: string;
  hospitalDistance: string;
  photos: string[];
  amenities: string[];
  cancelPolicy: string;
  rooms: RoomTier[];
  operator: string;
  internalNote?: string;  // NEVER render this on any patient-facing UI
};

export const ACCOMMODATIONS: Accommodation[] = [
  {
    id: "union-seonyu",
    name: "유니온 선유 (호텔)",
    kind: "hotel",
    billing: "nightly",
    minNights: 1,
    badge: "병원 인접 · 단기 체류",
    summary: "검진·단기 시술 환자를 위한 병원 인접 호텔. 유니언플레이스 운영.",
    address: "서울 영등포구 선유 일대",
    mapQuery: "유니언플레이스 선유",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=%EC%9C%A0%EB%8B%88%EC%96%B8%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4+%EC%84%A0%EC%9C%A0",
    hospitalDistance: "제휴 병원까지 도보 이동",
    photos: ["/placeholder/union-1.jpg", "/placeholder/union-2.jpg"],
    amenities: ["24시간 프런트", "라운지", "픽업/드롭 연계", "통역 연계", "청소 서비스"],
    cancelPolicy: "체크인 48시간 전 취소 시 예약금 100% 환불",
    operator: "유니언플레이스",
    internalNote: "요금 ADR 기준 확정 예정. 아래 1박가는 잠정치.",
    rooms: [
      { id: "std", name: "스탠다드 룸", capacity: 1, priceKRW: 150000, features: ["1인", "기본 객실"] },
      { id: "dlx", name: "디럭스 룸", capacity: 2, priceKRW: 240000, features: ["넓은 객실", "보호자 동반 가능"] },
      { id: "ste", name: "스위트 룸", capacity: 2, priceKRW: 400000, features: ["스위트", "보호자 동반 · 2베드"] },
    ],
  },
  {
    id: "webreathing-seonyu",
    name: "위브리빙 선유점 (레지던스)",
    kind: "residence",
    billing: "nightly",
    minNights: 3,
    badge: "회복 특화 · 유니온 옆 건물 · 최소 3박",
    summary: "수술 후 회복 체류에 최적화된 레지던스. 유니온 바로 옆 건물. 취사 가능.",
    address: "서울 영등포구 선유 (유니온 인접)",
    mapQuery: "위브리빙 선유",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=%EC%9C%84%EB%B8%8C%EB%A6%AC%EB%B9%99+%EC%84%A0%EC%9C%A0",
    hospitalDistance: "유니온 호텔 바로 옆 건물",
    photos: ["/placeholder/webreathing-1.jpg", "/placeholder/webreathing-2.jpg"],
    amenities: ["취사 가능", "세탁", "생활 편의", "보호자 동반", "회복 장기 체류"],
    cancelPolicy: "최소 3박. 체크인 48시간 전 취소 시 예약금 100% 환불.",
    operator: "위브리빙",
    internalNote: "내부 조달가(월 단위): 얼반스위트 285/195/175만(1·6·12M), 더블 325/225/195만.",
    rooms: [
      { id: "urban-suite", name: "얼반 스위트 (1인실)", capacity: 1, priceKRW: 200000, features: ["1인실", "취사 가능", "회복 특화"] },
      { id: "double", name: "더블베드 (2인실)", capacity: 2, priceKRW: 300000, features: ["2인실", "보호자 동반", "취사 가능"] },
    ],
  },
];

export const findAccommodation = (id: string | null) =>
  ACCOMMODATIONS.find((a) => a.id === id) ?? null;

export const stayTotal = (room: RoomTier, nights: number) =>
  room.priceKRW * Math.max(nights, 0);
