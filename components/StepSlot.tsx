"use client";

// 3단계: 날짜·슬롯 선택
import {
  SCHEDULE,
  RECOMMENDED_HOSPITAL,
  type HospitalOption,
} from "@/lib/data";

type Props = {
  hospital: HospitalOption | null;
  slotDate: string | null;
  slotTime: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function StepSlot({
  hospital,
  slotDate,
  slotTime,
  onSelectDate,
  onSelectTime,
  onPrev,
  onNext,
}: Props) {
  const h = hospital ?? { name: RECOMMENDED_HOSPITAL.name, area: RECOMMENDED_HOSPITAL.area, rating: RECOMMENDED_HOSPITAL.rating, reviewCount: RECOMMENDED_HOSPITAL.reviewCount, badges: RECOMMENDED_HOSPITAL.badges };
  const selectedDay = SCHEDULE.find((d) => d.date === slotDate) ?? null;
  const canNext = Boolean(slotDate && slotTime);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          예약 날짜·시간 선택
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          원하는 진료 날짜와 시간을 골라주세요.
        </p>
      </div>

      {/* 선택 병원 */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-2xl">
          🏥
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 text-sm">{h.name}</p>
          <p className="text-xs text-gray-500">{h.area}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-primary">⭐ {h.rating}</p>
          <p className="text-[11px] text-gray-400">후기 {h.reviewCount.toLocaleString("ko-KR")}건</p>
        </div>
      </div>

      {/* 날짜 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">1. 날짜</h3>
        <div className="grid grid-cols-5 gap-2">
          {SCHEDULE.map((d) => {
            const openCount = d.slots.filter((s) => s.available).length;
            const selected = d.date === slotDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDate(d.date)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-3 transition-all ${
                  selected
                    ? "border-primary bg-primary-light"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <span className="text-[11px] text-gray-400">{d.weekday}</span>
                <span className="text-sm font-bold text-gray-800">{d.date}</span>
                <span className="text-[10px] text-primary">{openCount}자리</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 시간 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">2. 시간</h3>
        {!selectedDay ? (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            먼저 날짜를 선택해 주세요.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {selectedDay.slots.map((s) => {
              const selected = s.time === slotTime;
              if (!s.available) {
                return (
                  <span
                    key={s.time}
                    className="flex cursor-not-allowed flex-col items-center rounded-xl border-2 border-gray-100 bg-gray-50 py-3 text-gray-300"
                  >
                    <span className="text-sm font-bold line-through">{s.time}</span>
                    <span className="text-[10px]">마감</span>
                  </span>
                );
              }
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => onSelectTime(s.time)}
                  className={`flex flex-col items-center rounded-xl border-2 py-3 transition-all ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-primary/40"
                  }`}
                >
                  <span className="text-sm font-bold">{s.time}</span>
                  <span className={`text-[10px] ${selected ? "text-white/80" : "text-primary"}`}>
                    예약가능
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {canNext && (
        <div className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary-dark">
          선택: <b>{slotDate}</b> <b>{slotTime}</b> · {h.name}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-primary/40"
        >
          ← 이전
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className={`rounded-xl px-8 py-3 font-bold text-white transition-colors ${
            canNext ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"
          }`}
        >
          호텔·부가서비스 →
        </button>
      </div>
    </div>
  );
}
