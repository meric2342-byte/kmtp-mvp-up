"use client";

// 환자 본인의 여정 화면 — 내 일정·픽업 연락처·병원 위치/시간 + 타임라인
// (작업 5에서 '기사에게 전화' 버튼·단계 진행·알림이 추가됩니다)
import { useState, useEffect } from "react";
import type { Account } from "@/lib/auth";
import { api } from "@/lib/api";
import { STAGES } from "@/lib/journey";
import { useAsync } from "@/lib/useAsync";
import JourneyTimeline from "@/components/JourneyTimeline";
import BackendNotice from "@/components/BackendNotice";
import { COORDINATOR } from "@/lib/services";
import { loadDraft } from "@/lib/draft";
import type { TreatmentBooking } from "@/lib/booking";

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
  // 재진 일정이 잡히면 숙박·서비스·일정을 다시 예약(항목12)
  onRebook?: () => void;
};

export default function PatientJourney({
  account,
  onContinueFlow,
  onGoTrust,
  onRebook,
}: Props) {
  const journey = useAsync(() => api.journey(account.id), [account.id]);
  const transfers = useAsync(() => api.transfers(account.id), [account.id]);
  const interpreters = useAsync(() => api.interpreters(account.id), [account.id]);
  const appts = useAsync(
    () => api.appointments({ patient_id: account.id }),
    [account.id],
  );
  const [posting, setPosting] = useState(false);
  // 에스크로 완료 직후엔 백엔드 예약(appt)이 아직 없을 수 있어, 내가 예약한 시술(draft)을 '예정'으로 표시(항목9)
  const [draftBookings, setDraftBookings] = useState<TreatmentBooking[]>([]);
  useEffect(() => { const d = loadDraft(account.id); setDraftBookings(d?.bookings ?? []); }, [account.id]);

  // 실시간 반영: 운영자(admin)가 기록한 여정 이벤트·기사정보가 자동으로 타임라인에 진행되도록
  // 12초 폴링 + 탭 복귀 시 즉시 재조회. (기존엔 본인이 버튼 누를 때만 갱신돼 '정체'처럼 보임)
  useEffect(() => {
    const reload = () => { journey.reload(); transfers.reload(); interpreters.reload(); };
    const t = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      reload();
    }, 6000);
    const onFocus = () => reload();
    const onVisible = () => { if (!document.hidden) reload(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

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

  // 공항 도착 완료 시 → 운영관리자 픽업 안내(차량·기사·게이트) + WhatsApp
  const arrivedAirport =
    journey.data?.done_stages.includes("arrive_airport") ?? false;
  const airportPickup =
    transfers.data?.find((t) => t.type === "airport_to_stay") ?? null;
  const gateLabel = airportPickup?.gate
    ? `${airportPickup.gate}번 게이트`
    : "안내된 게이트";
  const pickupMsg = airportPickup
    ? `🚐 [공항 픽업 안내] ${airportPickup.driver_name ?? "픽업"} 기사님이 ${gateLabel} 앞에서 기다리고 있습니다.\n차량번호: ${airportPickup.car_number ?? "-"}\n연락처: ${airportPickup.driver_phone ?? "-"}`
    : "";
  const pickupWhatsApp = `https://wa.me/?text=${encodeURIComponent(pickupMsg)}`;

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
          {/* 공항 도착 시 운영관리자 픽업 안내 — 차량·기사·게이트 + WhatsApp/전화 */}
          {arrivedAirport && airportPickup && (
            <div className="rounded-2xl border-2 border-primary bg-primary-light px-5 py-4">
              <p className="font-bold text-primary-dark">🚐 공항 픽업 안내 · KMTP 운영관리자</p>
              <p className="mt-1.5 text-sm text-gray-700">
                <b>{airportPickup.driver_name}</b> 기사님이{" "}
                <b>{gateLabel}</b> 앞에서 기다리고 있습니다.
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                차량번호 <b>{airportPickup.car_number}</b>
                {airportPickup.driver_phone && <> · 📞 {airportPickup.driver_phone}</>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={pickupWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600"
                >
                  📱 WhatsApp으로 안내 받기
                </a>
                {airportPickup.driver_phone && (
                  <a
                    href={`tel:${airportPickup.driver_phone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    📞 기사에게 전화
                  </a>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ✅ 이 안내는 알림(메시지)으로도 전달되었습니다.
              </p>
            </div>
          )}

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

          {/* 재진 일정 안내 — 재진 단계에 도달하면 숙박·서비스·일정 재예약 버튼 노출(항목12) */}
          {(journey.data?.done_stages.includes("follow_up") || journey.data?.current_stage === "follow_up") && (
            <div className="rounded-2xl border border-primary/30 bg-primary-light/40 p-5">
              <h3 className="text-sm font-bold text-primary-dark">🔁 재진 일정</h3>
              <p className="mt-1 text-xs text-gray-600">재진 일정이 잡혔습니다. 재진에 맞춰 숙박·서비스·일정을 다시 예약해 주세요.</p>
              {onRebook && (
                <button type="button" onClick={onRebook}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                  재진 숙박·서비스 예약하기 →
                </button>
              )}
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
              ) : draftBookings.length > 0 ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {draftBookings.map((b) => (
                    <div key={b.id} className="text-sm text-gray-600">
                      🏥 {b.procedureName}
                      {b.dateSlots?.[0]?.date && (
                        <span className="text-gray-500"> · {b.dateSlots[0].date}{b.dateSlots[0].time ? ` ${b.dateSlots[0].time}` : ""} 예정</span>
                      )}
                    </div>
                  ))}
                  <span className="mt-0.5 text-[11px] text-primary-dark">확정 일정은 병원 배정 후 안내됩니다.</span>
                </div>
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
                  {activeTransfer.driver_photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeTransfer.driver_photo} alt="기사 사진"
                      className="mb-2 h-16 w-16 rounded-xl border border-gray-200 object-cover" />
                  )}
                  <p>
                    🚐 {TRANSFER_LABEL[activeTransfer.type] ?? activeTransfer.type}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    기사 {activeTransfer.driver_name} · {activeTransfer.car_number}
                    {activeTransfer.gate && <> · 🚪 {activeTransfer.gate}번 게이트</>}
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={`tel:${activeTransfer.driver_phone}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                      >
                        📞 기사에게 전화
                      </a>
                      <a
                        href={`https://wa.me/${activeTransfer.driver_phone.replace(/[^0-9]/g, "").replace(/^0/, "82")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">픽업 정보 없음</p>
              )}
            </div>
          </div>

          {/* 통역사 안내 — 운영관리자가 배정하면 표시 */}
          {interpreters.data && interpreters.data.length > 0 && (interpreters.data[0].name || interpreters.data[0].phone) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-700">통역사 안내</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  🗣️ {interpreters.data[0].name ?? "통역사"}
                  {interpreters.data[0].lang && <> · {interpreters.data[0].lang}</>}
                </p>
                {interpreters.data[0].note && (
                  <p className="mt-1 text-xs text-gray-500">{interpreters.data[0].note}</p>
                )}
                {interpreters.data[0].phone && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${interpreters.data[0].phone}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                    >
                      📞 통역사에게 전화
                    </a>
                    <a
                      href={`https://wa.me/${interpreters.data[0].phone.replace(/[^0-9]/g, "").replace(/^0/, "82")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 문의 채널 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-gray-700">문의 채널</h3>
            <p className="mb-2 text-xs text-gray-500">
              담당: {COORDINATOR.name} ({COORDINATOR.title})
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`${COORDINATOR.whatsapp}?text=KMTP%20문의드립니다`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600"
              >
                📱 WhatsApp으로 문의하기
              </a>
              <a
                href="https://open.kakao.com/o/kmtp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-800 transition-colors hover:bg-yellow-500"
              >
                💬 카카오톡 문의하기
              </a>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              📞 {COORDINATOR.phone} · 한국어 · 영어 · 중국어 지원 · 평일 09:00–18:00
            </p>
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
