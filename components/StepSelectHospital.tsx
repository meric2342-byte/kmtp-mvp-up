"use client";

// 1단계: 국적 → 과 선택 → 개별 시술 선택 → 병원 선택 → 날짜 5개
import { useState } from "react";
import { HOSPITALS, DEPARTMENTS, formatKRW, formatFX } from "@/lib/data";
import { WORLD_COUNTRIES } from "@/lib/countries";
import { PROCEDURES, proceduresByDept, type Procedure } from "@/lib/procedures";
import type { TreatmentBooking } from "@/lib/booking";

export type { TreatmentBooking };

type Props = {
  nationality: string;
  onSelectNationality: (v: string) => void;
  bookings: TreatmentBooking[];
  onUpdateBookings: (b: TreatmentBooking[]) => void;
  onNext: () => void;
};

type FormStep = "dept" | "proc" | "hospital" | "dates";

const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

function priceLabel(p: Procedure): string {
  if (p.quote) return "상담 견적";
  if (p.priceMaxKRW) return `${formatKRW(p.priceKRW)} ~ ${formatKRW(p.priceMaxKRW)}`;
  return formatKRW(p.priceKRW);
}

function priceFX(p: Procedure): string {
  if (p.quote || p.priceKRW === 0) return "";
  return formatFX(p.priceMaxKRW ?? p.priceKRW);
}

// 병원이 해당 deptId 시술을 제공하는지 (treatments 기반 자동 매핑)
function hospitalOffersDept(hospitalId: string, deptId: string): boolean {
  const h = HOSPITALS.find((h) => h.id === hospitalId);
  return h?.treatments.some((t) => t.deptId === deptId) ?? false;
}

