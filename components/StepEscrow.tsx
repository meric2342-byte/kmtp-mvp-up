"use client";

// 5단계: 에스크로 결제 (mock) — 실제 결제 없음
import { useState } from "react";
import {
  formatKRW,
  REFUND_POLICY,
  DEPARTMENTS,
  findRoom,
  type HospitalOption,
} from "@/lib/data";

type Props = {
  hospital: HospitalOption;
  deptIds: string[];
  treatmentTotal: number;
  slotDate: string | null;
  slotTime: string | null;
  roomId: string;
  nights: number;
  onPrev: () => void;
  onNext: () => void;
};

const ESCROW_STAGES = [
  { key: "deposit", title: "환자 예치", desc: "결제금을 KMTP 에스크로에 보관" },
  { key: "treat", title: "치료 완료 확인", desc: "치료 후 환자가 완료 확인" },
  { key: "settle", title: "병원 정산", desc: "확인 완료 시 병원에 지급" },
];

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

export default function StepEscrow({
  hospital,
  deptIds,
  treatmentTotal,
  slotDate,
  slotTime,
  roomId,
  nights,
  onPrev,
  onNext,
}: Props) {
  const [deposited, setDeposited] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const room = findRoom(roomId);
  const roomTotal = room.perNight * nights;
  const grandTotal = treatmentTotal + roomTotal;

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
        <Row label="병원" value={hospital.name} />
        <Row label="시술" value={deptIds.map(deptName).join(", ")} />
        <Row label="예약 일시" value={slotDate && slotTime ? `${slotDate} ${slotTime}` : "-"} />
        <Row label={`호텔 (${room.name} × ${nights}박)`} value={formatKRW(roomTotal)} />
        <div className="mt-2 border-t border-gray-100 pt-2 flex justify-between font-bold text-primary-dark">
          <span>시술 견적 합계</span>
          <span>{formatKRW(treatmentTotal)}</span>
        </div>
        <div className="flex justify-between text-base font-black text-primary">
          <span>총 예치 금액</span>
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
            <p className="text-sm text-primary-dark">총 예치 금액 (시술 + 호텔)</p>
            <p className="mt-1 text-3xl font-black text-primary-dark">{formatKRW(grandTotal)}</p>
            <p className="mt-2 text-xs text-primary-dark/70">치료 완료 확인 전까지 KMTP가 안전하게 보관합니다.</p>
          </div>
          <div className="px-6 py-5">
            <ul className="mb-4 flex flex-col gap-1.5 text-sm text-gray-600">
              <li>결제금은 치료 완료 확인 전까지 KMTP가 보관합니다.</li>
              <li>분쟁 발생 시 환불 보호가 적용됩니다.</li>
              <li>치료 완료 확인 시 병원에 정산됩니다.</li>
            </ul>
            <div className="mb-3 rounded-xl border border-primary/20 bg-primary-light/40 px-4 py-3">
              <p className="text-xs font-bold text-primary-dark">환불 정책 · {REFUND_POLICY.summary}</p>
              <ul className="mt-2 flex flex-col gap-1 text-[11px] text-gray-600">
                {REFUND_POLICY.lines.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-primary bg-primary-light px-6 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
          <p className="text-lg font-bold text-primary-dark">에스크로 예치 완료</p>
          <p className="text-sm text-primary-dark/80">{formatKRW(grandTotal)}이(가) 안전하게 보관되었습니다.</p>
          <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-dark">상태: 보관 중 (Held in Escrow)</span>
        </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-800">{value}</dd>
    </div>
  );
}
