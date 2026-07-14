// 상단 5단계 진행 표시줄 (공통 컴포넌트)
// current: 현재 단계 번호 (1~5)

const STEPS = [
  { n: 1, label: "국적·시술" },
  { n: 2, label: "병원·견적" },
  { n: 3, label: "날짜·슬롯" },
  { n: 4, label: "호텔·서비스" },
  { n: 5, label: "에스크로" },
  { n: 6, label: "신뢰·후기" },
];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex w-full items-center justify-between gap-1">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {/* 왼쪽 연결선 (첫 단계 제외) */}
              {i !== 0 && (
                <div
                  className={`h-0.5 flex-1 ${
                    s.n <= current ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
              {/* 단계 원형 번호 */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  active
                    ? "bg-primary text-white ring-4 ring-primary-light"
                    : done
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? "✓" : s.n}
              </div>
              {/* 오른쪽 연결선 (마지막 단계 제외) */}
              {i !== STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    s.n < current ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-center text-[11px] leading-tight sm:text-xs ${
                active ? "font-bold text-primary-dark" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
