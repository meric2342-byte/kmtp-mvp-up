"use client";

// 1단계: 국적 → 시술 선택 → 병원 선택 → 날짜 5개(병원 컨펌) → 목록 추가 (복수 가능)
import { useState } from "react";
import { HOSPITALS, DEPARTMENTS, formatKRW } from "@/lib/data";
import { WORLD_COUNTRIES } from "@/lib/countries";
import type { TreatmentBooking } from "@/lib/booking";

export type { TreatmentBooking };

type Props = {
  nationality: string;
  onSelectNationality: (v: string) => void;
  bookings: TreatmentBooking[];
  onUpdateBookings: (b: TreatmentBooking[]) => void;
  onNext: () => void;
};

// 09:00 ~ 17:30, 30분 단위
const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const dept = (id: string) => DEPARTMENTS.find((d) => d.id === id);

export default function StepSelectHospital({
  nationality,
  onSelectNationality,
  bookings,
  onUpdateBookings,
  onNext,
}: Props) {
  // 현재 추가 중인 선택 상태
  const [step, setStep] = useState<"dept" | "hospital" | "dates">("dept");
  const [selDepts, setSelDepts] = useState<string[]>([]);
  const [selHospital, setSelHospital] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>(["", "", "", "", ""]);
  const [time, setTime] = useState("");

  // 선택 시술 기준으로 지원 병원 필터
  const availableHospitals =
    selDepts.length === 0
      ? []
      : HOSPITALS.filter((h) =>
          selDepts.some((deptId) => h.treatments.find((t) => t.deptId === deptId)),
        );

  function toggleDept(id: string) {
    setSelDepts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSelHospital(null);
  }

  function chosenDates() {
    return dates.filter(Boolean);
  }

  function getQuote(hospitalId: string, deptId: string) {
    return HOSPITALS.find((h) => h.id === hospitalId)?.treatments.find(
      (t) => t.deptId === deptId,
    );
  }

  function addToList() {
    if (!selHospital || selDepts.length === 0 || chosenDates().length === 0 || !time) return;
    const hospital = HOSPITALS.find((h) => h.id === selHospital)!;
    // 이 병원에서 지원하는 선택 시술만 추가
    const supported = selDepts.filter((deptId) =>
      hospital.treatments.find((t) => t.deptId === deptId),
    );
    const newBookings = supported.map((deptId) => ({
      id: `${selHospital}-${deptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      hospitalId: selHospital,
      deptId,
      dates: chosenDates(),
      time,
    }));
    onUpdateBookings([...bookings, ...newBookings]);
    // 초기화
    setSelDepts([]);
    setSelHospital(null);
    setDates(["", "", "", "", ""]);
    setTime("");
    setStep("dept");
  }

  function removeBooking(id: string) {
    onUpdateBookings(bookings.filter((b) => b.id !== id));
  }

  const totalQuote = bookings.reduce((sum, b) => {
    const q = getQuote(b.hospitalId, b.deptId);
    return sum + (q?.total ?? 0);
  }, 0);

  const canNext =
    nationality.trim() !== "" &&
    bookings.length > 0;

  const canAdd =
    selHospital !== null &&
    selDepts.length > 0 &&
    chosenDates().length >= 1 &&
    time !== "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">시술 · 병원 · 일정</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국적 선택 후, 원하는 시술과 병원·날짜를 추가해주세요. (복수 추가 가능)
        </p>
      </div>

      {/* 국적 */}
      <section className="flex items-center gap-3">
        <label className="shrink-0 text-sm font-semibold text-gray-700">국적</label>
        <select
          value={nationality}
          onChange={(e) => onSelectNationality(e.target.value)}
          className={inp}
        >
          <option value="">국적을 선택해주세요</option>
          {WORLD_COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>

      {/* 추가 폼 */}
      <div className="rounded-2xl border-2 border-primary/20 bg-white">
        {/* 진행 탭 */}
        <div className="flex border-b border-gray-100">
          {(["dept", "hospital", "dates"] as const).map((s, i) => {
            const labels = ["① 시술 선택", "② 병원 선택", "③ 날짜·시간"];
            const reachable =
              s === "dept" ||
              (s === "hospital" && selDepts.length > 0) ||
              (s === "dates" && selHospital !== null);
            return (
              <button
                key={s}
                type="button"
                onClick={() => reachable && setStep(s)}
                disabled={!reachable}
                className={`flex-1 py-3 text-xs font-bold transition-colors ${
                  step === s
                    ? "border-b-2 border-primary text-primary"
                    : reachable
                    ? "text-gray-500 hover:text-primary"
                    : "cursor-not-allowed text-gray-300"
                }`}
              >
                {labels[i]}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* Step A: 시술 선택 */}
          {step === "dept" && (
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                원하는 시술을 선택하세요 (복수 선택 가능)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DEPARTMENTS.map((d) => {
                  const sel = selDepts.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all ${
                        sel
                          ? "border-primary bg-primary-light font-bold text-primary-dark"
                          : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                      }`}
                    >
                      <span className="text-base">{d.icon}</span>
                      <span className="text-xs leading-tight">{d.name}</span>
                      {sel && <span className="ml-auto text-primary text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
              {selDepts.length > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep("hospital")}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                  >
                    병원 선택 →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step B: 병원 선택 */}
          {step === "hospital" && (
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                선택한 시술을 제공하는 병원을 선택하세요
              </p>
              {availableHospitals.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">해당 시술을 제공하는 병원이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableHospitals.map((h) => {
                    const isSel = h.id === selHospital;
                    const supported = selDepts.filter((deptId) =>
                      h.treatments.find((t) => t.deptId === deptId),
                    );
                    const subtotal = supported.reduce((sum, deptId) => {
                      const t = h.treatments.find((tr) => tr.deptId === deptId);
                      return sum + (t?.total ?? 0);
                    }, 0);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => { setSelHospital(h.id); setStep("dates"); }}
                        className={`rounded-xl border-2 p-3 text-left transition-all ${
                          isSel
                            ? "border-primary bg-primary-light"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{h.name}</p>
                            <p className="text-xs text-gray-400">{h.area}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              제공 시술: {supported.map((id) => dept(id)?.name ?? id).join(", ")}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-amber-500 font-semibold">★ {h.rating}</p>
                            <p className="text-xs font-black text-primary mt-0.5">
                              {formatKRW(subtotal)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step C: 날짜·시간 선택 */}
          {step === "dates" && selHospital && (
            <div>
              {(() => {
                const hospital = HOSPITALS.find((h) => h.id === selHospital)!;
                const supported = selDepts.filter((deptId) =>
                  hospital.treatments.find((t) => t.deptId === deptId),
                );
                return (
                  <>
                    <div className="mb-3 rounded-lg bg-primary-light/50 px-3 py-2">
                      <p className="text-xs font-bold text-primary-dark">{hospital.name}</p>
                      <p className="text-xs text-gray-600">
                        시술: {supported.map((id) => dept(id)?.name ?? id).join(", ")}
                      </p>
                    </div>

                    <p className="mb-2 text-xs font-semibold text-gray-600">
                      희망 날짜 (최대 5개 — 병원이 하나로 확정합니다)
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-xs text-gray-400">
                            {i + 1}지망
                          </span>
                          <input
                            type="date"
                            value={dates[i] ?? ""}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                              const next = [...dates];
                              next[i] = e.target.value;
                              setDates(next);
                            }}
                            className={`${inp} flex-1`}
                          />
                        </div>
                      ))}
                    </div>

                    <p className="mb-2 text-xs font-semibold text-gray-600">희망 시간</p>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`${inp} mb-4`}
                    >
                      <option value="">시간 선택</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    {chosenDates().length > 0 && (
                      <p className="mb-3 text-xs text-primary-dark">
                        ✓ {chosenDates().length}개 날짜 선택됨
                        {time && ` · 희망 시간 ${time}`}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={addToList}
                      disabled={!canAdd}
                      className={`w-full rounded-xl py-3 font-bold text-white transition-colors ${
                        canAdd ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"
                      }`}
                    >
                      + 목록에 추가
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 추가된 예약 목록 */}
      {bookings.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">📋 선택 목록</h3>
            <button
              type="button"
              onClick={() => { setStep("dept"); setSelDepts([]); setSelHospital(null); setDates(["","","","",""]); setTime(""); }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              + 시술 더 추가
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {bookings.map((b) => {
              const hospital = HOSPITALS.find((h) => h.id === b.hospitalId);
              const d = dept(b.deptId);
              const q = getQuote(b.hospitalId, b.deptId);
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 rounded-xl border border-primary/20 bg-white px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">
                      {d?.icon} {d?.name}
                    </p>
                    <p className="text-xs text-gray-500">{hospital?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      희망 날짜: {b.dates.filter(Boolean).join(" / ")}
                      {b.time && ` · ${b.time}`}
                    </p>
                    <p className="text-xs font-bold text-primary mt-1">
                      {formatKRW(q?.total ?? 0)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBooking(b.id)}
                    className="text-gray-400 hover:text-red-500 text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* 총 견적 */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-light px-4 py-3">
            <span className="text-sm font-semibold text-primary-dark">총 예상 시술 견적</span>
            <span className="text-lg font-black text-primary">{formatKRW(totalQuote)}</span>
          </div>
        </section>
      )}

      {/* 다음 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`rounded-xl px-8 py-3 font-bold text-white transition-colors ${
            canNext ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"
          }`}
        >
          다음 단계 →
        </button>
      </div>
      {!canNext && (
        <p className="text-center text-xs text-gray-400">
          {nationality === "" ? "국적을 먼저 선택해주세요" : "시술·병원·날짜를 1개 이상 추가해주세요"}
        </p>
      )}
    </div>
  );
}

const inp =
  "w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
