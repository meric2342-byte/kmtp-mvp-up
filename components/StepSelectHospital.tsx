"use client";

// 1단계: 국적 + 병원·시술 선택 + 날짜·시간 설정 (통합)
import { useState } from "react";
import { COUNTRIES, HOSPITALS, DEPARTMENTS, formatKRW } from "@/lib/data";
import type { TreatmentBooking } from "@/lib/booking";

export type { TreatmentBooking };

type Props = {
  nationality: string;
  onSelectNationality: (v: string) => void;
  bookings: TreatmentBooking[];
  onUpdateBookings: (b: TreatmentBooking[]) => void;
  onNext: () => void;
};

// 30분 단위 시간 옵션 생성 (09:00 ~ 17:00)
const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

function deptIcon(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.icon ?? "🏥";
}

export default function StepSelectHospital({
  nationality,
  onSelectNationality,
  bookings,
  onUpdateBookings,
  onNext,
}: Props) {
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);

  function addBooking(hospitalId: string, deptId: string) {
    const id = `${hospitalId}-${deptId}-${Date.now()}`;
    onUpdateBookings([...bookings, { id, hospitalId, deptId, date: "", time: "" }]);
  }

  function updateBooking(id: string, patch: Partial<TreatmentBooking>) {
    onUpdateBookings(bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBooking(id: string) {
    onUpdateBookings(bookings.filter((b) => b.id !== id));
  }

  function getQuoteTotal(hospitalId: string, deptId: string): number {
    const hospital = HOSPITALS.find((h) => h.id === hospitalId);
    return hospital?.treatments.find((t) => t.deptId === deptId)?.total ?? 0;
  }

  function hospitalName(id: string) {
    return HOSPITALS.find((h) => h.id === id)?.name ?? id;
  }

  const totalQuote = bookings.reduce(
    (sum, b) => sum + getQuoteTotal(b.hospitalId, b.deptId),
    0,
  );

  const canProceed =
    nationality.trim() !== "" &&
    bookings.length > 0 &&
    bookings.every((b) => b.date !== "" && b.time !== "");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          시술 · 일정 선택
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국적을 선택하고, 원하는 병원·시술·날짜를 추가해주세요.
        </p>
      </div>

      {/* 국적 선택 */}
      <section className="flex items-center gap-3">
        <label className="shrink-0 text-sm font-semibold text-gray-700">국적</label>
        <select
          value={nationality}
          onChange={(e) => onSelectNationality(e.target.value)}
          className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="">국적을 선택해주세요</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.name}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </section>

      {/* 병원 리스트 — 시술 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          🏥 시술 추가 — 병원을 클릭해 시술을 선택하세요
        </h3>
        <div className="flex flex-col gap-2">
          {HOSPITALS.map((hospital) => {
            const isExpanded = expandedHospital === hospital.id;
            return (
              <div
                key={hospital.id}
                className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden transition-all"
              >
                {/* 병원 헤더 */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedHospital(isExpanded ? null : hospital.id)
                  }
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">
                        {hospital.name}
                      </span>
                      <span className="text-xs text-gray-400">{hospital.area}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-amber-500 font-semibold">
                        ★ {hospital.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({hospital.reviewCount.toLocaleString()}개 후기)
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {hospital.badges.slice(0, 2).map((b) => (
                          <span
                            key={b}
                            className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary-dark"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* 시술 태그 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="mb-2 text-xs font-semibold text-gray-500">
                      시술 선택 (클릭하면 목록에 추가됩니다)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hospital.treatments.map((t) => (
                        <button
                          key={t.deptId}
                          type="button"
                          onClick={() => addBooking(hospital.id, t.deptId)}
                          className="flex items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary-dark transition-all hover:border-primary hover:bg-primary-light"
                        >
                          <span>{deptIcon(t.deptId)}</span>
                          <span>{deptName(t.deptId)}</span>
                          <span className="ml-1 text-xs font-black text-primary">
                            {formatKRW(t.total)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 선택된 시술 목록 */}
      {bookings.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            📋 선택된 시술 목록
          </h3>
          <div className="flex flex-col gap-3">
            {bookings.map((b) => {
              const total = getQuoteTotal(b.hospitalId, b.deptId);
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border-2 border-primary/20 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">
                        {deptIcon(b.deptId)} {deptName(b.deptId)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {hospitalName(b.hospitalId)}
                      </p>
                      <p className="text-sm font-black text-primary mt-1">
                        {formatKRW(total)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBooking(b.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        날짜 선택
                      </label>
                      <input
                        type="date"
                        value={b.date}
                        onChange={(e) => updateBooking(b.id, { date: e.target.value })}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        시간 선택
                      </label>
                      <select
                        value={b.time}
                        onChange={(e) => updateBooking(b.id, { time: e.target.value })}
                        className={inp}
                      >
                        <option value="">시간 선택</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 가격 합계 */}
      {bookings.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary-light/40 px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary-dark">
            선택 시술 총 예상 견적
          </span>
          <span className="text-xl font-black text-primary">{formatKRW(totalQuote)}</span>
        </div>
      )}

      {/* 다음 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`rounded-xl px-8 py-3 font-bold text-white transition-colors ${
            canProceed
              ? "bg-primary hover:bg-primary-dark"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          다음 →
        </button>
      </div>

      {!canProceed && (nationality === "" || bookings.length === 0) && (
        <p className="text-center text-xs text-gray-400">
          {nationality === ""
            ? "국적을 선택해주세요"
            : "시술을 1개 이상 추가하고 날짜·시간을 입력해주세요"}
        </p>
      )}
    </div>
  );
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
