"use client";

import {
  ACCOMMODATIONS,
  stayTotal,
  findAccommodation,
  type Accommodation,
  type RoomTier,
} from "@/lib/accommodations";
import { formatKRW } from "@/lib/data";

// Range-type deptIds for recommendation logic
const RANGE_DEPT_IDS = [
  "thyroid",
  "cancer",
  "cardio",
  "spine",
  "joint",
  "neuro",
  "rehab",
  "transplant",
  "emergency",
];

type Props = {
  companions: number;
  selectedProcedureIds: string[];
  accommodationId: string | null;
  accommodationRoomId: string;
  nights: number;
  onSelectAccommodation: (id: string) => void;
  onSelectRoom: (id: string) => void;
  onChangeNights: (n: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

function hasRangeProcedure(selectedProcedureIds: string[]): boolean {
  // A procedure id contains the deptId as prefix (e.g. "thyroid-total")
  return selectedProcedureIds.some((pid) =>
    RANGE_DEPT_IDS.some((deptId) => pid.startsWith(deptId + "-") || pid === deptId)
  );
}

function getRecommendationBadge(
  accommodation: Accommodation,
  selectedProcedureIds: string[]
): string | null {
  const hasRange = hasRangeProcedure(selectedProcedureIds);
  if (accommodation.kind === "residence" && hasRange) {
    return "🏥 중증·수술 회복 추천";
  }
  if (accommodation.kind === "hotel" && !hasRange) {
    return "✓ 단기 체류 적합";
  }
  return null;
}

export default function StepStay({
  companions,
  selectedProcedureIds,
  accommodationId,
  accommodationRoomId,
  nights,
  onSelectAccommodation,
  onSelectRoom,
  onChangeNights,
  onPrev,
  onNext,
}: Props) {
  const selectedAccommodation = findAccommodation(accommodationId);
  const minCapacity = companions > 0 ? 2 : 1;

  // Find the currently selected room for total calc
  let selectedRoom: RoomTier | null = null;
  if (selectedAccommodation) {
    selectedRoom =
      selectedAccommodation.rooms.find((r) => r.id === accommodationRoomId) ?? null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">숙소 선택</h2>
        <p className="text-sm text-gray-500 mt-1">
          체류 기간 동안 머물 숙소를 선택하세요. 병원 인근 협력 숙소입니다.
        </p>
      </div>

      {/* Notice banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        ※ 숙박은 병원 예약 확정 후 따로 신청할 수도 있습니다. 지금 미리 선택하거나 건너뛰기를 눌러 나중에 진행하세요.
      </div>

      {/* Accommodation cards */}
      {ACCOMMODATIONS.map((acc) => {
        const isSelected = accommodationId === acc.id;
        const recBadge = getRecommendationBadge(acc, selectedProcedureIds);

        return (
          <div
            key={acc.id}
            className={`rounded-2xl border-2 transition-colors ${
              isSelected
                ? "border-primary bg-primary-light/30"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Card header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => onSelectAccommodation(acc.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{acc.name}</h3>
                    {recBadge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-white">
                        {recBadge}
                      </span>
                    )}
                  </div>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2">
                    {acc.badge}
                  </span>
                  <p className="text-sm text-gray-600">{acc.summary}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${
                    isSelected ? "border-primary bg-primary" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg viewBox="0 0 20 20" fill="white" className="w-full h-full">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {acc.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary-dark"
                  >
                    {a}
                  </span>
                ))}
              </div>

              {/* Map link + distance */}
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                <span>📍 {acc.hospitalDistance}</span>
                <a
                  href={acc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  지도 보기
                </a>
              </div>

              {/* Cancel policy */}
              <p className="mt-2 text-xs text-gray-400">{acc.cancelPolicy}</p>
            </div>

            {/* Room selection (visible when this card is selected or always) */}
            <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                객실 선택
              </p>
              {acc.rooms.map((room) => {
                const disabled = room.capacity < minCapacity;
                const isRoomSelected =
                  isSelected && accommodationRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    disabled={disabled}
                    onClick={() => {
                      if (!isSelected) onSelectAccommodation(acc.id);
                      onSelectRoom(room.id);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      disabled
                        ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                        : isRoomSelected
                        ? "border-primary bg-primary-light/40"
                        : "border-gray-200 bg-white hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{room.name}</span>
                        {disabled && (
                          <span className="ml-2 text-xs text-red-500">(보호자 동반 불가)</span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {room.features.map((f) => (
                            <span key={f} className="text-xs text-gray-400">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-primary text-sm">
                          {formatKRW(room.priceKRW)}
                        </p>
                        <p className="text-xs text-gray-400">/ 박</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* MinNights warning */}
              {isSelected && acc.minNights > 1 && nights < acc.minNights && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  최소 {acc.minNights}박 필요
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Nights selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">숙박 일수</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChangeNights(Math.max(1, nights - 1))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            disabled={nights <= 1}
          >
            −
          </button>
          <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
            {nights}박
          </span>
          <button
            onClick={() => onChangeNights(Math.min(60, nights + 1))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            disabled={nights >= 60}
          >
            +
          </button>
        </div>
      </div>

      {/* Total */}
      {selectedRoom && (
        <div className="bg-primary-light rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-dark font-medium">숙박 예상 금액</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedRoom.name} × {nights}박
            </p>
          </div>
          <p className="text-xl font-bold text-primary">
            {formatKRW(stayTotal(selectedRoom, nights))}
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
        >
          건너뛰기 →
        </button>
        <button
          onClick={onNext}
          disabled={!accommodationId}
          className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          선택 완료 →
        </button>
      </div>
    </div>
  );
}
