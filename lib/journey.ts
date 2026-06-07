// ============================================================
// 환자 여정 9단계 정의 — 백엔드 db.py STAGES와 키를 맞춥니다.
// ============================================================

export type StageKey =
  | "depart_home"
  | "arrive_airport"
  | "airport_pickup"
  | "checkin_stay"
  | "visit_hospital"
  | "surgery"
  | "recovery"
  | "follow_up"
  | "departure";

export type Stage = {
  key: StageKey;
  label: string;
  icon: string;
};

export const STAGES: Stage[] = [
  { key: "depart_home", label: "현지 출발", icon: "🛫" },
  { key: "arrive_airport", label: "공항 도착", icon: "🛬" },
  { key: "airport_pickup", label: "공항 픽업", icon: "🚐" },
  { key: "checkin_stay", label: "숙소/회복스테이 체크인", icon: "🏨" },
  { key: "visit_hospital", label: "병원 방문", icon: "🏥" },
  { key: "surgery", label: "수술·시술", icon: "🩺" },
  { key: "recovery", label: "회복", icon: "🌿" },
  { key: "follow_up", label: "재진", icon: "📋" },
  { key: "departure", label: "출국", icon: "✈️" },
];

export const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  STAGES.map((s, i) => [s.key, i]),
);

export type StageStatus = "done" | "current" | "upcoming";

// 단계 상태 계산: 완료 목록 + 현재 단계 키로 각 단계의 상태 판정
export function stageStatus(
  key: StageKey,
  doneStages: string[],
  currentStage: string | null,
): StageStatus {
  if (doneStages.includes(key)) return "done";
  if (key === currentStage) return "current";
  return "upcoming";
}
