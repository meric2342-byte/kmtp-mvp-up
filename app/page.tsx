"use client";

// KMTP MVP — 단계별 진행(wizard) 메인 페이지
// 모든 선택 상태를 이곳에서 관리하고, 단계에 맞는 화면을 보여줍니다.
import { useState } from "react";
import Stepper from "@/components/Stepper";
import StepCountryDept from "@/components/StepCountryDept";
import StepQuote from "@/components/StepQuote";
import StepSlot from "@/components/StepSlot";
import StepEscrow from "@/components/StepEscrow";
import StepTrust from "@/components/StepTrust";
import {
  findCountry,
  findDepartment,
  findQuote,
  RECOMMENDED_HOSPITAL,
} from "@/lib/data";

export default function Home() {
  // 현재 단계 (1~5)
  const [step, setStep] = useState(1);
  // 사용자 선택 값
  const [countryId, setCountryId] = useState<string | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);

  const country = findCountry(countryId);
  const dept = findDepartment(deptId);
  const quote = findQuote(deptId);

  // 처음부터 다시 시작: 모든 선택 초기화
  const handleRestart = () => {
    setCountryId(null);
    setDeptId(null);
    setSlotDate(null);
    setSlotTime(null);
    setStep(1);
  };

  return (
    <div className="min-h-full">
      {/* 상단 헤더 */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
              K
            </span>
            <span className="text-lg font-black tracking-tight text-primary-dark">
              KMTP
            </span>
            <span className="hidden text-xs text-gray-400 sm:inline">
              한국 의료관광 신뢰 플랫폼
            </span>
          </div>
          {/* 현재 선택 요약 (선택 시 표시) */}
          {(country || dept) && (
            <div className="text-right text-xs text-gray-500">
              {country?.name}
              {country && dept ? " · " : ""}
              {dept?.name}
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-3xl px-5 py-8">
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

        {/* 5단계: 신뢰 점수 + 검증 후기 */}
        {step === 5 && country && dept && (
          <StepTrust
            country={country}
            dept={dept}
            onPrev={() => setStep(4)}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
