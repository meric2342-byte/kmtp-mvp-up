// KMTP 부가서비스 카탈로그 — 공항픽업 / 배차·택시 / 통역 + 담당 코디네이터
// ⚠️ 사진(photo)은 placeholder. 추후 실제 이미지로 교체 가능하게 상수로 분리.
// 정산 원칙: 모든 결제는 '에스크로 내' 결제 → 실제 지급/수수료는 추후 정산(pass-through).
// 금액 단위: KRW.

export type CoordinatorInfo = {
  name: string;
  title: string;
  phone: string;
  whatsapp: string;      // wa.me 링크
  photo: string;         // TODO: 실제 사진 URL로 교체 가능
  note?: string;
};

// 모든 코디네이션(픽업·배차·통역·여정) 담당자 — 단일 창구
export const COORDINATOR: CoordinatorInfo = {
  name: "김도균 대표",
  title: "총괄 코디네이터 · 케이스 매니저",
  phone: "010-5505-7004",
  whatsapp: "https://wa.me/821055057004",
  photo: "/placeholder/coordinator-kim.jpg", // TODO 실사진 교체
  note: "모든 픽업·배차·통역·여정 문의는 담당 코디네이터에게 연결됩니다.",
};

export type ServiceOption = {
  id: string;
  name: string;
  priceKRW: number | null;   // null = 실비/미터(별도), 요금표는 commission 참조
  unit: string;              // 과금 단위 설명
  desc: string;
  photo?: string;            // TODO: 실제 사진 교체 가능
};

export type ServiceCategory = {
  id: string;
  name: string;
  settlement: string;        // 정산 방식 안내(에스크로/후정산)
  fields: string[];          // 예약 시 입력 항목
  options: ServiceOption[];
  commissionKRW?: number;    // KMTP 건당 수수료(있으면)
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // 1) 공항 픽업 — 고정 패키지(항공편 연동 자동배차)
  {
    id: "airport-pickup",
    name: "공항 픽업",
    settlement: "에스크로 내 결제 · 추후 정산",
    fields: ["항공편 번호(도착 자동배차)", "도착 일시", "인원", "수하물 수"],
    options: [
      { id: "sedan", name: "세단", priceKRW: 100000, unit: "편도/대", desc: "일반 세단 · 1~3인", photo: "/placeholder/pickup-sedan.jpg" },
      { id: "premium-van", name: "프리미엄 밴", priceKRW: 130000, unit: "편도/대", desc: "넓은 밴 · 보호자·수하물 여유", photo: "/placeholder/pickup-van.jpg" },
      { id: "vip", name: "VIP Meet & Greet", priceKRW: 200000, unit: "편도/대", desc: "입국장 피켓 영접 · 수하물·에스코트", photo: "/placeholder/pickup-vip.jpg" },
    ],
  },

  // 2) 택시 — 시내/병원 이동. 실비 결제 후 후정산 + 건당 수수료
  {
    id: "taxi",
    name: "택시",
    settlement: "에스크로 내 결제 후 추후 정산 (개별정산 아님)",
    fields: ["날짜", "시간", "출발지", "도착지", "인원"],
    commissionKRW: 5000, // KMTP 건당 수수료
    options: [
      { id: "taxi", name: "택시", priceKRW: null, unit: "실비(미터) + 건당 수수료 5,000원", desc: "요금은 실비, KMTP 건당 수수료 5,000원. 에스크로 결제 후 정산.", photo: "/placeholder/ride-taxi.jpg" },
    ],
  },

  // 3) 배차 (전용차량 대절) — 시간제 고정가. 픽업 장소·시간 지정
  {
    id: "charter",
    name: "배차 (전용차량 대절)",
    settlement: "에스크로 내 결제 · 추후 정산",
    fields: ["날짜", "픽업 시간", "픽업 장소", "인원"],
    options: [
      { id: "charter-4h", name: "4시간 대절", priceKRW: 150000, unit: "4시간/대", desc: "전용차량+기사 · 병원 동행·대기 포함", photo: "/placeholder/charter-4h.jpg" },
      { id: "charter-8h", name: "8시간 대절", priceKRW: 200000, unit: "8시간/대", desc: "전용차량+기사 · 종일 일정", photo: "/placeholder/charter-8h.jpg" },
    ],
  },

  // 3) 통역 — 시간·장소 입력
  {
    id: "interpreter",
    name: "의료 통역",
    settlement: "에스크로 내 결제 · 추후 정산",
    fields: ["언어", "의료통역 여부", "날짜", "시간(시작~종료)", "장소(병원/기관)"],
    options: [
      { id: "medical", name: "의료 통역사", priceKRW: null, unit: "시간제(시간·장소 입력 후 견적)", desc: "의료 전문 통역. 시간과 장소를 지정하면 견적·배정.", photo: "/placeholder/interpreter.jpg" },
    ],
  },
];

export const findServiceCategory = (id: string | null) =>
  SERVICE_CATEGORIES.find((c) => c.id === id) ?? null;
