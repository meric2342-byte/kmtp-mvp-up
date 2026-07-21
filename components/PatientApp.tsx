"use client";

// 환자(patient) 영역 — 6단계: 시술·일정 → 숙소 → 부가서비스 → 견적요청 → 에스크로 → 신뢰
import { useState, useEffect } from "react";
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import PatientJourney from "@/components/PatientJourney";
import KakaoChat from "@/components/KakaoChat";
import Stepper from "@/components/Stepper";
import StepSelectHospital from "@/components/StepSelectHospital";
import StepStay from "@/components/StepStay";
import StepHotelServices from "@/components/StepHotelServices";
import StepQuoteRequest from "@/components/StepQuoteRequest";
import StepEscrow from "@/components/StepEscrow";
import StepTrust from "@/components/StepTrust";
import MyQuotes from "@/components/MyQuotes";
import { HOSPITALS, formatKRW } from "@/lib/data";
import { findAccommodation, stayTotal } from "@/lib/accommodations";
import { saveDraft, loadDraft, clearDraft, newCaseId } from "@/lib/draft";
import type { TreatmentBooking, ServiceItem } from "@/lib/booking";

type Props = {
  account: Account;
  onLogout: () => void;
};

type Tab = "journey" | "booking" | "quotes" | "messages";

const KMTP_WA = "821012345678";

export default function PatientApp({ account, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("booking");
  const [step, setStep] = useState(1);

  // Step 1: 국적 + 병원·시술·날짜
  const [nationality, setNationality] = useState("");
  const [bookings, setBookings] = useState<TreatmentBooking[]>([]);
  const [companions, setCompanions] = useState(0);

  // Step 2: 숙소
  const [accommodationId, setAccommodationId] = useState<string | null>(null);
  const [accommodationRoomId, setAccommodationRoomId] = useState("std");
  const [nights, setNights] = useState(3);

  // Step 3: 부가서비스
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Case ID
  const [caseId, setCaseId] = useState<string>(() => newCaseId());

  // 흐름 제어
  const [flowPending, setFlowPending] = useState(false);

  // Draft restore — 계정별로 저장된 draft만 복원한다.
  // account.id가 바뀌면(다른 아이디 로그인) 그 계정의 draft로 갈아끼우고,
  // 없으면 빈 상태로 초기화해 이전 계정의 시술이 섞이지 않게 한다.
  useEffect(() => {
    const d = loadDraft(account.id);
    if (d) {
      setCaseId(d.caseId);
      setCompanions(d.companions);
      setBookings(d.bookings);
      setAccommodationId(d.accommodationId);
      setAccommodationRoomId(d.accommodationRoomId);
      setNights(d.nights);
      setServices(d.services);
      setNationality(d.nationality ?? "");
      setStep(d.step > 1 ? 1 : d.step);
    } else {
      // 이 계정에 저장된 선택이 없으면 깨끗한 상태로 시작
      setCaseId(newCaseId());
      setCompanions(0);
      setBookings([]);
      setAccommodationId(null);
      setAccommodationRoomId("std");
      setNights(3);
      setServices([]);
      setNationality("");
      setStep(1);
    }
  }, [account.id]);

  // Draft save on state change
  useEffect(() => {
    if (tab === "booking" && (bookings.length > 0 || nationality)) {
      saveDraft({
        caseId,
        nationality,
        companions,
        bookings,
        accommodationId,
        accommodationRoomId,
        nights,
        services,
        step,
      }, account.id);
    }
  }, [account.id, caseId, nationality, companions, bookings, accommodationId, accommodationRoomId, nights, services, step, tab]);

  // Grand total calculation
  const treatmentTotal = bookings.reduce((s, b) => s + b.procedurePriceKRW, 0);
  const accommodation = findAccommodation(accommodationId);
  const selectedRoom = accommodation?.rooms.find((r) => r.id === accommodationRoomId) ?? null;
  const stayTotalAmount = selectedRoom ? stayTotal(selectedRoom, nights) : 0;
  const serviceTotal = services.reduce((s, sv) => s + (sv.priceKRW ?? 0), 0);
  const grandTotal = treatmentTotal + stayTotalAmount + serviceTotal;

  // WhatsApp link
  const isKorean = nationality === "대한민국" || nationality === "한국";
  const procSummary = bookings
    .slice(0, 2)
    .map((b) => `${b.procedureName}@${HOSPITALS.find((h) => h.id === b.hospitalId)?.name ?? ""}`)
    .join(", ");
  const waText = `[KMTP견적문의] 국적:${nationality || "미선택"} / 시술:${procSummary || "미선택"} / 합계:${formatKRW(grandTotal)}`;
  const waLink = isKorean
    ? "https://open.kakao.com/o/kmtp"
    : `https://wa.me/${KMTP_WA}?text=${encodeURIComponent(waText)}`;

  function handleRestart() {
    clearDraft(account.id);   // 이 계정의 저장된 선택도 함께 비운다
    setNationality("");
    setBookings([]);
    setCompanions(0);
    setAccommodationId(null);
    setAccommodationRoomId("std");
    setNights(3);
    setServices([]);
    setStep(1);
    setTab("booking");
    setFlowPending(false);
    setCaseId(newCaseId());
  }

  const selectedProcedureIds = bookings.map((b) => b.procedureId);

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
              { key: "quotes", label: "내 견적" },
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

        {/* 내 견적 탭 — case_id로 b2b 확정 결과 폴링 */}
        {tab === "quotes" && (
          <MyQuotes
            caseId={caseId}
            onGoEscrow={() => {
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
                companions={companions}
                onSelectCompanions={setCompanions}
              />
            )}

            {/* 2단계: 숙소 */}
            {step === 2 && (
              <StepStay
                companions={companions}
                selectedProcedureIds={selectedProcedureIds}
                accommodationId={accommodationId}
                accommodationRoomId={accommodationRoomId}
                nights={nights}
                onSelectAccommodation={setAccommodationId}
                onSelectRoom={setAccommodationRoomId}
                onChangeNights={setNights}
                onPrev={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {/* 3단계: 부가서비스 */}
            {step === 3 && (
              <StepHotelServices
                companions={companions}
                services={services}
                onUpdateServices={setServices}
                onPrev={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {/* 4단계: 견적 요청 */}
            {step === 4 && (
              <StepQuoteRequest
                account={account}
                nationality={nationality}
                bookings={bookings}
                hotelId={null}
                hotelRoomId=""
                nights={nights}
                services={services}
                grandTotal={grandTotal}
                companions={companions}
                caseId={caseId}
                accommodationId={accommodationId}
                onPrev={() => setStep(3)}
                onNext={() => setStep(5)}
              />
            )}

            {/* 5단계: 에스크로 결제 */}
            {step === 5 && (
              <StepEscrow
                bookings={bookings}
                grandTotal={grandTotal}
                accommodationId={accommodationId}
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

      {/* WhatsApp floating button */}
      {tab === "booking" && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-green-600 transition-colors"
        >
          <span>💬</span>
          <span className="hidden sm:inline">견적 문의</span>
        </a>
      )}
    </div>
  );
}
