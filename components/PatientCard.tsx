"use client";

// 환자 1명 카드 — 에이전트/병원 목록에서 사용
// 역할별 격리: 견적·수수료는 절대 표시하지 않습니다.
// - agent: 현재 단계 + 픽업 진행
// - hospital: 현재 단계 + 예약/도착 상태 (에이전트 정보 미표시)
import { useState } from "react";
import type { Role } from "@/lib/auth";
import { api, type Patient } from "@/lib/api";
import { STAGES } from "@/lib/journey";
import { useAsync } from "@/lib/useAsync";
import JourneyTimeline from "@/components/JourneyTimeline";

const DEPT_LABEL: Record<string, string> = {
  derma: "피부과",
  dental: "치과",
  eye: "안과",
  checkup: "종합검진",
  thyroid: "갑상선",
  spine: "척추",
  joint: "관절·정형외과",
  emergency: "응급의학",
  transplant: "장기이식",
};

const stageLabel = (key: string | null) =>
  STAGES.find((s) => s.key === key)?.label ?? "—";

type Props = {
  patient: Patient;
  role: Role;
};

export default function PatientCard({ patient, role }: Props) {
  const [open, setOpen] = useState(false);
  const journey = useAsync(() => api.journey(patient.id), [patient.id]);
  const appts = useAsync(
    () => api.appointments({ patient_id: patient.id }),
    [patient.id],
  );

  const current = journey.data?.current_stage ?? null;
  const appt = appts.data?.[0] ?? null;
  // 병원 화면: 환자가 병원에 도착했는지 (병원 방문 단계 완료 여부)
  const arrived = journey.data?.done_stages.includes("visit_hospital") ?? false;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-800">
              {patient.name}
            </span>
            <span className="text-xs text-gray-400">
              {patient.nationality} · {DEPT_LABEL[patient.department ?? ""] ?? patient.department}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-primary-dark">
              현재: {stageLabel(current)}
            </span>
            {role === "hospital" && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  arrived
                    ? "bg-primary text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {arrived ? "병원 도착" : "도착 전"}
              </span>
            )}
          </div>
          {/* 병원: 예약 시간 / 에이전트: 픽업 안내 (수수료·에이전트명 없음) */}
          {role === "hospital" && appt?.scheduled_at && (
            <p className="mt-1.5 text-xs text-gray-500">
              예약: {appt.scheduled_at.replace("T", " ").slice(0, 16)} · 상태 {appt.status}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
        >
          {open ? "접기" : "여정 보기"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {journey.loading && (
            <p className="text-sm text-gray-400">불러오는 중…</p>
          )}
          {journey.error && (
            <p className="text-sm text-amber-700">여정 정보를 불러오지 못했어요.</p>
          )}
          {journey.data && (
            <JourneyTimeline
              doneStages={journey.data.done_stages}
              currentStage={journey.data.current_stage}
              events={journey.data.events}
            />
          )}
        </div>
      )}
    </div>
  );
}
