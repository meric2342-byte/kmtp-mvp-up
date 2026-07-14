"use client";

// 2단계: 병원 선택 + 선택 시술별 가격잠금 견적
import {
  HOSPITALS,
  DEPARTMENTS,
  formatKRW,
  hospitalTotalQuote,
  type HospitalOption,
} from "@/lib/data";

type Props = {
  deptIds: string[];
  hospitalId: string | null;
  onSelectHospital: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

export default function StepHospitalQuote({
  deptIds,
  hospitalId,
  onSelectHospital,
  onPrev,
  onNext,
}: Props) {
  // 선택 시술 중 하나라도 지원하는 병원만 표시
  const available = HOSPITALS.filter((h) =>
    deptIds.some((id) => h.treatments.find((t) => t.deptId === id)),
  );
  const selected = available.find((h) => h.id === hospitalId) ?? null;
  const canNext = Boolean(selected);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          병원 선택 · 가격잠금 견적
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          선택하신 시술을 제공하는 병원을 골라주세요. 예약 시점 가격이 잠겨 입국 후에도 그대로 청구됩니다.
        </p>
      </div>

      {/* 병원 카드 목록 */}
      <div className="flex flex-col gap-3">
        {available.map((h) => {
          const isSel = h.id === hospitalId;
          const supportedDepts = deptIds.filter((id) =>
            h.treatments.find((t) => t.deptId === id),
          );
          const unsupportedDepts = deptIds.filter(
            (id) => !h.treatments.find((t) => t.deptId === id),
          );
          const total = hospitalTotalQuote(h, deptIds);

          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectHospital(h.id)}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${
                isSel
                  ? "border-primary bg-primary-light"
                  : "border-gray-200 bg-white hover:border-primary/40"
              }`}
            >
              {/* 병원 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800">{h.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.area}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {h.badges.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-primary-dark border border-primary/20"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-primary">
                    ⭐ {h.rating}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    후기 {h.reviewCount.toLocaleString("ko-KR")}건
                  </p>
                </div>
              </div>

              {/* 시술별 견적 */}
              {isSel && (
                <div className="mt-4 border-t border-primary/20 pt-4 flex flex-col gap-3">
                  {supportedDepts.map((deptId) => {
                    const tq = h.treatments.find((t) => t.deptId === deptId)!;
                    return (
                      <div key={deptId}>
                        <p className="text-xs font-bold text-gray-600 mb-1">
                          🔒 {deptName(deptId)} — 가격잠금 견적
                        </p>
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                          {tq.items.map((it) => (
                            <div
                              key={it.label}
                              className="flex justify-between text-xs text-gray-600 py-0.5"
                            >
                              <span>{it.label}</span>
                              <span>{formatKRW(it.amount)}</span>
                            </div>
                          ))}
                          <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-1.5 text-sm font-bold text-primary-dark">
                            <span>{deptName(deptId)} 합계</span>
                            <span>{formatKRW(tq.total)}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tq.includes.map((inc) => (
                              <span
                                key={inc}
                                className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] text-primary-dark"
                              >
                                ✓ {inc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 미지원 시술 안내 */}
                  {unsupportedDepts.length > 0 && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      ⚠️ 이 병원에서 제공하지 않는 시술:{" "}
                      {unsupportedDepts.map(deptName).join(", ")}
                    </p>
                  )}

                  {/* 총 합계 */}
                  <div className="flex justify-between rounded-xl bg-primary px-4 py-3 text-white">
                    <span className="font-bold">
                      총 가격잠금 견적 ({supportedDepts.length}개 시술)
                    </span>
                    <span className="text-lg font-black">{formatKRW(total)}</span>
                  </div>
                </div>
              )}

              {/* 미선택 시 지원 시술 미리보기 */}
              {!isSel && (
                <p className="mt-2 text-xs text-gray-400">
                  제공 시술:{" "}
                  {supportedDepts.map(deptName).join(", ") || "—"}
                  {unsupportedDepts.length > 0 && (
                    <span className="text-amber-500">
                      {" "}
                      · 미지원: {unsupportedDepts.map(deptName).join(", ")}
                    </span>
                  )}
                </p>
              )}
            </button>
          );
        })}

        {available.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
            선택하신 시술을 지원하는 병원이 없습니다. 이전 단계로 돌아가 시술을 확인해주세요.
          </div>
        )}
      </div>

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
          날짜·슬롯 선택 →
        </button>
      </div>
    </div>
  );
}
