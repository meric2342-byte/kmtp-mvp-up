"use client";

// 환자(patient) 영역 — 5단계: 시술·일정 → 호텔·서비스 → 견적요청 → 에스크로 → 신뢰
import { useState } from "react";
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import PatientJourney from "@/components/PatientJourney";
import KakaoChat from "@/components/KakaoChat";
import Stepper from "@/components/Stepper";
import StepSelectHospital from "@/components/StepSelectHospital";
import StepHotelServices from "@/components/StepHotelServices";
import StepQuoteRequest from "@/components/StepQuoteRequest";
import StepEscrow from "@/components/StepEscrow";
import StepTrust from "@/components/StepTrust";
import { HOSPITALS, findHotel, findHotelRoom } from "@/lib/data";
import type { TreatmentBooking, ServiceItem } from "@/lib/booking";

type Props = {
  account: Account;
  onLogout: () => void;
};

type Tab = "journey" | "booking" | "messages";

export default function PatientApp({ account, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("booking");
  const [step, setStep] = useState(1);

  // Step 1: 국적 + 병원·시술·날짜
  const [nationality, setNationality] = useState("");
  const [bookings, setBookings] = useState<TreatmentBooking[]>([]);

  // Step 2: 호텔 + 서비스
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [hotelRoomId, setHotelRoomId] = useState("standard");
  const [nights, setNights] = useState(3);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // 흐름 제어
  const [flowPending, setFlowPending] = useState(false);

  // 총 시술 금액 계산
  const treatmentTotal = bookings.reduce((sum, b) => {
    const hospital = HOSPITALS.find((h) => h.id === b.hospitalId);
    const t = hospital?.treatments.find((tr) => tr.deptId === b.deptId);
    return sum + (t?.total ?? 0);
  }, 0);

  // 호텔 합계 계산
  const selectedHotel = findHotel(hotelId);
  const selectedRoom = selectedHotel ? findHotelRoom(selectedHotel, hotelRoomId) : null;
  const hotelTotal = selectedRoom ? selectedRoom.perNight * nights : 0;

  function handleRestart() {
    setNationality("");
    setBookings([]);
    setHotelId(null);
    setHotelRoomId("standard");
    setNights(3);
    setServices([]);
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
          nationality || bookings.length > 0 ? (
            <div className="text-right text-xs text-gray-500">
              {nationality && <span>{nationality}</span>}
              {nationality && bookings.length > 0 && " · "}
              {bookings.length > 0 && <span>{bookings.length}개 시술</span>}
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
              setStep(5);
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

            {/* 1단계: 시술·일정 선택 */}
            {step === 1 && (
              <StepSelectHospital
                nationality={nationality}
                onSelectNationality={setNationality}
                bookings={bookings}
                onUpdateBookings={setBookings}
                onNext={() => setStep(2)}
              />
            )}

            {/* 2단계: 호텔 + 부가서비스 */}
            {step === 2 && (
              <StepHotelServices
                account={account}
                hotelId={hotelId}
                hotelRoomId={hotelRoomId}
                nights={nights}
                services={services}
                onSelectHotel={setHotelId}
                onSelectRoom={setHotelRoomId}
                onChangeNights={setNights}
                onUpdateServices={setServices}
                onPrev={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {/* 3단계: 견적 요청 */}
            {step === 3 && (
              <StepQuoteRequest
                account={account}
                nationality={nationality}
                bookings={bookings}
                hotelId={hotelId}
                hotelRoomId={hotelRoomId}
                nights={nights}
                services={services}
                onPrev={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {/* 4단계: 에스크로 결제 */}
            {step === 4 && (
              <StepEscrow
                bookings={bookings}
                totalAmount={treatmentTotal}
                hotelId={hotelId}
                hotelRoomId={hotelRoomId}
                nights={nights}
                hotelTotal={hotelTotal}
                onPrev={() => setStep(3)}
                onNext={() => {
                  setStep(5);
                  setTab("journey");
                  setFlowPending(true);
                }}
              />
            )}

            {/* 5단계: 신뢰·후기 */}
            {step === 5 && (
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
