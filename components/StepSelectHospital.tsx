"use client";

// 1단계: 진료과 → 시술(가격없음) → 병원 → 가격확인+날짜/시간(개별)
import { useState } from "react";
import { HOSPITALS, DEPARTMENTS, formatKRW, formatFX } from "@/lib/data";
import { WORLD_COUNTRIES } from "@/lib/countries";
import { PROCEDURES, proceduresByDept, type Procedure } from "@/lib/procedures";
import type { TreatmentBooking, DateSlot } from "@/lib/booking";

export type { TreatmentBooking };

type Props = {
  nationality: string;
  onSelectNationality: (v: string) => void;
  bookings: TreatmentBooking[];
  onUpdateBookings: (b: TreatmentBooking[]) => void;
  onNext: () => void;
};

type FormStep = "dept" | "proc" | "hospital" | "confirm";

const TIMES: string[] = [];
for (let h = 8; h <= 18; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 18) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

const EMPTY_SLOT: DateSlot = { date: "", time: "" };

function deptOf(id: string) { return DEPARTMENTS.find((d) => d.id === id); }
function hospitalOf(id: string) { return HOSPITALS.find((h) => h.id === id); }

// 병원에서 이 시술의 deptId 로 묶인 패키지 가격 (병원별 정의)
function hospitalProcPrice(hospitalId: string, proc: Procedure): number | null {
  const h = HOSPITALS.find((h) => h.id === hospitalId);
  const t = h?.treatments.find((t) => t.deptId === proc.deptId);
  return t ? t.total : null;
}

function priceDisplay(proc: Procedure, hospitalId: string | null) {
  if (proc.quote) return { label: "상담 견적", sub: "" };
  // 병원 선택 전: 숨김
  if (!hospitalId) return null;
  // 병원 선택 후: 해당 병원 패키지 가격
  const pkg = hospitalProcPrice(hospitalId, proc);
  if (pkg) {
    return {
      label: formatKRW(pkg),
      sub: `(시술 포함 패키지 · ${formatFX(pkg)})`,
    };
  }
  // 패키지 가격 없으면 카탈로그 기준가
  if (proc.priceMaxKRW) {
    return { label: `${formatKRW(proc.priceKRW)} ~ ${formatKRW(proc.priceMaxKRW)}`, sub: formatFX(proc.priceMaxKRW) };
  }
  return { label: formatKRW(proc.priceKRW), sub: formatFX(proc.priceKRW) };
}

