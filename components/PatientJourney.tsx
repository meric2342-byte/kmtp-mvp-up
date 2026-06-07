"use client";

// 환자 본인의 여정 화면 — 내 일정·픽업 연락처·병원 위치/시간 + 타임라인
// (작업 5에서 '기사에게 전화' 버튼·단계 진행·알림이 추가됩니다)
import type { Account } from "@/lib/auth";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import JourneyTimeline from "@/components/JourneyTimeline";
import BackendNotice from "@/components/BackendNotice";

const TRANSFER_LABEL: Record<string, string> = {
  airport_to_stay: "공항 → 숙소",
  stay_to_hospital: "숙소 → 병원",
  hospital_to_stay: "병원 → 숙소",
};

type Props = {
  account: Account;
};

export default function PatientJourney({ account }: Props) {
  const journey = useAsync(() => api.journey(account.id), [account.id]);
  const transfers = useAsync(() => api.transfers(account.id), [account.id]);
  const appts = useAsync(
    () => api.appointments({ patient_id: account.id }),
    [account.id],
  );

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

      <BackendNotice
        loading={journey.loading}
        error={journey.error}
        onRetry={journey.reload}
      />

      {journey.data && (
        <>
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
                    <br />
                    {activeTransfer.driver_phone}
                    {activeTransfer.pickup_scheduled && (
                      <>
                        {" · 예정 "}
                        {activeTransfer.pickup_scheduled
                          .replace("T", " ")
                          .slice(5, 16)}
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">픽업 정보 없음</p>
              )}
            </div>
          </div>

          {/* 타임라인 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="mb-4 text-sm font-bold text-gray-700">여정 단계</h3>
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
