"use client";

// 3단계: 예약 슬롯 선택 (mock 시간표에서 날짜 → 시간 고르기)
import {
  RECOMMENDED_HOSPITAL,
  RECOVERY_ROOMS,
  SCHEDULE,
  SLOT_DEPOSIT,
  REFUND_POLICY,
  findRoom,
  formatKRW,
  type Country,
  type Department,
} from "@/lib/data";

type Props = {
  country: Country;
  dept: Department;
  slotDate: string | null;
  slotTime: string | null;
  roomId: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onSelectRoom: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function StepSlot({
  country,
  dept,
  slotDate,
  slotTime,
  roomId,
  onSelectDate,
  onSelectTime,
  onSelectRoom,
  onPrev,
  onNext,
}: Props) {
  const h = RECOMMENDED_HOSPITAL;
  // 선택된 날짜의 슬롯들
  const selectedDay = SCHEDULE.find((d) => d.date === slotDate) ?? null;
  const canNext = Boolean(slotDate && slotTime);
  // 회복스테이: 진료과 표준 회복기간 × 선택 객실
  const nights = dept.recoveryNights;
  const room = findRoom(roomId);
  const roomTotal = room.perNight * nights;

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          예약 슬롯 선택
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {country.flag} {country.name} · {dept.icon} {dept.name} — 원하는
          날짜와 시간을 골라주세요.
        </p>
      </div>

      {/* 추천 병원 카드 */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-2xl">
          🏥
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800">{h.name}</p>
          <p className="text-xs text-gray-500">{h.area}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {h.badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary-dark"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-primary">⭐ {h.rating}</p>
          <p className="text-[11px] text-gray-400">
            후기 {h.reviewCount.toLocaleString("ko-KR")}건
          </p>
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
                <span className="text-[10px] text-primary">
                  {openCount}자리
                </span>
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
                    <span className="text-sm font-bold line-through">
                      {s.time}
                    </span>
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
                  <span
                    className={`text-[10px] ${
                      selected ? "text-white/80" : "text-primary"
                    }`}
                  >
                    예약가능
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 회복스테이 객실 자동 매칭 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            3. 호텔 (숙박)
          </h3>
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
            {nights}박 예약
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RECOVERY_ROOMS.map((r) => {
            const selected = r.id === roomId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRoom(r.id)}
                className={`flex flex-col gap-0.5 rounded-xl border-2 p-3 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary-light"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <span className="text-sm font-bold text-gray-800">{r.name}</span>
                <span className="text-[11px] text-gray-500">{r.desc}</span>
                <span className="mt-1 text-xs font-semibold text-primary">
                  {formatKRW(r.perNight)}/박
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm">
          <span className="text-gray-600">
            {room.name} × {nights}박
          </span>
          <span className="font-bold text-primary-dark">
            {formatKRW(roomTotal)}
          </span>
        </div>
      </section>

      {/* 선택 요약 */}
      {canNext && (
        <div className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary-dark">
          선택한 예약: <b>{slotDate}</b> <b>{slotTime}</b> · {h.name} / 호텔{" "}
          <b>{room.name}</b> {nights}박 ({formatKRW(roomTotal)})
        </div>
      )}

      {/* 예약금 선결제 안내 (노쇼 구조적 차단) */}
      {canNext && (
        <div className="rounded-xl border border-primary/25 bg-white px-4 py-3">
          <p className="text-sm font-bold text-primary-dark">
            예약금 {formatKRW(SLOT_DEPOSIT)}로 이 슬롯을 잠급니다
          </p>
          <p className="mt-1 text-xs text-gray-500">
            예약 시점에 예약금을 먼저 결제해 슬롯을 확정합니다(노쇼 방지).
            예약금은 최종 진료비에서 차감되며, {REFUND_POLICY.fullRefundHours}시간
            전 취소 시 100% 자동 환불됩니다.
          </p>
        </div>
      )}

      {/* 버튼 */}
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
            canNext
              ? "bg-primary hover:bg-primary-dark"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          예약금 결제로 →
        </button>
      </div>
    </div>
  );
}
