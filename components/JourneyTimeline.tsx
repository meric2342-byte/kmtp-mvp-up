"use client";

// 환자 여정 9단계 세로 타임라인 (공통 컴포넌트)
// done(완료)/current(진행중)/upcoming(예정) 상태로 표시
import { STAGES, stageStatus, type StageKey } from "@/lib/journey";
import type { JourneyEvent } from "@/lib/api";

type Props = {
  doneStages: string[];
  currentStage: string | null;
  events?: JourneyEvent[]; // 단계별 발생 시각 표시용 (선택)
};

function fmt(iso: string | undefined): string {
  if (!iso) return "";
  // "2026-06-05T12:42:11" → "6/5 12:42"
  const [date, time] = iso.split("T");
  if (!date) return "";
  const [, m, d] = date.split("-");
  const hm = (time ?? "").slice(0, 5);
  return `${Number(m)}/${Number(d)} ${hm}`;
}

export default function JourneyTimeline({
  doneStages,
  currentStage,
  events = [],
}: Props) {
  const timeByStage: Record<string, string> = {};
  for (const e of events) timeByStage[e.stage] = e.occurred_at;

  return (
    <ol className="relative ml-2">
      {STAGES.map((stage, i) => {
        const status = stageStatus(stage.key as StageKey, doneStages, currentStage);
        const isLast = i === STAGES.length - 1;

        const dot =
          status === "done"
            ? "bg-primary text-white"
            : status === "current"
              ? "bg-white text-primary ring-4 ring-primary-light border-2 border-primary"
              : "bg-gray-100 text-gray-400";

        const line = status === "done" ? "bg-primary" : "bg-gray-200";

        return (
          <li key={stage.key} className="relative flex gap-4 pb-1">
            {/* 세로 연결선 + 점 */}
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dot}`}
              >
                {status === "done" ? "✓" : stage.icon}
              </span>
              {!isLast && <span className={`w-0.5 flex-1 ${line}`} />}
            </div>

            {/* 단계 내용 */}
            <div className={`pb-5 pt-1 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    status === "upcoming" ? "text-gray-400" : "text-gray-800"
                  }`}
                >
                  {stage.label}
                </span>
                {status === "current" && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    진행중
                  </span>
                )}
                {status === "done" && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary-dark">
                    완료
                  </span>
                )}
              </div>
              {timeByStage[stage.key] && (
                <span className="text-xs text-gray-400">
                  {fmt(timeByStage[stage.key])}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
