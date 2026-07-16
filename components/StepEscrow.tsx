"use client";

// 5단계: 에스크로 결제 (mock) — 실제 결제 없음
import { useState } from "react";
import {
  formatKRW,
  REFUND_POLICY,
  DEPARTMENTS,
  CASE_MANAGERS,
} from "@/lib/data";
import type { TreatmentBooking } from "@/lib/booking";
import { SLOT_DEPOSIT } from "@/lib/data";
import { findAccommodation } from "@/lib/accommodations";

// 병원 이름 조회
import { HOSPITALS } from "@/lib/data";

function hospitalName(id: string) {
  return HOSPITALS.find((h) => h.id === id)?.name ?? id;
}

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

type Props = {
  bookings: TreatmentBooking[];
  grandTotal: number;
  accommodationId: string | null;
  onPrev: () => void;
  onNext: () => void;
};

const ESCROW_STAGES = [
  { key: "deposit", title: "환자 예치", desc: "결제금을 KMTP 에스크로에 보관" },
  { key: "treat", title: "치료 완료 확인", desc: "치료 후 환자가 완료 확인" },
  { key: "settle", title: "병원 정산", desc: "확인 완료 시 병원에 지급" },
];

export default function StepEscrow({
  bookings,
  grandTotal,
  accommodationId,
  onPrev,
  onNext,
}: Props) {
  const [deposited, setDeposited] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const deposit = SLOT_DEPOSIT;
  const balance = Math.max(0, grandTotal - deposit);
  const accommodation = findAccommodation(accommodationId);

  const firstManager = CASE_MANAGERS[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          에스크로 결제
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          결제금은 병원으로 바로 가지 않고, 치료 완료를 확인할 때까지 KMTP가 안전하게 보관합니다.
        </p>
      </div>

      {/* 예약 요약 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-2 text-sm">
        <p className="font-bold text-gray-700 mb-1">예약 요약</p>
        {bookings.map((b) => (
          <div key={b.id} className="flex justify-between">
            <span className="text-gray-500">
              {deptName(b.deptId)} · {hospitalName(b.hospitalId)}
            </span>
            <span className="font-semibold text-gray-800">
              {formatKRW(b.procedurePriceKRW)}
            </span>
          </div>
        ))}
        <div className="mt-2 border-t border-gray-100 pt-2 flex justify-between text-base font-black text-primary">
          <span>총 합계</span>
          <span>{formatKRW(grandTotal)}</span>
        </div>
      </div>

      {/* 에스크로 단계 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="mb-4 text-sm font-bold text-gray-700">에스크로 진행 단계</p>
        <ol className="flex items-start justify-between gap-2">
          {ESCROW_STAGES.map((s, i) => {
            const reached = deposited && i === 0;
            return (
              <li key={s.key} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${reached ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                  {reached ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-bold ${reached ? "text-primary-dark" : "text-gray-500"}`}>{s.title}</span>
                <span className="text-[10px] leading-tight text-gray-400">{s.desc}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 결제 / 완료 */}
      {!deposited ? (
        <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-white">
          <div className="bg-primary-light px-6 py-5">
            <p className="text-sm text-primary-dark">총 합계</p>
            <p className="mt-1 text-3xl font-black text-primary-dark">{formatKRW(grandTotal)}</p>
            <p className="mt-2 text-xs text-primary-dark/70">치료 완료 확인 전까지 KMTP가 안전하게 보관합니다.</p>
          </div>
          <div className="px-6 py-5">
            {/* 2-row 결제 구조 */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">예약금</p>
                  <p className="text-xs text-gray-500">노쇼 방지 · 최종 진료비에서 차감</p>
                </div>
                <span className="text-base font-black text-primary">{formatKRW(deposit)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">잔금</p>
                  <p className="text-xs text-gray-500">에스크로 예치 · 치료 완료 후 병원 정산</p>
                </div>
                <span className="text-base font-black text-primary">{formatKRW(balance)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-bold text-primary-dark">총합계</span>
                <span className="text-base font-black text-primary">{formatKRW(grandTotal)}</span>
              </div>
            </div>

            <ul className="mb-4 flex flex-col gap-1.5 text-sm text-gray-600">
              <li>결제금은 치료 완료 확인 전까지 KMTP가 보관합니다.</li>
              <li>분쟁 발생 시 환불 보호가 적용됩니다.</li>
              <li>치료 완료 확인 시 병원에 정산됩니다.</li>
            </ul>

            {/* 환불 정책 */}
            <div className="mb-3 rounded-xl border border-primary/20 bg-primary-light/40 px-4 py-3">
              <p className="text-xs font-bold text-primary-dark">환불 정책 · {REFUND_POLICY.summary}</p>
              <ul className="mt-2 flex flex-col gap-1 text-[11px] text-gray-600">
                {REFUND_POLICY.lines.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>

            {/* 동적 환불 메시지 */}
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700 font-semibold">
                지금 취소하시면 {formatKRW(deposit)}을 100% 환불 받으실 수 있습니다
                ({REFUND_POLICY.fullRefundHours}시간 이내 취소 기준)
              </p>
            </div>

            {/* 숙소 취소 정책 */}
            {accommodation && (
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-800 mb-1">숙소 취소 정책 · {accommodation.name}</p>
                <p className="text-[11px] text-blue-700">{accommodation.cancelPolicy}</p>
              </div>
            )}

            <label className="mb-3 flex cursor-pointer items-start gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
              <span>위 환불 정책을 확인했으며, {REFUND_POLICY.fullRefundHours}시간 전 취소 시 자동 환불에 동의합니다.</span>
            </label>
            <button type="button" disabled={!agreed} onClick={() => setDeposited(true)}
              className={`w-full rounded-xl py-4 text-lg font-bold text-white transition-colors ${agreed ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"}`}>
              {formatKRW(grandTotal)} 에스크로 예치하기
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">※ 데모 화면입니다. 실제 결제는 이루어지지 않습니다.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-primary bg-primary-light px-6 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
            <p className="text-lg font-bold text-primary-dark">에스크로 예치 완료</p>
            <p className="text-sm text-primary-dark/80">{formatKRW(grandTotal)}이(가) 안전하게 보관되었습니다.</p>
            <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-dark">상태: 보관 중 (Held in Escrow)</span>
          </div>

          {/* 케이스 매니저 카드 */}
          {firstManager && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
                {firstManager.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{firstManager.name}</p>
                <p className="text-xs text-gray-500">{firstManager.languages.join(" · ")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{firstManager.slaNote}</p>
                <a
                  href={`https://wa.me/${firstManager.waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition-colors"
                >
                  💬 WhatsApp 문의
                </a>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between">
        <button type="button" onClick={onPrev} className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-primary/40">
          ← 이전
        </button>
        <button type="button" disabled={!deposited} onClick={onNext}
          className={`rounded-xl px-8 py-3 font-bold text-white transition-colors ${deposited ? "bg-primary hover:bg-primary-dark" : "cursor-not-allowed bg-gray-300"}`}>
          내 여정으로 →
        </button>
      </div>
    </div>
  );
}