export default function StepSelectHospital({
  nationality,
  onSelectNationality,
  bookings,
  onUpdateBookings,
  onNext,
}: Props) {
  const [formStep, setFormStep] = useState<FormStep>("dept");
  const [selDeptId, setSelDeptId] = useState<string | null>(null);
  const [selProc, setSelProc] = useState<Procedure | null>(null);
  const [selHospitalId, setSelHospitalId] = useState<string | null>(null);
  // 날짜·시간 슬롯 5개
  const [slots, setSlots] = useState<DateSlot[]>([
    { ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT },
    { ...EMPTY_SLOT }, { ...EMPTY_SLOT },
  ]);

  const procs = selDeptId ? proceduresByDept(selDeptId) : [];
  const availableHospitals = selProc
    ? HOSPITALS.filter((h) => h.treatments.some((t) => t.deptId === selProc.deptId))
    : [];

  function filledSlots() { return slots.filter((s) => s.date && s.time); }

  function setSlot(i: number, field: keyof DateSlot, val: string) {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  function reset() {
    setFormStep("dept");
    setSelDeptId(null);
    setSelProc(null);
    setSelHospitalId(null);
    setSlots(Array.from({ length: 5 }, () => ({ ...EMPTY_SLOT })));
  }

  function addToList() {
    if (!selProc || !selHospitalId || filledSlots().length === 0) return;
    const pkg = hospitalProcPrice(selHospitalId, selProc);
    const price = pkg ?? selProc.priceKRW;
    const booking: TreatmentBooking = {
      id: `${selHospitalId}-${selProc.id}-${Date.now()}`,
      hospitalId: selHospitalId,
      deptId: selProc.deptId,
      procedureId: selProc.id,
      procedureName: selProc.name,
      procedurePriceKRW: price,
      procedurePriceMaxKRW: selProc.priceMaxKRW,
      dateSlots: filledSlots(),
    };
    onUpdateBookings([...bookings, booking]);
    reset();
  }

  function removeBooking(id: string) {
    onUpdateBookings(bookings.filter((b) => b.id !== id));
  }

  const pd = selProc && selHospitalId ? priceDisplay(selProc, selHospitalId) : null;
  const canAdd = selProc !== null && selHospitalId !== null && filledSlots().length > 0;
  const canNext = nationality.trim() !== "" && bookings.length > 0;

  const TAB_LABELS: Record<FormStep, string> = {
    dept: "① 진료과",
    proc: "② 시술",
    hospital: "③ 병원",
    confirm: "④ 가격·날짜",
  };

  const stepOrder: FormStep[] = ["dept", "proc", "hospital", "confirm"];
  function reachable(s: FormStep) {
    const i = stepOrder.indexOf(s);
    if (i === 0) return true;
    if (i === 1) return selDeptId !== null;
    if (i === 2) return selProc !== null;
    return selHospitalId !== null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">시술 · 병원 · 일정</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국적 선택 후 진료과→시술→병원→가격확인·날짜 순으로 추가하세요.
        </p>
      </div>

      {/* 국적 */}
      <section className="flex items-center gap-3">
        <label className="shrink-0 text-sm font-semibold text-gray-700">국적</label>
        <select value={nationality} onChange={(e) => onSelectNationality(e.target.value)} className={inp}>
          <option value="">국적 선택</option>
          {WORLD_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      {/* 추가 폼 */}
      <div className="rounded-2xl border-2 border-primary/20 bg-white overflow-hidden">
        {/* 탭 */}
        <div className="flex border-b border-gray-100">
          {stepOrder.map((s) => {
            const ok = reachable(s);
            return (
              <button key={s} type="button" onClick={() => ok && setFormStep(s)} disabled={!ok}
                className={`flex-1 py-3 text-[11px] font-bold transition-colors sm:text-xs ${
                  formStep === s ? "border-b-2 border-primary text-primary bg-primary-light/30"
                  : ok ? "text-gray-500 hover:text-primary" : "cursor-not-allowed text-gray-300"
                }`}>
                {TAB_LABELS[s]}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* ① 진료과 */}
          {formStep === "dept" && (
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-500">진료과를 선택하세요</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DEPARTMENTS.map((d) => {
                  const has = proceduresByDept(d.id).length > 0;
                  return (
                    <button key={d.id} type="button" disabled={!has}
                      onClick={() => { setSelDeptId(d.id); setSelProc(null); setSelHospitalId(null); setFormStep("proc"); }}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        selDeptId === d.id ? "border-primary bg-primary-light font-bold text-primary-dark"
                        : has ? "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                        : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}>
                      <span className="text-base">{d.icon}</span>
                      <span className="text-xs leading-tight">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ② 시술 (가격 숨김) */}
          {formStep === "proc" && selDeptId && (
            <div>
              <button type="button" onClick={() => setFormStep("dept")}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline">
                ← {deptOf(selDeptId)?.name}
              </button>
              <p className="mb-3 text-xs font-semibold text-gray-500">시술을 선택하세요</p>
              <div className="flex flex-col gap-2">
                {procs.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => { setSelProc(p); setSelHospitalId(null); setFormStep("hospital"); }}
                    className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      selProc?.id === p.id ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"
                    }`}>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                      {p.note && <p className="text-[11px] text-gray-400 mt-0.5">{p.note}</p>}
                    </div>
                    {/* 가격은 병원 선택 전 숨김 */}
                    {p.quote && (
                      <span className="text-xs text-amber-600 font-semibold shrink-0">상담 견적</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ③ 병원 선택 (가격 숨김) */}
          {formStep === "hospital" && selProc && (
            <div>
              <button type="button" onClick={() => setFormStep("proc")}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline">
                ← {selProc.name}
              </button>
              <p className="mb-3 text-xs font-semibold text-gray-500">
                병원을 선택하면 해당 병원의 가격을 확인할 수 있습니다
              </p>
              {availableHospitals.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">제공 병원이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableHospitals.map((h) => (
                    <button key={h.id} type="button"
                      onClick={() => { setSelHospitalId(h.id); setFormStep("confirm"); }}
                      className={`flex items-start justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selHospitalId === h.id ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"
                      }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.area}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {h.badges.slice(0, 2).map((b) => (
                            <span key={b} className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary-dark">{b}</span>
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

          {/* ④ 가격 확인 + 날짜·시간 개별 지정 */}
          {formStep === "confirm" && selProc && selHospitalId && (
            <div>
              {/* 가격 공개 */}
              <div className="mb-4 rounded-xl border-2 border-primary/30 bg-primary-light/40 px-4 py-4">
                <p className="text-xs text-gray-500 mb-1">
                  {hospitalOf(selHospitalId)?.name} · {selProc.name}
                </p>
                {pd ? (
                  <>
                    <p className="text-xl font-black text-primary">{pd.label}</p>
                    {pd.sub && <p className="text-xs text-gray-500 mt-0.5">{pd.sub}</p>}
                  </>
                ) : (
                  <p className="text-sm text-amber-600 font-semibold">상담 후 견적 안내</p>
                )}
                <p className="mt-2 text-[11px] text-gray-400">
                  ※ 참고용 목업 금액입니다. 실제 가격은 병원 확정 후 안내됩니다.
                </p>
              </div>

              {/* 날짜·시간 개별 지정 */}
              <p className="mb-2 text-xs font-semibold text-gray-600">
                희망 날짜·시간 (최대 5개 — 병원이 하나로 확정합니다)
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-xs text-gray-400">{i + 1}지망</span>
                    <input type="date" value={slot.date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setSlot(i, "date", e.target.value)}
                      className={`${inp} flex-1`} />
                    <select value={slot.time}
                      onChange={(e) => setSlot(i, "time", e.target.value)}
                      className={`${inp} w-28 shrink-0`}
                      disabled={!slot.date}>
                      <option value="">시간</option>
                      {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {filledSlots().length > 0 && (
                <p className="mb-3 text-xs text-primary-dark">
                  ✓ {filledSlots().length}개 날짜·시간 입력됨
                </p>
              )}

              <button type="button" onClick={addToList} disabled={!canAdd}
                className={`w-full rounded-xl py-3 font-bold text-white transition-colors ${
                  canAdd ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"
                }`}>
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
            <button type="button" onClick={reset}
              className="text-xs font-semibold text-primary hover:underline">
              + 시술 더 추가
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {bookings.map((b) => {
              const d = deptOf(b.deptId);
              const h = hospitalOf(b.hospitalId);
              return (
                <div key={b.id}
                  className="flex items-start gap-3 rounded-xl border border-primary/20 bg-white px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{d?.icon} {b.procedureName}</p>
                    <p className="text-xs text-gray-500">{h?.name}</p>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {b.dateSlots.map((s, i) => (
                        <p key={i} className="text-xs text-gray-400">
                          {i + 1}지망: {s.date} {s.time}
                        </p>
                      ))}
                    </div>
                    <p className="mt-1 text-xs font-black text-primary">
                      {b.procedurePriceKRW > 0 ? formatKRW(b.procedurePriceKRW) : "상담 견적"}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeBooking(b.id)}
                    className="text-gray-400 hover:text-red-500 text-lg leading-none">✕</button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-light px-4 py-3">
            <span className="text-sm font-semibold text-primary-dark">총 예상 시술 견적</span>
            <span className="text-lg font-black text-primary">
              {formatKRW(bookings.reduce((s, b) => s + b.procedurePriceKRW, 0))}
            </span>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onNext} disabled={!canNext}
          className={`rounded-xl px-8 py-3 font-bold text-white transition-colors ${
            canNext ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"
          }`}>
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

const inp = "w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
