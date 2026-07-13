"use client";

// 환자 본인의 여정 화면 — 내 일정·픽업 연락처·병원 위치/시간 + 타임라인
// (작업 5에서 '기사에게 전화' 버튼·단계 진행·알림이 추가됩니다)
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { api } from "@/lib/api";
import { STAGES } from "@/lib/journey";
import { useAsync } from "@/lib/useAsync";
import JourneyTimeline from "@/components/JourneyTimeline";
import BackendNotice from "@/components/BackendNotice";

const stageLabel = (key: string | null) =>
  STAGES.find((s) => s.key === key)?.label ?? "";

const TRANSFER_LABEL: Record<string, string> = {
  airport_to_stay: "공항 → 숙소",
  stay_to_hospital: "숙소 → 병원",
  hospital_to_stay: "병원 → 숙소",
};

type Props = {
  account: Account;
  // 에스크로 완료 후 이어서 진행할 때만 전달됨 → "계속하기" 배너 표시
  onContinueFlow?: () => void;
  // 여정이 완료되면 신뢰 화면으로 이동
  onGoTrust?: () => void;
};

export default function PatientJourney({
  account,
  onContinueFlow,
  onGoTrust,
}: Props) {
  const journey = useAsync(() => api.journey(account.id), [account.id]);
  const transfers = useAsync(() => api.transfers(account.id), [account.id]);
  const appts = useAsync(
    () => api.appointments({ patient_id: account.id }),
    [account.id],
  );
  const [posting, setPosting] = useState(false);

  const LAST_STAGE = STAGES[STAGES.length - 1].key; // departure(출국)

  // 현재 단계를 완료 처리 → 다음 단계로 진행 (백엔드 저장 + 알림 자동 생성)
  // 마지막 단계(출국)를 완료하면 여정 완료 → 신뢰 화면으로 이동
  const advance = async () => {
    const next = journey.data?.current_stage;
    if (!next) return;
    setPosting(true);
    try {
      await api.addJourneyEvent({ patient_id: account.id, stage: next });
      if (next === LAST_STAGE && onGoTrust) {
        onGoTrust();
      } else {
        journey.reload();
      }
    } finally {
      setPosting(false);
    }
  };

  const appt = appts.data?.[0] ?? null;
  // 아직 안 끝난(예정/진행) 픽업을 우선 표시
  const activeTransfer =
    transfers.data?.find((t) => t.status !== "completed") ??
    transfers.data?.[0] ??
    null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          내 여정
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          입국부터 출국까지, 지금 어디까지 진행됐는지 실시간으로 확인하세요.
        </p>
      </div>

      {/* 에스크로 완료 후 이어가기 배너 */}
      {onContinueFlow && (
        <div className="flex flex-col gap-3 rounded-2xl bg-primary px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">✓ 에스크로 예치 완료</p>
            <p className="text-sm opacity-90">
              내 여정이 시작됐어요. 이어서 가격 일치(No-Surprise)와 신뢰 점수를
              확인하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onContinueFlow}
            className="shrink-0 rounded-xl bg-white px-6 py-3 font-bold text-primary-dark transition-colors hover:bg-primary-light"
          >
            계속하기 →
          </button>
        </div>
      )}

      <BackendNotice
        loading={journey.loading}
        error={journey.error}
        onRetry={journey.reload}
      />

      {journey.data && (
        <>
          {/* 새로 시작하는 환자: 아직 완료된 단계가 없으면 '여정 시작 전' 안내 */}
          {journey.data.done_stages.length === 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary-light/40 px-6 py-5">
              <p className="font-bold text-primary-dark">🛫 여정을 시작할 준비가 됐어요</p>
              <p className="mt-1 text-sm text-gray-600">
                아직 진행된 단계가 없습니다. 첫 단계
                <b> 「{stageLabel(journey.data.current_stage)}」</b>부터 하나씩 진행됩니다.
              </p>
            </div>
          )}

          {/* 일정 + 픽업 연락처 요약 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 병원 일정 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-700">병원 일정</h3>
              {appt?.scheduled_at ? (
                <p className="mt-2 text-sm text-gray-600">
                  📅 {appt.scheduled_at.replace("T", " ").slice(0, 16)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">예약 정보 없음</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                협력 국제진료센터 · 통역 코디 동행
              </p>
            </div>

            {/* 픽업 연락처 (표시만 — 전화 버튼은 작업 5) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-700">픽업 안내</h3>
              {activeTransfer ? (
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    🚐 {TRANSFER_LABEL[activeTransfer.type] ?? activeTransfer.type}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    기사 {activeTransfer.driver_name} · {activeTransfer.car_number}
                    {activeTransfer.pickup_scheduled && (
                      <>
                        {" · 예정 "}
                        {activeTransfer.pickup_scheduled
                          .replace("T", " ")
                          .slice(5, 16)}
                      </>
                    )}
                  </p>
                  {activeTransfer.driver_phone && (
                    <a
                      href={`tel:${activeTransfer.driver_phone}`}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                    >
                      📞 기사에게 전화
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">픽업 정보 없음</p>
              )}
            </div>
          </div>

          {/* 타임라인 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">여정 단계</h3>
              {journey.data.current_stage ? (
                <button
                  type="button"
                  onClick={advance}
                  disabled={posting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:bg-gray-300"
                >
                  {posting
                    ? "진행 중…"
                    : `「${stageLabel(journey.data.current_stage)}」 완료 →`}
                </button>
              ) : onGoTrust ? (
                <button
                  type="button"
                  onClick={onGoTrust}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark"
                >
                  여정 완료 ✓ · 신뢰 점수·후기 보기 →
                </button>
              ) : (
                <span className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-bold text-primary-dark">
                  여정 완료 ✓
                </span>
              )}
            </div>
            <JourneyTimeline
              doneStages={journey.data.done_stages}
              currentStage={journey.data.current_stage}
              events={journey.data.events}
            />
          </div>
        </>
      )}
    </div>
  );
}
