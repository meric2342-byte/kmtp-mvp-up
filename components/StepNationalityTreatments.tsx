"use client";

// 1단계: 국적 선택 + 시술 다중선택
import { DEPARTMENTS } from "@/lib/data";
import NationalityPicker from "@/components/NationalityPicker";

type Props = {
  nationality: string;
  deptIds: string[];
  onSelectNationality: (v: string) => void;
  onToggleDept: (id: string) => void;
  onNext: () => void;
};

export default function StepNationalityTreatments({
  nationality,
  deptIds,
  onSelectNationality,
  onToggleDept,
  onNext,
}: Props) {
  const canNext = deptIds.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          국적 및 시술 선택
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          국적을 선택하고, 받고 싶은 시술을 하나 이상 골라주세요.
        </p>
      </div>

      {/* 국적 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">1. 국적</h3>
        <NationalityPicker
          nationality={nationality}
          onSelectNationality={onSelectNationality}
        />
      </section>

      {/* 시술 다중선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          2. 시술 선택{" "}
          <span className="font-normal text-gray-400">(복수 선택 가능)</span>
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEPARTMENTS.map((d) => {
            const sel = deptIds.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onToggleDept(d.id)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  sel
                    ? "border-primary bg-primary-light"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <span className="text-2xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{d.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{d.desc}</p>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black transition-colors ${
                    sel
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
        {deptIds.length > 0 && (
          <p className="mt-2 text-xs text-primary-dark font-semibold">
            선택됨: {deptIds.length}개 시술
          </p>
        )}
      </section>

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
          병원·견적 선택 →
        </button>
      </div>
    </div>
  );
}
