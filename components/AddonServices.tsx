"use client";

// 부가서비스 선택 — 호텔 / 택시·배차 / 통역
// 선택 결과는 b2b 운영 백엔드(에이전시 관리)의 /service-requests 로 전송된다.
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { B2B_API_BASE } from "@/lib/api";
import { loadProfile, fullName } from "@/lib/profile";
import { RECOVERY_ROOMS, formatKRW } from "@/lib/data";
import { findServiceCategory } from "@/lib/services";
import AddressInput, { useGoogleMaps } from "@/components/AddressInput";

type Props = { account: Account };

type ReqItem = { service_type: string; details: string; price_krw?: number };

// 배차(전용차량 대절) 옵션 — 4시간 15만 / 8시간 20만
const CHARTER_OPTIONS = findServiceCategory("charter")?.options ?? [];
const TAXI_COMMISSION = findServiceCategory("taxi")?.commissionKRW ?? 5000;

export default function AddonServices({ account }: Props) {
  // 호텔
  const [hotelOn, setHotelOn] = useState(false);
  const [roomId, setRoomId] = useState("standard");
  const [nights, setNights] = useState("3");

  // 택시·배차
  const mapsReady = useGoogleMaps();
  const [rideOn, setRideOn] = useState(false);
  const [rideType, setRideType] = useState("택시");
  const [rideFrom, setRideFrom] = useState("");
  const [rideTo, setRideTo] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [rideTime, setRideTime] = useState("");
  const [charterOption, setCharterOption] = useState(CHARTER_OPTIONS[0]?.id ?? "charter-4h");

  // 통역
  const [interpOn, setInterpOn] = useState(false);
  const [lang, setLang] = useState("");
  const [interpHours, setInterpHours] = useState("");

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const room = RECOVERY_ROOMS.find((r) => r.id === roomId) ?? RECOVERY_ROOMS[0];

  function buildItems(): ReqItem[] {
    const items: ReqItem[] = [];
    if (hotelOn) {
      const n = Number(nights) || 1;
      items.push({
        service_type: "호텔",
        details: `${room.name} · ${n}박 (${formatKRW(room.perNight)}/박 · 합계 ${formatKRW(room.perNight * n)})`,
      });
    }
    if (rideOn) {
      const when = [rideDate, rideTime].filter(Boolean).join(" ");
      if (rideType === "배차") {
        // 전용차량 대절 — 대절옵션 · 픽업장소 · 픽업시간, 고정가
        const opt = CHARTER_OPTIONS.find((o) => o.id === charterOption);
        const pickup = rideFrom ? `픽업: ${rideFrom}` : "";
        items.push({
          service_type: "배차",
          details: `${opt?.name ?? "대절"} · ${[pickup, when].filter(Boolean).join(" · ") || "요청"}`,
          price_krw: opt?.priceKRW ?? 0,
        });
      } else {
        // 택시 — 출발→도착 + 일시, 실비+수수료
        const route = [rideFrom, rideTo].filter(Boolean).join(" → ");
        items.push({
          service_type: "택시",
          details: [route, when].filter(Boolean).join(" · ") || "택시 요청",
          price_krw: TAXI_COMMISSION,
        });
      }
    }
    if (interpOn) {
      items.push({
        service_type: "통역",
        details: [lang && `${lang}`, interpHours && `${interpHours}시간`]
          .filter(Boolean)
          .join(" · ") || "통역 요청",
      });
    }
    return items;
  }

  async function submit() {
    const items = buildItems();
    if (items.length === 0) {
      setError("최소 한 가지 서비스를 선택해 주세요.");
      return;
    }
    setSending(true);
    setError(null);
    const profile = loadProfile();
    const patientName = fullName(profile) || account.name || "환자";
    try {
      const res = await fetch(`${B2B_API_BASE}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientName,
          nationality: profile.nationality || undefined,
          items,
        }),
      });
      if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
      setDone(true);
    } catch {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-primary bg-primary-light px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
        <p className="text-lg font-bold text-primary-dark">부가서비스 요청이 접수되었습니다</p>
        <p className="text-sm text-primary-dark/80">
          운영팀(에이전시)이 확인 후 견적·일정을 안내해 드립니다.
        </p>
        <button
          type="button"
          onClick={() => { setDone(false); setHotelOn(false); setRideOn(false); setInterpOn(false); }}
          className="mt-2 rounded-xl border-2 border-primary px-6 py-2.5 text-sm font-bold text-primary hover:bg-white"
        >
          다른 서비스 추가 요청
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">부가서비스 선택</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          여정 중 필요한 호텔·이동·통역을 선택하면 운영팀(에이전시)이 견적을 안내합니다.
        </p>
      </div>

      {/* 호텔 */}
      <ServiceCard on={hotelOn} onToggle={() => setHotelOn((v) => !v)} icon="🏨" title="호텔 (숙박)"
        summary="스탠다드 15만 · 디럭스 25만 · 스위트 40만 (1박 기준)">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RECOVERY_ROOMS.map((r) => {
            const sel = r.id === roomId;
            return (
              <button key={r.id} type="button" onClick={() => setRoomId(r.id)}
                className={`flex flex-col gap-0.5 rounded-xl border-2 p-3 text-left transition-all ${sel ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"}`}>
                <span className="text-sm font-bold text-gray-800">{r.name}</span>
                <span className="text-[11px] text-gray-500">{r.desc}</span>
                <span className="mt-1 text-xs font-semibold text-primary">{formatKRW(r.perNight)}/박</span>
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          숙박일수
          <input type="number" min={1} value={nights} onChange={(e) => setNights(e.target.value)}
            className="w-20 rounded-lg border-2 border-gray-200 px-3 py-1.5 outline-none focus:border-primary" />
          박
          <span className="ml-auto font-bold text-primary-dark">
            합계 {formatKRW(room.perNight * (Number(nights) || 0))}
          </span>
        </label>
      </ServiceCard>

      {/* 택시·배차 */}
      <ServiceCard on={rideOn} onToggle={() => setRideOn((v) => !v)} icon="🚕" title="택시 · 배차"
        summary="택시(실비+수수료) · 배차 대절 4시간 15만·8시간 20만">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {["택시", "배차"].map((t) => (
              <button key={t} type="button" onClick={() => setRideType(t)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${rideType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                {t}
              </button>
            ))}
          </div>

          {rideType === "택시" ? (
            <>
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                <span className="text-[11px] text-blue-600">실비(미터) + KMTP 수수료 {formatKRW(TAXI_COMMISSION)} · 에스크로 결제 후 추후 정산</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <AddressInput ready={mapsReady} value={rideFrom} onChange={setRideFrom} placeholder="출발지 (예: 인천공항)" className={inp} />
                <AddressInput ready={mapsReady} value={rideTo} onChange={setRideTo} placeholder="도착지 (예: 서울대병원)" className={inp} />
                <input type="date" value={rideDate} onChange={(e) => setRideDate(e.target.value)} className={inp} />
                <input type="time" value={rideTime} onChange={(e) => setRideTime(e.target.value)} className={inp} />
              </div>
            </>
          ) : (
            <>
              {/* 대절 옵션 4h/8h */}
              <div className="flex flex-col gap-2">
                {CHARTER_OPTIONS.map((opt) => (
                  <button key={opt.id} type="button" onClick={() => setCharterOption(opt.id)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${charterOption === opt.id ? "border-primary bg-primary-light/40" : "border-gray-200 bg-white hover:border-primary/40"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{opt.name}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-primary">{opt.priceKRW ? formatKRW(opt.priceKRW) : "견적"}</span>
                  </button>
                ))}
              </div>
              {/* 픽업 장소(구글 자동완성) + 픽업 시간 */}
              <AddressInput ready={mapsReady} value={rideFrom} onChange={setRideFrom} placeholder="픽업 장소 (예: 인천국제공항 제1터미널)" className={inp} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={rideDate} onChange={(e) => setRideDate(e.target.value)} className={inp} />
                <input type="time" value={rideTime} onChange={(e) => setRideTime(e.target.value)} className={inp} />
              </div>
            </>
          )}
        </div>
      </ServiceCard>

      {/* 통역 */}
      <ServiceCard on={interpOn} onToggle={() => setInterpOn((v) => !v)} icon="🗣" title="통역"
        summary="진료·상담 동행 통역">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={lang} onChange={(e) => setLang(e.target.value)} placeholder="언어 (예: 베트남어)" className={inp} />
          <input type="number" min={1} step={0.5} value={interpHours} onChange={(e) => setInterpHours(e.target.value)} placeholder="예상 시간 (시간)" className={inp} />
        </div>
      </ServiceCard>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}

      <button type="button" onClick={submit} disabled={sending}
        className="rounded-xl bg-primary py-3.5 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300">
        {sending ? "전송 중…" : "선택한 서비스 요청 보내기"}
      </button>
      <p className="text-center text-[11px] text-gray-400">
        ※ 요청은 운영팀(에이전시 관리)으로 전송되며, 확인 후 견적·일정을 안내합니다.
      </p>
    </div>
  );
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

function ServiceCard({
  on, onToggle, icon, title, summary, children,
}: {
  on: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 transition-colors ${on ? "border-primary/50 bg-white" : "border-gray-200 bg-white"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{summary}</p>
        </div>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-black ${on ? "border-primary bg-primary text-white" : "border-gray-300 text-transparent"}`}>
          ✓
        </span>
      </button>
      {on && <div className="mt-4 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}
