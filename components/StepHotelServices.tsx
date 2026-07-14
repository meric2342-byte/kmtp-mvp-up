"use client";

// 4단계: 호텔(룸·박수) + 부가서비스(택시/배차/통역) 통합
// 선택 결과는 b2b /service-requests 로 전송 후 다음 단계로 진행
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { B2B_API_BASE } from "@/lib/api";
import { RECOVERY_ROOMS, formatKRW, findRoom } from "@/lib/data";
import { loadProfile, fullName } from "@/lib/profile";

type Props = {
  account: Account;
  roomId: string;
  nights: number;
  onSelectRoom: (id: string) => void;
  onChangeNights: (n: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function StepHotelServices({
  account,
  roomId,
  nights,
  onSelectRoom,
  onChangeNights,
  onPrev,
  onNext,
}: Props) {
  const room = findRoom(roomId);
  const roomTotal = room.perNight * nights;

  // 부가서비스 상태
  const [taxiOn, setTaxiOn] = useState(false);
  const [taxiType, setTaxiType] = useState("택시");
  const [taxiFrom, setTaxiFrom] = useState("");
  const [taxiTo, setTaxiTo] = useState("");
  const [taxiDate, setTaxiDate] = useState("");
  const [taxiTime, setTaxiTime] = useState("");

  const [interpOn, setInterpOn] = useState(false);
  const [lang, setLang] = useState("");
  const [interpHours, setInterpHours] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    // 선택한 부가서비스 → b2b 전송 (호텔은 에스크로 단계에서 함께 처리)
    const items: { service_type: string; details: string }[] = [];
    if (taxiOn) {
      const when = [taxiDate, taxiTime].filter(Boolean).join(" ");
      const route = [taxiFrom, taxiTo].filter(Boolean).join(" → ");
      items.push({
        service_type: taxiType,
        details: [route, when].filter(Boolean).join(" · ") || `${taxiType} 요청`,
      });
    }
    if (interpOn && lang) {
      items.push({
        service_type: "통역",
        details: [lang, interpHours && `${interpHours}시간`]
          .filter(Boolean)
          .join(" · "),
      });
    }

    if (items.length > 0) {
      setSubmitting(true);
      const profile = loadProfile();
      const patientName = fullName(profile) || account.name || "환자";
      try {
        await fetch(`${B2B_API_BASE}/service-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_name: patientName,
            nationality: profile.nationality || undefined,
            items,
          }),
        });
      } catch {
        // 전송 실패는 무시하고 진행
      } finally {
        setSubmitting(false);
      }
    }
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          호텔 · 부가서비스
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          숙박 룸 타입과 박수를 선택하고, 필요한 부가서비스를 추가해주세요.
        </p>
      </div>

      {/* 호텔 룸 선택 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">🏨 호텔 (숙박)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RECOVERY_ROOMS.map((r) => {
            const sel = r.id === roomId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRoom(r.id)}
                className={`flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all ${
                  sel
                    ? "border-primary bg-primary-light"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <span className="text-sm font-bold text-gray-800">{r.name}</span>
                <span className="text-[11px] text-gray-500">{r.desc}</span>
                <span className="mt-1 text-sm font-black text-primary">
                  {formatKRW(r.perNight)}<span className="text-xs font-normal">/박</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 숙박 일수 */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-gray-600">숙박 일수</span>
          <button
            type="button"
            onClick={() => onChangeNights(Math.max(1, nights - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 text-lg font-bold hover:border-primary/40"
          >
            −
          </button>
          <span className="w-6 text-center font-bold text-gray-800">{nights}</span>
          <button
            type="button"
            onClick={() => onChangeNights(nights + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 text-lg font-bold hover:border-primary/40"
          >
            +
          </button>
          <span className="text-sm text-gray-500">박</span>
          <span className="ml-auto font-bold text-primary-dark">
            합계 {formatKRW(roomTotal)}
          </span>
        </div>
      </section>

      {/* 택시·배차 */}
      <section>
        <button
          type="button"
          onClick={() => setTaxiOn((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            taxiOn ? "border-primary/50 bg-white" : "border-gray-200 bg-white hover:border-primary/30"
          }`}
        >
          <span className="text-2xl">🚕</span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">택시 · 배차</p>
            <p className="text-[11px] text-gray-500">공항픽업·병원 이동 차량 (날짜·시간 지정)</p>
          </div>
          <CheckBox on={taxiOn} />
        </button>

        {taxiOn && (
          <div className="mt-2 rounded-xl border border-primary/20 bg-primary-light/30 p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              {["택시", "배차"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaxiType(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                    taxiType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={taxiFrom}
                onChange={(e) => setTaxiFrom(e.target.value)}
                placeholder="출발지 (예: 인천국제공항)"
                className={inp}
              />
              <input
                value={taxiTo}
                onChange={(e) => setTaxiTo(e.target.value)}
                placeholder="도착지 (예: 서울대학교병원)"
                className={inp}
              />
              <input
                type="date"
                value={taxiDate}
                onChange={(e) => setTaxiDate(e.target.value)}
                className={inp}
              />
              <input
                type="time"
                value={taxiTime}
                onChange={(e) => setTaxiTime(e.target.value)}
                className={inp}
              />
            </div>
          </div>
        )}
      </section>

      {/* 통역 */}
      <section>
        <button
          type="button"
          onClick={() => setInterpOn((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            interpOn ? "border-primary/50 bg-white" : "border-gray-200 bg-white hover:border-primary/30"
          }`}
        >
          <span className="text-2xl">🗣</span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">통역</p>
            <p className="text-[11px] text-gray-500">진료·상담 동행 통역 서비스</p>
          </div>
          <CheckBox on={interpOn} />
        </button>

        {interpOn && (
          <div className="mt-2 rounded-xl border border-primary/20 bg-primary-light/30 p-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              placeholder="언어 (예: 베트남어, 중국어)"
              className={inp}
            />
            <input
              type="number"
              min={1}
              step={0.5}
              value={interpHours}
              onChange={(e) => setInterpHours(e.target.value)}
              placeholder="예상 시간 (시간)"
              className={inp}
            />
          </div>
        )}
      </section>

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
          onClick={handleNext}
          disabled={submitting}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300"
        >
          {submitting ? "전송 중…" : "에스크로 결제 →"}
        </button>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black transition-colors ${
        on ? "border-primary bg-primary text-white" : "border-gray-300 text-transparent"
      }`}
    >
      ✓
    </span>
  );
}
