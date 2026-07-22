"use client";

// 3단계: 견적 요청 → b2b 전송 → 견적 대기 → 견적 도착(데모) → 확인 → 에스크로
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { B2B_API_BASE } from "@/lib/api";
import {
  HOSPITALS,
  DEPARTMENTS,
  HOTELS,
  formatKRW,
  findHotel,
  findHotelRoom,
} from "@/lib/data";
import { loadProfile, fullName } from "@/lib/profile";
import { findServiceCategory } from "@/lib/services";
import type { TreatmentBooking, ServiceItem } from "@/lib/booking";

const CHARTER_OPTIONS = findServiceCategory("charter")?.options ?? [];

type Props = {
  account: Account;
  nationality: string;
  bookings: TreatmentBooking[];
  hotelId: string | null;
  hotelRoomId: string;
  nights: number;
  services: ServiceItem[];
  grandTotal: number;
  companions: number;
  caseId: string;
  accommodationId?: string | null;
  onPrev: () => void;
  onNext: () => void;
};

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

function getQuoteTotal(hospitalId: string, deptId: string): number {
  const hospital = HOSPITALS.find((h) => h.id === hospitalId);
  return hospital?.treatments.find((t) => t.deptId === deptId)?.total ?? 0;
}

function hospitalName(id: string) {
  return HOSPITALS.find((h) => h.id === id)?.name ?? id;
}

function serviceLabel(s: ServiceItem) {
  if (s.type === "통역") {
    const place = s.interpPlace ? ` · ${s.interpPlace}` : "";
    const timeRange = s.startTime && s.endTime ? ` · ${s.startTime}~${s.endTime}` : "";
    return `통역 · ${s.interpLang || s.language || "-"}${timeRange}${place}`;
  }
  if (s.type === "배차") {
    // 전용차량 대절 — 대절옵션 · 픽업장소 · 픽업시간
    const opt = CHARTER_OPTIONS.find((o) => o.id === s.charterOption);
    const when = [s.date, s.time].filter(Boolean).join(" ");
    const pickup = s.from ? `픽업: ${s.from}` : "";
    return `배차 · ${opt?.name ?? "대절"} · ${[pickup, when].filter(Boolean).join(" · ") || "-"}`;
  }
  if (s.type === "공항픽업") {
    // 공항픽업 — 차량등급 · 날짜·시간 · 항공편 (details에 반드시 날짜·시간 포함)
    const when = [s.date, s.time].filter(Boolean).join(" ");
    const flight = s.flightNumber ? `항공편 ${s.flightNumber}` : "";
    const grade = s.vehicleGrade ? `[${s.vehicleGrade}]` : "";
    return `공항픽업 · ${[grade, when, flight].filter(Boolean).join(" · ") || "-"}`;
  }
  // 택시 — 출발→도착 + 일시
  const route = [s.from, s.to].filter(Boolean).join(" → ");
  const when = [s.date, s.time].filter(Boolean).join(" ");
  return `${s.type} · ${[route, when].filter(Boolean).join(" · ") || "-"}`;
}

