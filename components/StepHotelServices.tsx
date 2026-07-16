"use client";

// 3단계: 부가서비스 (택시/배차 차량등급 + 항공편 + 통역)
import { useState, useEffect, useRef } from "react";
import { formatKRW } from "@/lib/data";
import type { ServiceItem } from "@/lib/booking";

// ── Google Maps 자동완성 ──
type WindowWithGoogle = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          el: HTMLInputElement,
          opts?: Record<string, unknown>,
        ) => {
          addListener: (
            ev: string,
            cb: () => void,
          ) => { remove?: () => void };
          getPlace: () => {
            formatted_address?: string;
            name?: string;
          };
        };
      };
    };
  };
};

function useGoogleMaps(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    const w = window as WindowWithGoogle;
    if (w.google?.maps?.places) { setReady(true); return; }
    const existing = document.getElementById("gmaps-script");
    if (existing) { existing.addEventListener("load", () => setReady(true)); return; }
    const s = document.createElement("script");
    s.id = "gmaps-script";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=ko`;
    s.async = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

function AddressInput({
  value,
  onChange,
  placeholder,
  ready,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ready: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const places = (window as WindowWithGoogle).google?.maps?.places;
    if (!places) return;
    const ac = new places.Autocomplete(ref.current, {
      fields: ["formatted_address", "name"],
      componentRestrictions: { country: "kr" },
    });
    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const addr = place?.formatted_address ?? "";
      const name = place?.name ?? "";
      const label =
        name && addr && !addr.includes(name) ? `${name} (${addr})` : addr || name;
      if (label) onChange(label);
    });
    return () => { listener?.remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inp}
    />
  );
}

export type { ServiceItem };

// ── 차량 등급 정의 ──
const VEHICLE_GRADES = [
  {
    id: "sedan",
    name: "스탠다드 세단",
    desc: "공항·병원 단거리 이동",
    priceKRW: 80000,
    includes: ["기본 이동", "트렁크 1개"],
    icon: "🚗",
  },
  {
    id: "van",
    name: "프리미엄 밴",
    desc: "보호자·짐·휠체어 이동 적합",
    priceKRW: 150000,
    includes: ["최대 6인", "휠체어 탑재 가능", "트렁크 대형"],
    icon: "🚐",
  },
  {
    id: "vip",
    name: "VIP Meet&Greet",
    desc: "공항 게이트 영접 + 의전 차량",
    priceKRW: 280000,
    includes: ["게이트 영접", "전용 의전 차량", "짐 포터 포함"],
    icon: "⭐",
  },
] as const;

const INTERP_LANGS = ["영어", "러시아어", "몽골어", "중국어", "아랍어"] as const;
const INTERP_DURATIONS = [
  { id: "half", label: "반일 (4시간)", priceKRW: 200000 },
  { id: "full", label: "종일 (8시간)", priceKRW: 350000 },
] as const;

type Props = {
  companions: number;
  services: ServiceItem[];
  onUpdateServices: (s: ServiceItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
};

type ServiceType = "택시" | "배차" | "통역";

const SERVICE_TYPES: ServiceType[] = ["택시", "배차", "통역"];

const EMPTY_FORM = {
  type: "택시" as ServiceType,
  from: "",
  to: "",
  date: "",
  time: "",
  language: "",
  hours: "",
  vehicleGrade: "sedan",
  flightNumber: "",
  interpLang: "",
  interpDuration: "",
};

export default function StepHotelServices({
  companions,
  services,
  onUpdateServices,
  onPrev,
  onNext,
}: Props) {
  const mapsReady = useGoogleMaps();
  const [showAddForm, setShowAddForm] = useState(false);
  // Default vehicle to van if companions > 0
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    vehicleGrade: companions > 0 ? "van" : "sedan",
  });

  // When companions changes and add form is not yet opened, update default
  useEffect(() => {
    if (!showAddForm) {
      setForm((f) => ({ ...f, vehicleGrade: companions > 0 ? "van" : "sedan" }));
    }
  }, [companions, showAddForm]);

  function computePrice(): number {
    if (form.type === "통역") {
      const dur = INTERP_DURATIONS.find((d) => d.id === form.interpDuration);
      return dur?.priceKRW ?? 0;
    }
    const grade = VEHICLE_GRADES.find((g) => g.id === form.vehicleGrade);
    return grade?.priceKRW ?? 0;
  }

  function addService() {
    const id = `svc-${Date.now()}`;
    const priceKRW = computePrice();
    onUpdateServices([...services, {
      id,
      type: form.type,
      from: form.from,
      to: form.to,
      date: form.date,
      time: form.time,
      language: form.language,
      hours: form.hours,
      vehicleGrade: form.vehicleGrade,
      flightNumber: form.flightNumber,
      interpLang: form.interpLang,
      interpDuration: form.interpDuration,
      priceKRW,
    }]);
    setForm({ ...EMPTY_FORM, vehicleGrade: companions > 0 ? "van" : "sedan" });
    setShowAddForm(false);
  }

  function removeService(id: string) {
    onUpdateServices(services.filter((s) => s.id !== id));
  }

  function serviceLabel(s: ServiceItem) {
    if (s.type === "통역") {
      const dur = INTERP_DURATIONS.find((d) => d.id === s.interpDuration);
      return `통역 · ${s.interpLang || s.language || "-"} · ${dur?.label ?? (s.hours ? s.hours + "시간" : "-")}`;
    }
    const grade = VEHICLE_GRADES.find((g) => g.id === s.vehicleGrade);
    const route = [s.from, s.to].filter(Boolean).join(" → ");
    const when = [s.date, s.time].filter(Boolean).join(" ");
    const flight = s.flightNumber ? ` · 항공편: ${s.flightNumber}` : "";
    return `${s.type} · ${grade?.name ?? ""} · ${[route, when].filter(Boolean).join(" · ") || "-"}${flight}`;
  }

  const servicesTotal = services.reduce((s, sv) => s + (sv.priceKRW ?? 0), 0);
  const selectedGrade = VEHICLE_GRADES.find((g) => g.id === form.vehicleGrade);
  const selectedInterpDur = INTERP_DURATIONS.find((d) => d.id === form.interpDuration);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          부가서비스
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          차량·통역 서비스를 추가하세요. 병원 예약 확정 후 별도 신청도 가능합니다.
        </p>
      </div>

      {/* 병원 확정 후 진행 안내 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-bold text-amber-800">ℹ️ 지금 미리 요청하거나, 병원 예약 확정 후 따로 신청할 수 있습니다</p>
        <p className="mt-1 text-xs text-amber-700 leading-relaxed">
          택시·배차·통역 서비스는 <b>병원 예약이 확정된 이후에도 별도로 신청 가능</b>합니다.
          지금 미리 추가해두시면 운영팀이 함께 조율합니다.
        </p>
        <p className="mt-1.5 text-xs text-amber-600 font-semibold">
          → 지금 선택하지 않아도 아래 '건너뛰기'로 견적 요청을 먼저 진행할 수 있습니다.
        </p>
      </div>

      {/* 부가서비스 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">🚕 부가서비스</h3>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
          >
            서비스 추가 +
          </button>
        </div>

        {/* 기존 서비스 목록 */}
        {services.length === 0 ? (
          <p className="text-sm text-gray-400 italic">추가된 서비스가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-base">
                  {s.type === "통역" ? "🗣️" : "🚕"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700">{serviceLabel(s)}</span>
                  {s.priceKRW ? (
                    <span className="ml-2 text-xs font-bold text-primary">{formatKRW(s.priceKRW)}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeService(s.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            {/* 서비스 소계 */}
            <div className="flex items-center justify-between rounded-xl bg-primary-light/50 px-4 py-2 mt-1">
              <span className="text-xs font-semibold text-primary-dark">부가서비스 소계</span>
              <span className="text-sm font-black text-primary">{formatKRW(servicesTotal)}</span>
            </div>
          </div>
        )}

        {/* 추가 폼 */}
        {showAddForm && (
          <div className="mt-3 rounded-2xl border-2 border-primary/20 bg-primary-light/20 p-4 flex flex-col gap-3">
            {/* 타입 선택 */}
            <div className="flex gap-2">
              {SERVICE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                    form.type === t
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {form.type !== "통역" ? (
              <>
                {/* 차량 등급 선택 */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600">차량 등급</p>
                  <div className="flex flex-col gap-2">
                    {VEHICLE_GRADES.map((g) => (
                      <button key={g.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, vehicleGrade: g.id }))}
                        className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          form.vehicleGrade === g.id
                            ? "border-primary bg-primary-light/40"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}>
                        <span className="text-2xl">{g.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{g.name}</p>
                          <p className="text-xs text-gray-500">{g.desc}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.includes.map((inc) => (
                              <span key={inc} className="text-[10px] text-gray-400">· {inc}</span>
                            ))}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-black text-primary">{formatKRW(g.priceKRW)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 항공편명 */}
                <input
                  value={form.flightNumber}
                  onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
                  placeholder="항공편명 예: KE0001 (선택)"
                  className={inp}
                />

                {/* 항공편 연동 안내 */}
                {form.flightNumber && (
                  <div className="rounded-xl border border-primary/20 bg-primary-light/30 px-3 py-2">
                    <p className="text-[11px] text-primary-dark">
                      ⚡ 항공편 연동 자동 배차 — 지연·조기 도착 시 픽업 시각 자동 조정
                    </p>
                  </div>
                )}

                {/* 출발/도착 */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <AddressInput
                    ready={mapsReady}
                    value={form.from}
                    onChange={(v) => setForm((f) => ({ ...f, from: v }))}
                    placeholder="출발지 (예: 인천국제공항)"
                  />
                  <AddressInput
                    ready={mapsReady}
                    value={form.to}
                    onChange={(v) => setForm((f) => ({ ...f, to: v }))}
                    placeholder="도착지 (예: 서울아산병원)"
                  />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inp}
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* 배차 확정 안내 */}
                <p className="text-[11px] text-gray-400">
                  배차 확정 후 기사 이름·차량번호·실시간 위치를 여정 화면에서 확인할 수 있습니다.
                </p>

                {selectedGrade && (
                  <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-2">
                    <span className="text-xs text-primary-dark font-semibold">차량 요금</span>
                    <span className="text-sm font-black text-primary">{formatKRW(selectedGrade.priceKRW)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 언어 선택 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-600">통역 언어</p>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      의료통역 인증
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTERP_LANGS.map((lang) => (
                      <button key={lang} type="button"
                        onClick={() => setForm((f) => ({ ...f, interpLang: lang, language: lang }))}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                          form.interpLang === lang
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시간 선택 */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600">통역 시간</p>
                  <div className="flex flex-col gap-2">
                    {INTERP_DURATIONS.map((dur) => (
                      <button key={dur.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, interpDuration: dur.id, hours: dur.id === "half" ? "4" : "8" }))}
                        className={`flex items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                          form.interpDuration === dur.id
                            ? "border-primary bg-primary-light/40"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}>
                        <span className="text-sm font-semibold text-gray-800">{dur.label}</span>
                        <span className="text-sm font-black text-primary">{formatKRW(dur.priceKRW)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedInterpDur && form.interpLang && (
                  <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-2">
                    <span className="text-xs text-primary-dark font-semibold">통역 요금</span>
                    <span className="text-sm font-black text-primary">{formatKRW(selectedInterpDur.priceKRW)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setForm({ ...EMPTY_FORM, vehicleGrade: companions > 0 ? "van" : "sedan" });
                }}
                className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:border-primary/40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={addService}
                className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-dark"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Prev / Next 버튼 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-primary/40"
        >
          ← 이전
        </button>
        <div className="flex items-center gap-3">
          {services.length === 0 && (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl border-2 border-gray-300 px-5 py-3 text-sm font-semibold text-gray-500 hover:border-primary/40"
            >
              건너뛰기 →
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
          >
            {services.length > 0 ? "다음 →" : "선택 완료 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
