"use client";

// 5단계: 신뢰 점수 + 검증 후기 (mock)
import {
  TRUST,
  REVIEWS,
  RECOMMENDED_HOSPITAL,
  type Country,
  type Department,
} from "@/lib/data";

type Props = {
  country: Country;
  dept: Department;
  onPrev: () => void;
  onRestart: () => void;
};

export default function StepTrust({
  country,
  dept,
  onPrev,
  onRestart,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          신뢰 점수 &amp; 검증 후기
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {RECOMMENDED_HOSPITAL.name} · {country.name} {dept.name} 환자 기준
        </p>
      </div>

      {/* 종합 신뢰 점수 */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row sm:gap-6">
        {/* 원형 점수 게이지 */}
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#1f6f78"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - TRUST.score / 100)}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black text-primary-dark">
              {TRUST.score}
            </span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>

        {/* 항목별 점수 바 */}
        <div className="w-full flex-1">
          <p className="mb-3 text-sm font-bold text-gray-700">
            KMTP 신뢰 점수 구성
          </p>
          <ul className="flex flex-col gap-2.5">
            {TRUST.factors.map((f) => (
              <li key={f.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">{f.label}</span>
                  <span className="font-bold text-primary">{f.score}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 검증 후기 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">검증된 후기</h3>
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
            🛡️ 에스크로 완료 환자만 작성
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REVIEWS.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {r.name}{" "}
                    <span className="font-normal text-gray-400">
                      · {r.country}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {r.dept} · {r.date}
                  </p>
                </div>
                {r.verified && (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    ✓ 검증됨
                  </span>
                )}
              </div>
              <p className="text-amber-500" aria-label={`별점 ${r.rating}점`}>
                {"★".repeat(r.rating)}
                <span className="text-gray-200">
                  {"★".repeat(5 - r.rating)}
                </span>
              </p>
              <p className="text-sm leading-relaxed text-gray-600">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 완료 메시지 */}
      <div className="rounded-2xl bg-primary-dark px-6 py-5 text-center text-white">
        <p className="text-lg font-bold">🎉 예약 완료!</p>
        <p className="mt-1 text-sm opacity-90">
          가격잠금 견적 → 예약 → 에스크로 예치까지 안전하게 마쳤습니다.
        </p>
      </div>

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
          onClick={onRestart}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
        >
          처음부터 다시 ↻
        </button>
      </div>
    </div>
  );
}