export default function StepQuoteRequest({
  account,
  nationality,
  bookings,
  hotelId,
  hotelRoomId,
  nights,
  services,
  grandTotal,
  companions,
  caseId,
  accommodationId,
  onPrev,
  onNext,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoQuoteVisible, setDemoQuoteVisible] = useState(false);

  const selectedHotel = findHotel(hotelId);
  const selectedRoom = selectedHotel
    ? findHotelRoom(selectedHotel, hotelRoomId)
    : null;

  const treatmentTotal = bookings.reduce(
    (sum, b) => sum + b.procedurePriceKRW,
    0,
  );
  const hotelTotal = selectedRoom ? selectedRoom.perNight * nights : 0;

  async function handleSubmit() {
    setSubmitting(true);
    const profile = loadProfile(account.id);
    const patientName = fullName(profile) || account.name || "환자";

    const items: { service_type: string; details: string; procedure_id?: string; procedure_name?: string; price_krw?: number }[] = [
      ...bookings.map((b) => ({
        service_type: deptName(b.deptId),
        details: `${hospitalName(b.hospitalId)} · ${b.procedureName} · 희망: ${b.dateSlots?.map(s => s.date).filter(Boolean).join('/').slice(0, 30)} · ${formatKRW(b.procedurePriceKRW)}`,
        procedure_id: b.procedureId,
        procedure_name: b.procedureName,
        price_krw: b.procedurePriceKRW,
      })),
      ...(selectedHotel && selectedRoom
        ? [
            {
              service_type: "호텔",
              details: `${selectedHotel.name} · ${selectedRoom.name} · ${nights}박 · ${formatKRW(hotelTotal)}`,
            },
          ]
        : []),
      ...services.map((s) => ({
        service_type: s.type,   // 공항픽업 / 택시 / 배차 / 통역
        details: serviceLabel(s),
        price_krw: s.priceKRW ?? 0,
      })),
    ];

    try {
      await fetch(`${B2B_API_BASE}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          patient_name: patientName,
          nationality,
          companions,
          accommodation_id: accommodationId ?? null,
          grand_total: grandTotal,
          items,
        }),
      });
    } catch {
      // 전송 실패는 무시하고 진행
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          견적 요청
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          선택하신 내용을 확인하고 견적을 요청하세요.
        </p>
      </div>

      {/* 예약 요약 카드 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-3 text-sm">
        <p className="font-bold text-gray-700 text-base mb-1">예약 요약</p>

        {/* 시술 목록 */}
        {bookings.map((b) => (
          <div
            key={b.id}
            className="flex items-start justify-between gap-3 py-1 border-b border-gray-100 last:border-b-0"
          >
            <div>
              <span className="font-semibold text-gray-800">{b.procedureName}</span>
              <span className="ml-2 text-xs text-gray-400">{deptName(b.deptId)}</span>
              <p className="text-xs text-gray-500">{hospitalName(b.hospitalId)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                희망: {(b.dateSlots ?? []).map(s => s.date + ' ' + s.time).filter(Boolean).join(' / ')}
              </p>
            </div>
            <span className="font-bold text-primary shrink-0">
              {formatKRW(b.procedurePriceKRW)}
            </span>
          </div>
        ))}

        {/* 호텔 */}
        {selectedHotel && selectedRoom && (
          <div className="flex items-center justify-between py-1 border-b border-gray-100">
            <div>
              <span className="font-semibold text-gray-800">
                {selectedHotel.name}
              </span>
              <span className="ml-2 text-xs text-gray-400">
                {selectedRoom.name} × {nights}박
              </span>
            </div>
            <span className="font-bold text-primary">{formatKRW(hotelTotal)}</span>
          </div>
        )}

        {/* 부가서비스 */}
        {services.length > 0 && (
          <div className="py-1">
            <p className="text-xs font-semibold text-gray-500 mb-1">부가서비스</p>
            {services.map((s) => (
              <p key={s.id} className="text-xs text-gray-600">
                · {serviceLabel(s)}
              </p>
            ))}
          </div>
        )}

        {/* 합계 */}
        <div className="mt-2 border-t-2 border-gray-100 pt-3">
          <div className="flex justify-between font-bold text-primary-dark">
            <span>시술 견적 합계</span>
            <span>{formatKRW(treatmentTotal)}</span>
          </div>
          {hotelTotal > 0 && (
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>호텔 합계</span>
              <span>{formatKRW(hotelTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black text-primary mt-2">
            <span>총 예상 견적</span>
            <span>{formatKRW(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 견적 요청 버튼 */}
      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full rounded-2xl py-4 text-base font-black text-white transition-colors ${
            submitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {submitting ? "전송 중…" : "견적 요청 보내기 →"}
        </button>
      ) : (
        <>
          {/* 완료 배너 */}
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-bold text-emerald-700">견적 요청 완료</p>
              <p className="text-sm text-emerald-600">
                운영팀이 확인 후 최종 견적을 보내드립니다.
              </p>
            </div>
          </div>

          {/* 견적 대기 안내 */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">견적 대기 중…</p>
            <p>운영팀이 병원·호텔 일정을 확인 후 최종 견적을 보내드립니다.</p>
            <p className="mt-1 text-xs text-gray-400">
              보통 영업일 기준 1~2시간 내 회신
            </p>
            <button
              type="button"
              onClick={() => setDemoQuoteVisible(true)}
              className="mt-3 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-xs font-bold text-gray-500 hover:border-primary/40 hover:text-primary transition-colors"
            >
              데모: 견적 도착 시뮬레이션
            </button>
          </div>

          {/* 데모 견적 */}
          {demoQuoteVisible && (
            <div className="rounded-2xl border-2 border-primary/30 bg-white p-5 flex flex-col gap-3 text-sm">
              <p className="font-bold text-primary-dark text-base">
                📩 최종 견적서 도착
              </p>
              <p className="text-xs text-gray-400">
                아래 견적은 운영팀이 최종 확인한 가격입니다.
              </p>

              {bookings.map((b) => (
                <div key={b.id} className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-700">
                    {deptName(b.deptId)} · {hospitalName(b.hospitalId)}
                  </span>
                  <span className="font-bold text-primary">
                    {formatKRW(getQuoteTotal(b.hospitalId, b.deptId))}
                  </span>
                </div>
              ))}

              {selectedHotel && selectedRoom && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-700">
                    {selectedHotel.name} · {selectedRoom.name} × {nights}박
                  </span>
                  <span className="font-bold text-primary">{formatKRW(hotelTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-black text-primary border-t-2 border-primary/20 pt-3">
                <span>총 최종 견적</span>
                <span>{formatKRW(grandTotal)}</span>
              </div>

              <button
                type="button"
                onClick={onNext}
                className="mt-2 w-full rounded-2xl bg-primary py-4 text-base font-black text-white hover:bg-primary-dark transition-colors"
              >
                결제 및 에스크로 진행 →
              </button>
            </div>
          )}
        </>
      )}

      {/* Prev */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-primary/40"
        >
          ← 이전
        </button>
        {submitted && !demoQuoteVisible && (
          <span className="text-xs text-gray-400">
            견적 도착 후 에스크로 진행 가능합니다
          </span>
        )}
      </div>
    </div>
  );
}
