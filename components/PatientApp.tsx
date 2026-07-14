"use client";

// 환자(patient) 영역 — 6단계 국적·시술→병원·견적→날짜슬롯→호텔서비스→에스크로→신뢰
import { useState } from "react";
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import PatientJourney from "@/components/PatientJourney";
import KakaoChat from "@/components/KakaoChat";
import Stepper from "@/components/Stepper";
import StepNationalityTreatments from "@/components/StepNationalityTreatments";
import StepHospitalQuote from "@/components/StepHospitalQuote";
import StepSlot from "@/components/StepSlot";
import StepHotelServices from "@/components/StepHotelServices";
import StepEscrow from "@/components/StepEscrow";
import StepTrust from "@/components/StepTrust";
import { findHospital, hospitalTotalQuote } from "@/lib/data";

type Props = {
  account: Account;
  onLogout: () => void;
};

type Tab = "journey" | "booking" | "messages";

export default function PatientApp({ account, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("booking");
  const [step, setStep] = useState(1);

  // Step 1: 국적 + 시술 다중선택
  const [nationality, setNationality] = useState("");
  const [deptIds, setDeptIds] = useState<string[]>([]);

  // Step 2: 병원 선택
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  // Step 3: 날짜·슬롯
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);

  // Step 4: 호텔
  const [roomId, setRoomId] = useState("standard");
  const [nights, setNights] = useState(3);

  // 흐름 제어
  const [flowPending, setFlowPending] = useState(false);

  const hospital = findHospital(hospitalId);
  const treatmentTotal = hospital ? hospitalTotalQuote(hospital, deptIds) : 0;

  function toggleDept(id: string) {
    setDeptIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setHospitalId(null); // 시술 바뀌면 병원 재선택
  }

  function handleRestart() {
    setNationality("");
    setDeptIds([]);
    setHospitalId(null);
    setSlotDate(null);
    setSlotTime(null);
    setRoomId("standard");
    setNights(3);
    setStep(1);
    setTab("booking");
    setFlowPending(false);
  }

  return (
    <div className="min-h-full">
      <TopBar
        account={account}
        onLogout={onLogout}
        right={
          nationality || deptIds.length > 0 ? (
            <div className="text-right text-xs text-gray-500">
              {nationality && <span>{nationality}</span>}
              {nationality && deptIds.length > 0 && " · "}
              {deptIds.length > 0 && <span>{deptIds.length}개 시술</span>}
            </div>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* 탭 */}
        <div className="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1">
          {(
            [
              { key: "journey", label: "내 여정" },
              { key: "booking", label: "견적·예약" },
              { key: "messages", label: "💬 메시지" },
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
        {tab === "journey" && (
          <PatientJourney
            account={account}
            onContinueFlow={
              flowPending
                ? () => {
                    setFlowPending(false);
                    setTab("booking");
                  }
                : undefined
            }
            onGoTrust={() => {
              setTab("booking");
              setStep(6);
            }}
          />
        )}

        {/* 메시지 탭 */}
        {tab === "messages" && (
          <KakaoChat role="patient" patientId={account.id} allowSend />
        )}

        {/* 견적·예약 탭 */}
        {tab === "booking" && (
          <>
            <div className="mb-10">
              <Stepper current={step} />
            </div>

            {/* 1단계: 국적 + 시술 다중선택 */}
            {step === 1 && (
              <StepNationalityTreatments
                nationality={nationality}
                deptIds={deptIds}
                onSelectNationality={setNationality}
                onToggleDept={toggleDept}
                onNext={() => setStep(2)}
              />
            )}

            {/* 2단계: 병원 선택 + 가격잠금 견적 */}
            {step === 2 && (
              <StepHospitalQuote
                deptIds={deptIds}
                hospitalId={hospitalId}
                onSelectHospital={setHospitalId}
                onPrev={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {/* 3단계: 날짜·슬롯 */}
            {step === 3 && (
              <StepSlot
                hospital={hospital}
                slotDate={slotDate}
                slotTime={slotTime}
                onSelectDate={(d) => { setSlotDate(d); setSlotTime(null); }}
                onSelectTime={setSlotTime}
                onPrev={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {/* 4단계: 호텔 + 부가서비스 */}
            {step === 4 && (
              <StepHotelServices
                account={account}
                roomId={roomId}
                nights={nights}
                onSelectRoom={setRoomId}
                onChangeNights={setNights}
                onPrev={() => setStep(3)}
                onNext={() => setStep(5)}
              />
            )}

            {/* 5단계: 에스크로 결제 */}
            {step === 5 && hospital && (
              <StepEscrow
                hospital={hospital}
                deptIds={deptIds}
                treatmentTotal={treatmentTotal}
                slotDate={slotDate}
                slotTime={slotTime}
                roomId={roomId}
                nights={nights}
                onPrev={() => setStep(4)}
                onNext={() => {
                  setStep(6);
                  setTab("journey");
                  setFlowPending(true);
                }}
              />
            )}

            {/* 6단계: 신뢰·후기 */}
            {step === 6 && (
              <StepTrust
                onPrev={() => setTab("journey")}
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