export default function StepSelectHospital({
  nationality,
  onSelectNationality,
  bookings,
  onUpdateBookings,
  onNext,
}: Props) {
  // 폼 내부 단계
  const [formStep, setFormStep] = useState<FormStep>("dept");

  // 현재 추가 중인 선택값
  const [selDeptId, setSelDeptId] = useState<string | null>(null);
  const [selProc, setSelProc] = useState<Procedure | null>(null);
  const [selHospitalId, setSelHospitalId] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>(["", "", "", "", ""]);
  const [time, setTime] = useState("");

  // 과 선택된 시술 목록
  const procs = selDeptId ? proceduresByDept(selDeptId) : [];

  // 시술 선택된 병원 목록 (해당 deptId 지원 병원만)
  const availableHospitals = selProc
    ? HOSPITALS.filter((h) => hospitalOffersDept(h.id, selProc.deptId))
    : [];

  function chosenDates() {
    return dates.filter(Boolean);
  }

  function reset() {
    setFormStep("dept");
    setSelDeptId(null);
    setSelProc(null);
    setSelHospitalId(null);
    setDates(["", "", "", "", ""]);
    setTime("");
  }

  function addToList() {
    if (!selProc || !selHospitalId || chosenDates().length === 0 || !time) return;
    const newBooking: TreatmentBooking = {
      id: `${selHospitalId}-${selProc.id}-${Date.now()}`,
      hospitalId: selHospitalId,
      deptId: selProc.deptId,
      procedureId: selProc.id,
      procedureName: selProc.name,
      procedurePriceKRW: selProc.priceKRW,
      procedurePriceMaxKRW: selProc.priceMaxKRW,
      dates: chosenDates(),
      time,
    };
    onUpdateBookings([...bookings, newBooking]);
    reset();
  }

  function removeBooking(id: string) {
    onUpdateBookings(bookings.filter((b) => b.id !== id));
  }

  const canAdd =
    selHospitalId !== null &&
    selProc !== null &&
    chosenDates().length >= 1 &&
    time !== "";

  const canNext = nationality.trim() !== "" && bookings.length > 0;

  const STEPS: { key: FormStep; label: string }[] = [
    { key: "dept", label: "① 진료과" },
    { key: "proc", label: "② 시술" },
    { key: "hospital", label: "③ 병원" },
    { key: "dates", label: "④ 날짜·시간" },
  ];

  const stepReachable = (s: FormStep) => {
    if (s === "dept") return true;
    if (s === "proc") return selDeptId !== null;
    if (s === "hospital") return selProc !== null;
    if (s === "dates") return selHospitalId !== null;
    return false;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">시술 · 병원 · 일정</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국적 선택 후 진료과→시술→병원→날짜 순으로 추가하세요. 복수 추가 가능합니다.
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
          <option value="">국적 선택</option>
          {WORLD_COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>

      {/* 추가 폼 카드 */}
      <div className="rounded-2xl border-2 border-primary/20 bg-white overflow-hidden">
        {/* 탭 */}
        <div className="flex border-b border-gray-100">
          {STEPS.map((s) => {
            const ok = stepReachable(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => ok && setFormStep(s.key)}
                disabled={!ok}
                className={`flex-1 py-3 text-[11px] font-bold transition-colors sm:text-xs ${
                  formStep === s.key
                    ? "border-b-2 border-primary text-primary bg-primary-light/30"
                    : ok
                    ? "text-gray-500 hover:text-primary"
                    : "cursor-not-allowed text-gray-300"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* ① 진료과 선택 */}
          {formStep === "dept" && (
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-500">진료과를 선택하세요</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DEPARTMENTS.map((d) => {
                  // 해당 과에 시술이 있는 경우만 표시
                  const hasProcedures = proceduresByDept(d.id).length > 0;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelDeptId(d.id);
                        setSelProc(null);
                        setSelHospitalId(null);
                        setFormStep("proc");
                      }}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        selDeptId === d.id
                          ? "border-primary bg-primary-light font-bold text-primary-dark"
                          : hasProcedures
                          ? "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                      disabled={!hasProcedures}
                    >
                      <span className="text-base">{d.icon}</span>
                      <span className="text-xs leading-tight">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ② 개별 시술 선택 */}
          {formStep === "proc" && selDeptId && (
            <div>
              <button
                type="button"
                onClick={() => setFormStep("dept")}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                ← {DEPARTMENTS.find((d) => d.id === selDeptId)?.name}
              </button>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                시술을 선택하세요 (금액은 참고용 목업입니다)
              </p>
              <div className="flex flex-col gap-2">
                {procs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelProc(p);
                      setSelHospitalId(null);
                      setFormStep("hospital");
                    }}
                    className={`flex items-start justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      selProc?.id === p.id
                        ? "border-primary bg-primary-light"
                        : "border-gray-200 bg-white hover:border-primary/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                      {p.note && <p className="text-[11px] text-gray-400 mt-0.5">{p.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${p.quote ? "text-amber-600" : "text-primary"}`}>
                        {priceLabel(p)}
                      </p>
                      {!p.quote && p.priceKRW > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{priceFX(p)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ③ 병원 선택 */}
          {formStep === "hospital" && selProc && (
            <div>
              <button
                type="button"
                onClick={() => setFormStep("proc")}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                ← {selProc.name}
              </button>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                이 시술을 제공하는 병원을 선택하세요
              </p>
              {availableHospitals.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">해당 시술 제공 병원이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableHospitals.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setSelHospitalId(h.id); setFormStep("dates"); }}
                      className={`flex items-start justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selHospitalId === h.id
                          ? "border-primary bg-primary-light"
                          : "border-gray-200 bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.area}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {h.badges.slice(0, 2).map((b) => (
                            <span
                              key={b}
                              className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary-dark"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-amber-500 font-semibold">★ {h.rating}</p>
                        <p className="text-[11px] text-gray-400">후기 {h.reviewCount.toLocaleString()}건</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ④ 날짜·시간 */}
          {formStep === "dates" && selProc && selHospitalId && (
            <div>
              <div className="mb-3 rounded-lg bg-primary-light/50 px-3 py-2 text-xs">
                <p className="font-bold text-primary-dark">
                  {HOSPITALS.find((h) => h.id === selHospitalId)?.name}
                </p>
                <p className="text-gray-600 mt-0.5">
                  {selProc.name} · <span className="font-semibold text-primary">{priceLabel(selProc)}</span>
                </p>
              </div>

              <p className="mb-2 text-xs font-semibold text-gray-600">
                희망 날짜 (최대 5개 — 병원이 하나로 확정합니다)
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-xs text-gray-400">{i + 1}지망</span>
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
              onClick={reset}
              className="text-xs font-semibold text-primary hover:underline"
            >
              + 시술 더 추가
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {bookings.map((b) => {
              const hospital = HOSPITALS.find((h) => h.id === b.hospitalId);
              const dept = DEPARTMENTS.find((d) => d.id === b.deptId);
              const proc = PROCEDURES.find((p) => p.id === b.procedureId);
              const priceStr = proc
                ? priceLabel(proc)
                : formatKRW(b.procedurePriceKRW);
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 rounded-xl border border-primary/20 bg-white px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">
                      {dept?.icon} {b.procedureName}
                    </p>
                    <p className="text-xs text-gray-500">{hospital?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      희망: {b.dates.filter(Boolean).join(" / ")}
                      {b.time && ` · ${b.time}`}
                    </p>
                    <p className="mt-1 text-xs font-black text-primary">{priceStr}</p>
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
            <span className="text-lg font-black text-primary">
              {formatKRW(bookings.reduce((s, b) => s + b.procedurePriceKRW, 0))}
            </span>
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
          {nationality === "" ? "국적을 먼저 선택해주세요" : "시술을 1개 이상 추가해주세요"}
        </p>
      )}
    </div>
  );
}

const inp =
  "w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
