"use client";

// 2단계: 호텔 선택 (아코디언) + 숙박 일수 + 부가서비스 (택시/배차/통역)
// Google Maps 자동완성: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 설정 시 활성화 (현재 텍스트 입력 fallback)
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { HOTELS, formatKRW, findHotel, findHotelRoom } from "@/lib/data";
import type { ServiceItem } from "@/lib/booking";

export type { ServiceItem };

type Props = {
  account: Account;
  hotelId: string | null;
  hotelRoomId: string;
  nights: number;
  services: ServiceItem[];
  onSelectHotel: (id: string) => void;
  onSelectRoom: (id: string) => void;
  onChangeNights: (n: number) => void;
  onUpdateServices: (s: ServiceItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
};

type ServiceType = "택시" | "배차" | "통역";

const SERVICE_TYPES: ServiceType[] = ["택시", "배차", "통역"];

const EMPTY_FORM = {
  type: "택시" as ServiceType,
  from: "",
  to: "",
  date: "",
  time: "",
  language: "",
  hours: "",
};

export default function StepHotelServices({
  hotelId,
  hotelRoomId,
  nights,
  services,
  onSelectHotel,
  onSelectRoom,
  onChangeNights,
  onUpdateServices,
  onPrev,
  onNext,
}: Props) {
  const [expandedHotel, setExpandedHotel] = useState<string | null>(hotelId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const selectedHotel = findHotel(hotelId);
  const selectedRoom = selectedHotel
    ? findHotelRoom(selectedHotel, hotelRoomId)
    : null;
  const hotelTotal = selectedRoom ? selectedRoom.perNight * nights : 0;

  function addService() {
    const id = `svc-${Date.now()}`;
    onUpdateServices([...services, { id, ...form }]);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
  }

  function removeService(id: string) {
    onUpdateServices(services.filter((s) => s.id !== id));
  }

  function serviceLabel(s: ServiceItem) {
    if (s.type === "통역") {
      return `통역 · ${s.language || "-"} · ${s.hours || "-"}시간`;
    }
    const route = [s.from, s.to].filter(Boolean).join(" → ");
    const when = [s.date, s.time].filter(Boolean).join(" ");
    return `${s.type} · ${[route, when].filter(Boolean).join(" · ") || "-"}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          호텔 · 부가서비스
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          협력 호텔을 선택하고 필요한 부가서비스를 추가해주세요.
        </p>
      </div>

      {/* 호텔 선택 (아코디언 그리드) */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">🏨 호텔 선택</h3>
        <div className="flex flex-col gap-2">
          {HOTELS.map((hotel) => {
            const isSelected = hotel.id === hotelId;
            const isExpanded = expandedHotel === hotel.id;
            return (
              <div
                key={hotel.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* 호텔 헤더 */}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedHotel(isExpanded ? null : hotel.id);
                    if (!isSelected) onSelectHotel(hotel.id);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-primary-light/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">
                        {hotel.name}
                      </span>
                      <span className="text-xs text-gray-400">{hotel.area}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-amber-500 font-semibold">
                        ★ {hotel.rating}
                      </span>
                      {isSelected && selectedRoom && (
                        <span className="text-xs text-primary font-bold">
                          {selectedRoom.name} · {formatKRW(selectedRoom.perNight)}/박
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      선택됨
                    </span>
                  )}
                  <span className="text-gray-400 text-sm shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* 룸 타입 라디오 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="mb-2 text-xs font-semibold text-gray-500">룸 타입 선택</p>
                    <div className="flex flex-col gap-2">
                      {hotel.rooms.map((room) => {
                        const roomSelected =
                          isSelected && hotelRoomId === room.id;
                        return (
                          <label
                            key={room.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                              roomSelected
                                ? "border-primary bg-primary-light"
                                : "border-gray-200 bg-white hover:border-primary/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`room-${hotel.id}`}
                              checked={roomSelected}
                              onChange={() => {
                                onSelectHotel(hotel.id);
                                onSelectRoom(room.id);
                              }}
                              className="accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-gray-800">
                                {room.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {room.desc}
                              </span>
                            </div>
                            <span className="shrink-0 text-sm font-black text-primary">
                              {formatKRW(room.perNight)}
                              <span className="text-xs font-normal text-gray-500">/박</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 숙박 일수 */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <span className="text-sm text-gray-600 flex-1">숙박 일수</span>
          <button
            type="button"
            onClick={() => onChangeNights(Math.max(1, nights - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 text-lg font-bold hover:border-primary/40"
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-gray-800">{nights}</span>
          <button
            type="button"
            onClick={() => onChangeNights(nights + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 text-lg font-bold hover:border-primary/40"
          >
            +
          </button>
          <span className="text-sm text-gray-500">박</span>
          {selectedRoom && (
            <span className="ml-auto font-bold text-primary-dark text-sm">
              호텔 합계 {formatKRW(hotelTotal)}
            </span>
          )}
        </div>
      </section>

      {/* 부가서비스 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">🚕 부가서비스</h3>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
          >
            서비스 추가 +
          </button>
        </div>

        {/* 기존 서비스 목록 */}
        {services.length === 0 ? (
          <p className="text-sm text-gray-400 italic">추가된 서비스가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-base">
                  {s.type === "통역" ? "🗣️" : "🚕"}
                </span>
                <span className="flex-1 text-sm text-gray-700">
                  {serviceLabel(s)}
                </span>
                <button
                  type="button"
                  onClick={() => removeService(s.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 추가 폼 */}
        {showAddForm && (
          <div className="mt-3 rounded-2xl border-2 border-primary/20 bg-primary-light/20 p-4 flex flex-col gap-3">
            {/* 타입 선택 */}
            <div className="flex gap-2">
              {SERVICE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                    form.type === t
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {form.type !== "통역" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={form.from}
                  onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                  placeholder="출발지 (예: 인천국제공항)"
                  className={inp}
                />
                <input
                  value={form.to}
                  onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                  placeholder="도착지 (예: 서울아산병원)"
                  className={inp}
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={inp}
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className={inp}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={form.language}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, language: e.target.value }))
                  }
                  placeholder="언어 (예: 베트남어, 중국어)"
                  className={inp}
                />
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={form.hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hours: e.target.value }))
                  }
                  placeholder="예상 시간 (시간)"
                  className={inp}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setForm(EMPTY_FORM);
                }}
                className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:border-primary/40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={addService}
                className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-dark"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Prev / Next 버튼 */}
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
          onClick={onNext}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
