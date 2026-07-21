"use client";

// 3단계: 부가서비스 (공항픽업 / 택시 / 배차 / 통역)
import { useState, useEffect } from "react";
import { formatKRW } from "@/lib/data";
import { COORDINATOR, SERVICE_CATEGORIES, findServiceCategory } from "@/lib/services";
import type { ServiceItem } from "@/lib/booking";
import AddressInput, { useGoogleMaps } from "@/components/AddressInput";

export type { ServiceItem };

// 공항픽업 옵션 (lib/services.ts의 airport-pickup 카테고리)
const AIRPORT_PICKUP_OPTIONS = SERVICE_CATEGORIES.find((c) => c.id === "airport-pickup")?.options ?? [];
// 배차(전용차량 대절) 옵션 — 4시간 15만 / 8시간 20만
const CHARTER_OPTIONS = findServiceCategory("charter")?.options ?? [];
// 택시 건당 수수료
const TAXI_COMMISSION = findServiceCategory("taxi")?.commissionKRW ?? 5000;

const INTERP_LANGS = ["영어", "러시아어", "몽골어", "중국어", "아랍어"] as const;

type Props = {
  companions: number;
  services: ServiceItem[];
  onUpdateServices: (s: ServiceItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
};

type ServiceType = "공항픽업" | "택시" | "배차" | "통역";

const SERVICE_TYPES: ServiceType[] = ["공항픽업", "택시", "배차", "통역"];

const EMPTY_FORM = {
  type: "공항픽업" as ServiceType,
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
  startTime: "",
  endTime: "",
  interpPlace: "",
  charterOption: CHARTER_OPTIONS[0]?.id ?? "charter-4h",
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
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (!showAddForm) {
      setForm((f) => ({ ...f }));
    }
  }, [companions, showAddForm]);

  function computePrice(): number {
    if (form.type === "통역") {
      return 0; // 견적제
    }
    if (form.type === "공항픽업") {
      const opt = AIRPORT_PICKUP_OPTIONS.find((o) => o.id === form.vehicleGrade);
      return opt?.priceKRW ?? 0;
    }
    if (form.type === "배차") {
      // 전용차량 대절 — 4시간 15만 / 8시간 20만 고정가
      const opt = CHARTER_OPTIONS.find((o) => o.id === form.charterOption);
      return opt?.priceKRW ?? 0;
    }
    // 택시 — 실비(미터) + 건당 수수료만 선결제
    return TAXI_COMMISSION;
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
      startTime: form.startTime,
      endTime: form.endTime,
      interpPlace: form.interpPlace,
      charterOption: form.charterOption,
      priceKRW,
    }]);
    setForm({ ...EMPTY_FORM });
    setShowAddForm(false);
  }

  function removeService(id: string) {
    onUpdateServices(services.filter((s) => s.id !== id));
  }

  function serviceLabel(s: ServiceItem) {
    if (s.type === "통역") {
      const place = s.interpPlace ? ` · ${s.interpPlace}` : "";
      const timeRange = s.startTime && s.endTime ? ` · ${s.startTime}~${s.endTime}` : "";
      return `통역 · ${s.interpLang || s.language || "-"}${timeRange}${place}`;
    }
    if (s.type === "공항픽업") {
      const opt = AIRPORT_PICKUP_OPTIONS.find((o) => o.id === s.vehicleGrade);
      const when = [s.date, s.time].filter(Boolean).join(" ");
      const flight = s.flightNumber ? ` · 항공편: ${s.flightNumber}` : "";
      return `공항픽업 · ${opt?.name ?? ""} · ${when || "-"}${flight}`;
    }
    if (s.type === "배차") {
      // 전용차량 대절 — 대절 시간·픽업 장소·픽업 시간
      const opt = CHARTER_OPTIONS.find((o) => o.id === s.charterOption);
      const when = [s.date, s.time].filter(Boolean).join(" ");
      const pickup = s.from ? `픽업: ${s.from}` : "";
      return `배차 · ${opt?.name ?? "대절"} · ${[pickup, when].filter(Boolean).join(" · ") || "-"}`;
    }
    // 택시 — 출발→도착 + 일시, 실비+수수료
    const route = [s.from, s.to].filter(Boolean).join(" → ");
    const when = [s.date, s.time].filter(Boolean).join(" ");
    return `택시 · ${[route, when].filter(Boolean).join(" · ") || "-"} · 실비+수수료`;
  }

  const servicesTotal = services.reduce((s, sv) => s + (sv.priceKRW ?? 0), 0);
  const selectedPickupOpt = AIRPORT_PICKUP_OPTIONS.find((o) => o.id === form.vehicleGrade);
  const selectedCharterOpt = CHARTER_OPTIONS.find((o) => o.id === form.charterOption);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          부가서비스
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          공항픽업·배차·통역 서비스를 추가하세요. 병원 예약 확정 후 별도 신청도 가능합니다.
        </p>
      </div>

      {/* COORDINATOR 카드 */}
      <div className="rounded-2xl border border-primary/20 bg-primary-light/30 px-5 py-4 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COORDINATOR.photo}
            alt={COORDINATOR.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-2xl absolute">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary-dark">{COORDINATOR.name}</p>
          <p className="text-xs text-gray-500">{COORDINATOR.title}</p>
          <p className="mt-1 text-xs text-gray-600">📞 {COORDINATOR.phone}</p>
          {COORDINATOR.note && (
            <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">{COORDINATOR.note}</p>
          )}
          <a
            href={`${COORDINATOR.whatsapp}?text=KMTP%20부가서비스%20문의드립니다`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition-colors"
          >
            📱 WhatsApp 문의
          </a>
        </div>
      </div>

      {/* 병원 확정 후 진행 안내 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-bold text-amber-800">ℹ️ 지금 미리 요청하거나, 병원 예약 확정 후 따로 신청할 수 있습니다</p>
        <p className="mt-1 text-xs text-amber-700 leading-relaxed">
          공항픽업·배차·통역 서비스는 <b>병원 예약이 확정된 이후에도 별도로 신청 가능</b>합니다.
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
                  {s.type === "통역" ? "🗣️" : s.type === "공항픽업" ? "✈️" : "🚕"}
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
            <div className="flex gap-2 flex-wrap">
              {SERVICE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t, vehicleGrade: "sedan" }))}
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

            {/* 공항픽업 */}
            {form.type === "공항픽업" && (
              <>
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600">차량 선택</p>
                  <div className="flex flex-col gap-2">
                    {AIRPORT_PICKUP_OPTIONS.map((opt) => (
                      <button key={opt.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, vehicleGrade: opt.id }))}
                        className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          form.vehicleGrade === opt.id
                            ? "border-primary bg-primary-light/40"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{opt.name}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                          <p className="text-[11px] text-gray-400">{opt.unit}</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-primary">
                          {opt.priceKRW ? formatKRW(opt.priceKRW) : "견적"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  value={form.flightNumber}
                  onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
                  placeholder="항공편명 예: KE0001"
                  className={inp}
                />

                {form.flightNumber && (
                  <div className="rounded-xl border border-primary/20 bg-primary-light/30 px-3 py-2">
                    <p className="text-[11px] text-primary-dark">
                      ⚡ 항공편 연동 자동 배차 — 지연·조기 도착 시 픽업 시각 자동 조정
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

                {selectedPickupOpt && (
                  <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-2">
                    <span className="text-xs text-primary-dark font-semibold">공항픽업 요금</span>
                    <span className="text-sm font-black text-primary">
                      {selectedPickupOpt.priceKRW ? formatKRW(selectedPickupOpt.priceKRW) : "견적"}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 택시 — 실비(미터) + 건당 수수료. 출발→도착 */}
            {form.type === "택시" && (
              <>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700">에스크로 결제</span>
                  <span className="text-[11px] text-blue-600">실비(미터) + KMTP 수수료 {formatKRW(TAXI_COMMISSION)} · 에스크로 내 결제 후 추후 정산</span>
                </div>

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

                <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-2">
                  <span className="text-xs text-primary-dark font-semibold">KMTP 수수료</span>
                  <span className="text-sm font-black text-primary">{formatKRW(TAXI_COMMISSION)}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  택시 배차 확정 후 기사 이름·차량번호·실시간 위치를 여정 화면에서 확인할 수 있습니다.
                </p>
              </>
            )}

            {/* 배차 (전용차량 대절) — 4h/8h 옵션 + 픽업 장소·시간 */}
            {form.type === "배차" && (
              <>
                {/* 대절 옵션 선택 */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600">대절 옵션</p>
                  <div className="flex flex-col gap-2">
                    {CHARTER_OPTIONS.map((opt) => (
                      <button key={opt.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, charterOption: opt.id }))}
                        className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          form.charterOption === opt.id
                            ? "border-primary bg-primary-light/40"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{opt.name}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                          <p className="text-[11px] text-gray-400">{opt.unit}</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-primary">
                          {opt.priceKRW ? formatKRW(opt.priceKRW) : "견적"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 픽업 장소(구글 자동완성) */}
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-600">픽업 장소</p>
                  <AddressInput
                    ready={mapsReady}
                    value={form.from}
                    onChange={(v) => setForm((f) => ({ ...f, from: v }))}
                    placeholder="픽업 장소 (예: 인천국제공항 제1터미널)"
                  />
                </div>

                {/* 날짜·픽업 시간 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600">날짜</p>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600">픽업 시간</p>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className={inp}
                    />
                  </div>
                </div>

                {selectedCharterOpt && (
                  <div className="flex items-center justify-between rounded-xl bg-primary-light px-4 py-2">
                    <span className="text-xs text-primary-dark font-semibold">배차 요금 ({selectedCharterOpt.name})</span>
                    <span className="text-sm font-black text-primary">
                      {selectedCharterOpt.priceKRW ? formatKRW(selectedCharterOpt.priceKRW) : "견적"}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-gray-400">
                  전용차량+기사 대절. 확정 후 기사 이름·차량번호·실시간 위치를 여정 화면에서 확인할 수 있습니다.
                </p>
              </>
            )}

            {/* 통역 */}
            {form.type === "통역" && (
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

                {/* 날짜 */}
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-600">날짜</p>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* 시작/종료 시간 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600">시작 시간</p>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600">종료 시간</p>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className={inp}
                    />
                  </div>
                </div>

                {/* 장소 */}
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-600">장소</p>
                  <input
                    value={form.interpPlace}
                    onChange={(e) => setForm((f) => ({ ...f, interpPlace: e.target.value }))}
                    placeholder="예: 서울아산병원 3층 외래"
                    className={inp}
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] text-amber-700">
                    통역 요금은 시간·장소 입력 후 담당 코디네이터가 견적을 안내해 드립니다.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setForm({ ...EMPTY_FORM });
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
