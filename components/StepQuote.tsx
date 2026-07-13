"use client";

// 2단계: 가격잠금 견적 카드
// 진료과의 lockType에 따라 Full / Range / No Lock 카드를 다르게 보여줍니다.
import {
  LOCK_META,
  EXCHANGE_NOTE,
  formatKRW,
  formatFX,
  type Country,
  type Department,
  type Quote,
} from "@/lib/data";

type Props = {
  country: Country;
  dept: Department;
  quote: Quote;
  onPrev: () => void;
  onNext: () => void;
};

export default function StepQuote({
  country,
  dept,
  quote,
  onPrev,
  onNext,
}: Props) {
  const lockMeta = LOCK_META[dept.lockType];

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 선택 요약 + 잠금 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
            가격잠금 견적
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {country.flag} {country.name} · {dept.icon} {dept.name}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${lockMeta.tone}`}
        >
          {lockMeta.label}
        </span>
      </div>

      {/* 견적 카드 (타입별 분기) */}
      {quote.type === "full" && <FullCard quote={quote} />}
      {quote.type === "range" && <RangeCard quote={quote} />}
      {quote.type === "none" && <NoneCard quote={quote} />}

      {/* 환율 안내 + 표준 회복기간 */}
      <div className="flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <p>💱 {EXCHANGE_NOTE}</p>
        <p>
          🌿 표준 회복기간 <b>{dept.recoveryNights}박</b> — 다음 예약 단계에서
          회복기간에 맞는 회복스테이 객실이 함께 추천됩니다.
        </p>
      </div>

      {/* 하단 버튼 */}
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
          {quote.type === "none" ? "상담 예약하기 →" : "예약 진행하기 →"}
        </button>
      </div>
    </div>
  );
}

// ---------- Full Lock 카드 ----------
function FullCard({ quote }: { quote: Extract<Quote, { type: "full" }> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* 총액 강조 헤더 */}
      <div className="bg-primary px-6 py-5 text-white">
        <p className="text-sm opacity-90">🔒 총액 고정 — 이 금액에서 변동 없음</p>
        <p className="mt-1 text-3xl font-black">{formatKRW(quote.total)}</p>
        <p className="mt-0.5 text-sm font-semibold opacity-90">
          {formatFX(quote.total)}
        </p>
        <p className="mt-1 text-xs opacity-80">
          가격잠금 유효기간 {quote.validDays}일
        </p>
      </div>
      {/* 세부 항목 */}
      <div className="px-6 py-4">
        <ul className="divide-y divide-gray-100">
          {quote.items.map((it) => (
            <li
              key={it.label}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="text-gray-600">{it.label}</span>
              <span className="font-semibold text-gray-800">
                {formatKRW(it.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t-2 border-gray-100 pt-3">
          <span className="font-bold text-gray-800">총액 (고정)</span>
          <span className="text-lg font-black text-primary">
            {formatKRW(quote.total)}
          </span>
        </div>
      </div>
      {/* 포함 사항 */}
      <div className="bg-primary-light px-6 py-4">
        <p className="mb-2 text-xs font-bold text-primary-dark">포함 사항</p>
        <ul className="flex flex-wrap gap-2">
          {quote.includes.map((inc) => (
            <li
              key={inc}
              className="rounded-full bg-white px-3 py-1 text-xs text-primary-dark"
            >
              ✓ {inc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Range Lock 카드 ----------
function RangeCard({ quote }: { quote: Extract<Quote, { type: "range" }> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* 범위 강조 헤더 */}
      <div className="bg-primary-dark px-6 py-5 text-white">
        <p className="text-sm opacity-90">📊 범위 보장 — 아래 범위를 벗어나지 않음</p>
        <p className="mt-1 text-2xl font-black sm:text-3xl">
          {formatKRW(quote.min)}{" "}
          <span className="text-lg font-normal opacity-70">~</span>{" "}
          {formatKRW(quote.max)}
        </p>
        <p className="mt-0.5 text-sm font-semibold opacity-90">
          {formatFX(quote.min)} ~ {formatFX(quote.max)}
        </p>
        <p className="mt-1 text-xs opacity-80">{quote.base}</p>
      </div>

      {/* 범위 바 (시각화) */}
      <div className="px-6 pt-5">
        <div className="relative h-3 w-full rounded-full bg-gray-100">
          <div className="absolute inset-y-0 left-[12%] right-[12%] rounded-full bg-gradient-to-r from-primary-light to-primary" />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-gray-500">
          <span>최소 {formatKRW(quote.min)}</span>
          <span>최대 {formatKRW(quote.max)}</span>
        </div>
      </div>

      {/* 변동 룰 */}
      <div className="px-6 py-5">
        <p className="mb-3 text-sm font-bold text-gray-700">
          가격 변동 룰 (무엇이 가격을 바꾸나요?)
        </p>
        <ul className="flex flex-col gap-2">
          {quote.rules.map((r) => (
            <li
              key={r.factor}
              className="flex gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-primary-dark">
                {r.factor}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600">{r.effect}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-400">
          가격잠금(범위) 유효기간 {quote.validDays}일 · 최종 금액은 정밀 진단 후
          범위 내에서 확정됩니다.
        </p>
      </div>
    </div>
  );
}

// ---------- No Lock 카드 ----------
function NoneCard({ quote }: { quote: Extract<Quote, { type: "none" }> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
      <div className="bg-amber-50 px-6 py-5">
        <p className="text-sm font-bold text-amber-800">
          💬 상담 견적 — 사전 가격 잠금 불가
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
          {quote.reason}
        </p>
      </div>
      <div className="px-6 py-5">
        <p className="mb-3 text-sm font-bold text-gray-700">상담 진행 절차</p>
        <ol className="flex flex-col gap-3">
          {quote.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                {i + 1}
              </span>
              <span className="pt-0.5 text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
