"use client";

// 환자(patient) 영역 — 기존 5단계 견적·예약·신뢰 흐름
// (뒤 작업에서 여기에 '내 여정 실시간 추적'이 추가됩니다)
import { useState } from "react";
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import PatientJourney from "@/components/PatientJourney";
import Stepper from "@/components/Stepper";
import StepCountryDept from "@/components/StepCountryDept";
import StepQuote from "@/components/StepQuote";
import StepSlot from "@/components/StepSlot";
import StepEscrow from "@/components/StepEscrow";
import StepNoSurprise from "@/components/StepNoSurprise";
import StepTrust from "@/components/StepTrust";
import {
  findCountry,
  findDepartment,
  findQuote,
  RECOMMENDED_HOSPITAL,
} from "@/lib/data";

type Props = {
  account: Account;
  onLogout: () => void;
};

type Tab = "journey" | "booking";

export default function PatientApp({ account, onLogout }: Props) {
  // 상단 탭: 내 여정 / 견적·예약·신뢰 (처음엔 견적·예약부터)
  const [tab, setTab] = useState<Tab>("booking");
  // 현재 단계 (1~5)
  const [step, setStep] = useState(1);
  // 사용자 선택 값
  const [countryId, setCountryId] = useState<string | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  // 회복스테이 객실 (기본: 스탠다드)
  const [roomId, setRoomId] = useState<string>("standard");

  const country = findCountry(countryId);
  const dept = findDepartment(deptId);
  const quote = findQuote(deptId);

  // 처음부터 다시 시작: 모든 선택 초기화
  const handleRestart = () => {
    setCountryId(null);
    setDeptId(null);
    setSlotDate(null);
    setSlotTime(null);
    setRoomId("standard");
    setStep(1);
  };

  return (
    <div className="min-h-full">
      <TopBar
        account={account}
        onLogout={onLogout}
        right={
          (country || dept) && (
            <div className="text-right text-xs text-gray-500">
              {country?.name}
              {country && dept ? " · " : ""}
              {dept?.name}
            </div>
          )
        }
      />

      {/* 본문 */}
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* 탭: 내 여정 / 견적·예약·신뢰 */}
        <div className="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1">
          {(
            [
              { key: "journey", label: "내 여정" },
              { key: "booking", label: "견적·예약·신뢰" },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === t.key
                  ? "bg-white text-primary-dark shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내 여정 탭 */}
        {tab === "journey" && <PatientJourney account={account} />}

        {/* 견적·예약·신뢰 탭 (기존 5단계 흐름) */}
        {tab === "booking" && (
          <>
            {/* 진행 표시줄 */}
            <div className="mb-10">
              <Stepper current={step} />
            </div>

            {/* 단계별 화면 */}
            {step === 1 && (
          <StepCountryDept
            countryId={countryId}
            deptId={deptId}
            onSelectCountry={setCountryId}
            onSelectDept={setDeptId}
            onNext={() => setStep(2)}
          />
        )}

        {/* 2단계: 가격잠금 견적 */}
        {step === 2 && country && dept && quote && (
          <StepQuote
            country={country}
            dept={dept}
            quote={quote}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* 3단계: 예약 슬롯 선택 */}
        {step === 3 && country && dept && (
          <StepSlot
            country={country}
            dept={dept}
            slotDate={slotDate}
            slotTime={slotTime}
            onSelectDate={(d) => {
              setSlotDate(d);
              setSlotTime(null); // 날짜 바꾸면 시간 초기화
            }}
            onSelectTime={setSlotTime}
            roomId={roomId}
            onSelectRoom={setRoomId}
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* 4단계: 에스크로 결제 */}
        {step === 4 && country && dept && quote && (
          <StepEscrow
            country={country}
            dept={dept}
            quote={quote}
            slotDate={slotDate}
            slotTime={slotTime}
            hospitalName={RECOMMENDED_HOSPITAL.name}
            onPrev={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

            {/* 5단계: No-Surprise 증명 */}
            {step === 5 && country && dept && quote && (
              <StepNoSurprise
                country={country}
                dept={dept}
                quote={quote}
                roomId={roomId}
                onPrev={() => setStep(4)}
                onNext={() => setStep(6)}
              />
            )}

            {/* 6단계: 신뢰 점수 + 검증 후기 */}
            {step === 6 && country && dept && (
              <StepTrust
                country={country}
                dept={dept}
                onPrev={() => setStep(5)}
                onRestart={handleRestart}
                onGoJourney={() => setTab("journey")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
