"use client";

// 1단계: 국가 + 진료과 선택
import {
  COUNTRIES,
  DEPARTMENTS,
  LOCK_META,
  type LockType,
} from "@/lib/data";

type Props = {
  countryId: string | null;
  deptId: string | null;
  onSelectCountry: (id: string) => void;
  onSelectDept: (id: string) => void;
  onNext: () => void;
};

// 가격잠금 타입 순서대로 그룹 표시
const LOCK_ORDER: LockType[] = ["full", "range", "none"];

export default function StepCountryDept({
  countryId,
  deptId,
  onSelectCountry,
  onSelectDept,
  onNext,
}: Props) {
  const canNext = Boolean(countryId && deptId);

  return (
    <div className="flex flex-col gap-8">
      {/* 안내 문구 */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          어느 나라에서, 어떤 치료를 받으시나요?
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국가와 진료과를 선택하면, 진료과에 맞는 가격잠금 방식이 적용됩니다.
        </p>
      </div>

      {/* 국가 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">1. 국가 선택</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {COUNTRIES.map((c) => {
            const selected = c.id === countryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCountry(c.id)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary-light"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <span className="text-3xl">{c.flag}</span>
                <span>
                  <span className="block font-bold text-gray-800">{c.name}</span>
                  <span className="block text-xs text-gray-500">{c.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 진료과 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">2. 진료과 선택</h3>
        <div className="flex flex-col gap-5">
          {LOCK_ORDER.map((lock) => {
            const items = DEPARTMENTS.filter((d) => d.lockType === lock);
            return (
              <div key={lock}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${LOCK_META[lock].tone}`}
                  >
                    {LOCK_META[lock].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {items.map((d) => {
                    const selected = d.id === deptId;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onSelectDept(d.id)}
                        className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary-light"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        }`}
                      >
                        <span className="text-2xl">{d.icon}</span>
                        <span className="text-sm font-bold text-gray-800">
                          {d.name}
                        </span>
                        <span className="text-[11px] text-gray-500">{d.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 다음 버튼 */}
      <div className="flex justify-end">
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
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
