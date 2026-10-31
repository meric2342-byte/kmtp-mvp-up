// 상단 6단계 진행 표시줄 (공통 컴포넌트) — 리디자인 2차 (틸 + 골드)
// current: 현재 단계 번호 (1~6)

const STEPS = [
  { n: 1, label: "시술·일정" },
  { n: 2, label: "숙소" },
  { n: 3, label: "부가서비스" },
  { n: 4, label: "견적요청" },
  { n: 5, label: "에스크로" },
  { n: 6, label: "신뢰·후기" },
];

export default function Stepper({ current }: { current: number }) {
  const total = STEPS.length;
  // 진행선 너비: 첫 원 중심 ~ 현재 원 중심
  const progress = Math.min(Math.max((current - 1) / (total - 1), 0), 1);
  const currentLabel = STEPS.find((s) => s.n === current)?.label;

  return (
    <div className="card-premium px-4 pb-3 pt-4 sm:px-6">
      {/* 모바일용 현재 단계 요약 */}
      <div className="mb-3 flex items-baseline justify-between sm:hidden">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          Step {current} / {total}
        </span>
        <span className="text-sm font-black text-primary-dark">{currentLabel}</span>
      </div>

      <ol className="relative flex w-full items-start justify-between" aria-label="예약 진행 단계">
        {/* 배경선 + 진행선 (원 중심선 기준) */}
        <span
          className="absolute top-4 h-[3px] -translate-y-1/2 rounded-full bg-gray-100"
          style={{ left: `calc(100% / ${total} / 2)`, right: `calc(100% / ${total} / 2)` }}
          aria-hidden
        />
        <span
          className="absolute top-4 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-gold transition-[width] duration-500"
          style={{
            left: `calc(100% / ${total} / 2)`,
            width: `calc((100% - 100% / ${total}) * ${progress})`,
          }}
          aria-hidden
        />

        {STEPS.map((s) => {
          const done = s.n < current;
          const active = s.n === current;
          return (
            <li
              key={s.n}
              className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_-6px_rgba(13,58,62,0.7)] ring-4 ring-gold-light outline outline-1 outline-gold/60"
                    : done
                      ? "bg-primary text-gold-light"
                      : "border border-gray-200 bg-white text-gray-400"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span
                className={`hidden text-center text-xs leading-tight sm:block ${
                  active
                    ? "font-black text-primary-dark"
                    : done
                      ? "font-semibold text-primary/80"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
