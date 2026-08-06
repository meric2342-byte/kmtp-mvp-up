"use client";
// 건강검진 단일 탭 — 검진은 부킹(시술)과 분리해 여기서만 신청한다.
// 검진센터 카탈로그 선택 → 날짜·시간(1~3) → 사전문진 → checkup_request 생성(admin 검진관리 노출).
import { useCallback, useEffect, useState } from "react";
import type { Account } from "@/lib/auth";
import { B2B_API_BASE } from "@/lib/api";
import { ensurePushSubscribed } from "@/lib/push";
import { loadProfile } from "@/lib/profile";

interface Program { id: number; hospital_id: number; hospital_name: string; name: string; price_krw: number; duration?: string | null; includes?: string | null; }
interface MyReq { id: number; program: string | null; status: string; confirmed_date: string | null; confirmed_time: string | null; preferred_dates: string | null; }

const CONDITIONS = ["고혈압", "당뇨", "심장질환", "신장질환", "갑상선", "없음"];
const won = (n: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = {
  등록: "접수", 문진대기: "문진 대기", 문진완료: "접수됨", 본사승인: "본사 승인",
  병원승인: "검진기관 승인", 확정: "확정", 견적확정: "견적 확정", 견적발송: "견적 발송",
};

export default function CheckupTab({ account, onBookOther }: { account: Account; onBookOther?: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [mine, setMine] = useState<MyReq[]>([]);
  const [sel, setSel] = useState<Program | null>(null);
  // 검진은 '날짜만' 희망으로 접수 — 시간은 검진센터 일정에 맞춰 확정 후 통보한다.
  const [slots, setSlots] = useState<string[]>(["", "", ""]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [meds, setMeds] = useState("");
  const [allergy, setAllergy] = useState("");
  const [arrival, setArrival] = useState("");    // 입국일 — 검진센터 일정 조율 참고(항목28)
  const [departure, setDeparture] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false); // 신청 완료 → 진료과 복귀 안내
  const [kitReceived, setKitReceived] = useState<Record<number, boolean>>({}); // 대장내시경 키트 수령 확인(로컬)

  const loadMine = useCallback(() => {
    fetch(`${B2B_API_BASE}/checkup-requests/by-patient/${encodeURIComponent(account.name || account.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMine(Array.isArray(d) ? d : []))
      .catch(() => setMine([]));
  }, [account.name, account.id]);

  useEffect(() => {
    fetch(`${B2B_API_BASE}/hospital-programs`).then((r) => r.json()).then((d) => setPrograms(Array.isArray(d) ? d : [])).catch(() => setPrograms([]));
    loadMine();
    const t = setInterval(loadMine, 6000); // 승인 상태 실시간 반영
    return () => clearInterval(t);
  }, [loadMine]);

  // 대장내시경 키트 수령 상태를 localStorage에서 복원
  useEffect(() => {
    const next: Record<number, boolean> = {};
    for (const r of mine) {
      try { if (localStorage.getItem(`kmtp_kit_received:${account.id}:${r.id}`) === "1") next[r.id] = true; } catch {}
    }
    setKitReceived(next);
  }, [mine, account.id]);

  function toggleCond(c: string) {
    setConditions((prev) => c === "없음" ? (prev.includes("없음") ? [] : ["없음"]) : (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev.filter((x) => x !== "없음"), c]));
  }
  function setSlot(i: number, v: string) {
    setSlots((prev) => prev.map((s, j) => (j === i ? v : s)));
  }

  async function submit() {
    if (!sel) { setMsg("검진센터·프로그램을 선택하세요."); return; }
    const preferred = slots.filter(Boolean);
    if (preferred.length === 0) { setMsg("희망 날짜를 1개 이상 선택하세요."); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`${B2B_API_BASE}/checkup-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: account.name || account.id,
          hospital_id: sel.hospital_id,
          program: `${sel.name} · ${sel.hospital_name}`,
          quote_amount: sel.price_krw,
          contact: loadProfile(account.id).whatsapp || undefined,
          arrival_date: arrival || undefined,
          departure_date: departure || undefined,
          preferred_dates: preferred,
          conditions: conditions.length ? conditions : undefined,
          meds: meds || undefined,
          allergy: allergy || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSel(null); setSlots(["", "", ""]); setConditions([]); setMeds(""); setAllergy(""); setArrival(""); setDeparture("");
      setMsg("검진을 신청했습니다. 운영관리자·검진센터 확인 후 알려드립니다.");
      setDone(true);
      loadMine();
      ensurePushSubscribed(`patient:${account.id}`).catch(() => {});
    } catch { setMsg("신청에 실패했습니다."); }
    finally { setBusy(false); }
  }

  const centers = Array.from(new Set(programs.map((p) => p.hospital_name)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">건강검진</h2>
        <p className="mt-1.5 text-sm text-gray-500">검진센터와 프로그램을 고르고 희망 날짜·시간을 정하면 검진기관과 조율해 확정해 드립니다.</p>
      </div>

      {done ? (
        <div className="rounded-xl border border-primary/30 bg-primary-light/60 p-4">
          <p className="text-sm font-bold text-primary-dark">✅ 검진을 신청했습니다.</p>
          <p className="mt-1 text-xs text-gray-500">운영관리자·검진센터 확인 후 알려드립니다. 아래 &lsquo;내 검진 신청&rsquo;에서 진행 상태를 확인할 수 있어요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onBookOther && (
              <button type="button" onClick={onBookOther} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark">
                진료과로 돌아가 다른 진료 예약하기 →
              </button>
            )}
            <button type="button" onClick={() => { setDone(false); setMsg(null); }} className="rounded-lg border-2 border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:border-primary/40">
              검진 추가 신청
            </button>
          </div>
        </div>
      ) : (
        msg && <div className="rounded-xl bg-primary-light/60 px-4 py-2.5 text-sm font-semibold text-primary-dark">{msg}</div>
      )}

      {/* 내 검진 현황 */}
      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-gray-700">내 검진 신청</h3>
          {mine.map((r) => {
            const isColon = /대장|내시경/.test(r.program || "");
            const kitKey = `kmtp_kit_received:${account.id}:${r.id}`;
            const kitDone = kitReceived[r.id];
            return (
              <div key={r.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{r.program || "검진"}</p>
                    <p className="text-xs text-gray-400">희망 {r.preferred_dates || "-"}{r.confirmed_date ? ` · 확정 ${r.confirmed_date}${r.confirmed_time ? ` ${r.confirmed_time}` : ""}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary-dark">{STATUS_LABEL[r.status] ?? r.status}</span>
                </div>
                {/* 대장내시경 프로그램: 사전 장정결 키트 수령 확인 버튼 */}
                {isColon && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    {kitDone ? (
                      <span className="text-xs font-bold text-primary-dark">✅ 건강검진 패키지(대장내시경 키트) 수령 확인됨</span>
                    ) : (
                      <button type="button"
                        onClick={() => { try { localStorage.setItem(kitKey, "1"); } catch {} setKitReceived((p) => ({ ...p, [r.id]: true })); }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark">
                        📦 건강검진 패키지(대장내시경 키트) 수령 확인
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 검진센터·프로그램 카탈로그 */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-gray-700">검진센터·프로그램 선택</h3>
        {programs.length === 0 && <p className="text-sm text-gray-400">등록된 검진 프로그램이 없습니다.</p>}
        {centers.map((cn) => (
          <div key={cn}>
            <p className="mb-2 text-xs font-bold text-gray-600">🏥 {cn}</p>
            <div className="flex flex-col gap-2">
              {programs.filter((p) => p.hospital_name === cn).map((p) => {
                const on = sel?.id === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setSel(p)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${on ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{p.name}</p>
                        {p.includes && <p className="mt-0.5 text-[11px] text-gray-400">{p.includes}</p>}
                        {p.duration && <p className="text-[11px] text-gray-400">⏱ {p.duration}</p>}
                      </div>
                      <p className="shrink-0 text-base font-black text-primary">{won(p.price_krw)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {sel && (
        <>
          {/* 희망 날짜 (시간은 검진센터 일정에 맞춰 확정 후 통보) */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-gray-700">희망 날짜 (최대 3개)</h3>
            <div className="flex flex-col gap-2">
              {slots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs text-gray-400">{i + 1}지망</span>
                  <input type="date" min={today()} value={s} onChange={(e) => setSlot(i, e.target.value)} className={`${inp} flex-1`} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">시간은 검진센터 일정에 맞춰 예약을 잡아 안내해 드립니다.</p>
          </section>

          {/* 입국/출국일 — 검진센터가 이 기간 내에서 가능 일정·시간을 잡아 통보합니다(항목28) */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-gray-700">입국일 · 출국일</h3>
            <div className="flex items-center gap-2">
              <input type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} className={`${inp} flex-1`} placeholder="입국일" />
              <span className="text-gray-400">~</span>
              <input type="date" value={departure} min={arrival || undefined} onChange={(e) => setDeparture(e.target.value)} className={`${inp} flex-1`} placeholder="출국일" />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">검진센터가 입국~출국일 사이에서 가능한 일정·시간을 잡아 안내해 드립니다.</p>
          </section>

          {/* 사전문진 (선택) */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-700">사전 문진 (선택)</h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const on = conditions.includes(c);
                return <button key={c} type="button" onClick={() => toggleCond(c)} className={`rounded-full px-4 py-2 text-sm transition-colors ${on ? "bg-primary-light font-bold text-primary-dark" : "border-2 border-gray-200 text-gray-600 hover:border-primary/40"}`}>{on ? "✓ " : ""}{c}</button>;
              })}
            </div>
            <input value={meds} onChange={(e) => setMeds(e.target.value)} placeholder="복용 중인 약 (선택)" className={inp} />
            <input value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="알레르기 (선택)" className={inp} />
          </section>

          {/* 신청 요약 — 관리자 최종 승인 검토용 금액이 함께 접수됩니다 */}
          <section className="rounded-xl border border-primary/30 bg-primary-light/40 p-4">
            <h3 className="mb-2 text-sm font-bold text-primary-dark">신청 내역 확인</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{sel.name} · {sel.hospital_name}</span>
              <span className="font-black text-primary">{won(sel.price_krw)}</span>
            </div>
            {slots.some(Boolean) && (
              <p className="mt-1.5 text-xs text-gray-500">희망 {slots.filter(Boolean).join(", ")}</p>
            )}
            <p className="mt-2 text-[11px] text-gray-400">※ 금액과 신청 내역은 운영관리자 최종 승인 화면에 표시됩니다. 최종 금액은 검진기관 조율 후 확정됩니다.</p>
          </section>

          <button type="button" onClick={submit} disabled={busy} className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300">
            {busy ? "신청 중…" : "검진 신청하기"}
          </button>
        </>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:border-primary";
