"use client";

// No-Surprise 증명 — "예약 때 잠근 가격 = 입국 후 청구 가격" 일치를 눈으로 증명
// 데모이므로 항상 일치합니다.
import {
  findRoom,
  formatKRW,
  type Country,
  type Department,
  type Quote,
} from "@/lib/data";

type Props = {
  country: Country;
  dept: Department;
  quote: Quote;
  roomId: string;
  onPrev: () => void;
  onNext: () => void;
};

type Line = { label: string; amount: number };

// 잠근 견적의 라인 항목 구성 (회복스테이 포함)
function buildLines(quote: Quote, dept: Department, roomId: string): Line[] {
  const room = findRoom(roomId);
  const stayLine: Line = {
    label: `회복스테이 (${room.name} ${dept.recoveryNights}박)`,
    amount: room.perNight * dept.recoveryNights,
  };
  if (quote.type === "full") {
    return [...quote.items, stayLine];
  }
  if (quote.type === "range") {
    return [
      { label: `${dept.name} 시술 (범위 하한 기준)`, amount: quote.min },
      stayLine,
    ];
  }
  return [stayLine];
}

export default function StepNoSurprise({
  country,
  dept,
  quote,
  roomId,
  onPrev,
  onNext,
}: Props) {
  const lines = buildLines(quote, dept, roomId);
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const isNone = quote.type === "none";

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          No-Surprise 증명
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {country.flag} {country.name} · {dept.icon} {dept.name} — 예약 때 잠근
          가격과 입국 후 실제 청구서를 나란히 비교합니다.
        </p>
      </div>

      {isNone ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <p className="text-base font-bold text-amber-800">
            상담 견적 진료과 — 사전 가격 잠금 대상이 아닙니다
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            정밀 진단 후 단계별로 견적이 확정되며, 확정된 금액은 사전 합의 없이
            바뀌지 않습니다.
          </p>
        </div>
      ) : (
        <>
          {/* 좌우 비교 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BillCard
              title="예약 시점에 잠근 견적"
              badge="🔒 가격잠금"
              lines={lines}
              total={total}
              tone="light"
            />
            <BillCard
              title="입국 후 실제 청구서"
              badge="🧾 실제 청구"
              lines={lines}
              total={total}
              tone="white"
            />
          </div>

          {/* 일치 강조 */}
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-primary px-6 py-6 text-center text-white">
            <span className="text-3xl">✓</span>
            <p className="text-xl font-black">가격 일치 — 추가 청구 없음</p>
            <p className="text-sm opacity-90">
              예약 시점 {formatKRW(total)} = 입국 후 청구 {formatKRW(total)}
            </p>
          </div>

          {/* 환율 / 범위 룰 안내 */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
            <p>💱 환율 변동은 ±3% 이내에서 자동 흡수됩니다.</p>
            {quote.type === "range" && (
              <p className="mt-1">
                📊 Range Lock은 사전에 합의된 변동 룰에 따라 범위 내에서만
                조정됩니다.
              </p>
            )}
          </div>
        </>
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
          onClick={onNext}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
        >
          신뢰·후기 보기 →
        </button>
      </div>
    </div>
  );
}

function BillCard({
  title,
  badge,
  lines,
  total,
  tone,
}: {
  title: string;
  badge: string;
  lines: Line[];
  total: number;
  tone: "light" | "white";
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        tone === "light" ? "border-primary/30 bg-primary-light" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm font-bold text-gray-800">{title}</span>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
          {badge}
        </span>
      </div>
      <div className="bg-white px-5 py-4">
        <ul className="divide-y divide-gray-100">
          {lines.map((l) => (
            <li
              key={l.label}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="text-gray-600">{l.label}</span>
              <span className="font-semibold text-gray-800">
                {formatKRW(l.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t-2 border-gray-100 pt-2">
          <span className="font-bold text-gray-800">합계</span>
          <span className="text-lg font-black text-primary">
            {formatKRW(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
