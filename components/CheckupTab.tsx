"use client";
// 건강검진 단일 탭 — 검진은 부킹(시술)과 분리해 여기서만 신청한다.
// 검진센터 카탈로그 선택 → 날짜·시간(1~3) → 사전문진 → checkup_request 생성(admin 검진관리 노출).
import { useCallback, useEffect, useState } from "react";
import type { Account } from "@/lib/auth";
import { B2B_API_BASE } from "@/lib/api";
import { ensurePushSubscribed } from "@/lib/push";

interface Program { id: number; hospital_id: number; hospital_name: string; name: string; price_krw: number; duration?: string | null; includes?: string | null; }
interface MyReq { id: number; program: string | null; status: string; confirmed_date: string | null; preferred_dates: string | null; }

const CONDITIONS = ["고혈압", "당뇨", "심장질환", "신장질환", "갑상선", "없음"];
const won = (n: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = {
  등록: "접수", 문진대기: "문진 대기", 문진완료: "접수됨", 본사승인: "본사 승인",
  병원승인: "검진기관 승인", 확정: "확정", 견적확정: "견적 확정", 견적발송: "견적 발송",
};

export default function CheckupTab({ account }: { account: Account }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [mine, setMine] = useState<MyReq[]>([]);
  const [sel, setSel] = useState<Program | null>(null);
  const [slots, setSlots] = useState<{ date: string; time: string }[]>([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [meds, setMeds] = useState("");
  const [allergy, setAllergy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  function toggleCond(c: string) {
    setConditions((prev) => c === "없음" ? (prev.includes("없음") ? [] : ["없음"]) : (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev.filter((x) => x !== "없음"), c]));
  }
  function setSlot(i: number, k: "date" | "time", v: string) {
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  }

  async function submit() {
    if (!sel) { setMsg("검진센터·프로그램을 선택하세요."); return; }
    const preferred = slots.filter((s) => s.date).map((s) => (s.time ? `${s.date} ${s.time}` : s.date));
    if (preferred.length === 0) { setMsg("희망 날짜·시간을 1개 이상 선택하세요."); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`${B2B_API_BASE}/checkup-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: account.name || account.id,
          hospital_id: sel.hospital_id,
          program: `${sel.name} · ${sel.hospital_name}`,
          preferred_dates: preferred,
          conditions: conditions.length ? conditions : undefined,
          meds: meds || undefined,
          allergy: allergy || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSel(null); setSlots([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]); setConditions([]); setMeds(""); setAllergy("");
      setMsg("검진을 신청했습니다. 운영관리자·검진센터 확인 후 알려드립니다.");
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

      {msg && <div className="rounded-xl bg-primary-light/60 px-4 py-2.5 text-sm font-semibold text-primary-dark">{msg}</div>}

      {/* 내 검진 현황 */}
      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-gray-700">내 검진 신청</h3>
          {mine.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-bold text-gray-800">{r.program || "검진"}</p>
                <p className="text-xs text-gray-400">희망 {r.preferred_dates || "-"}{r.confirmed_date ? ` · 확정 ${r.confirmed_date}` : ""}</p>
              </div>
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary-dark">{STATUS_LABEL[r.status] ?? r.status}</span>
            </div>
          ))}
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
          {/* 희망 날짜·시간 */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-gray-700">희망 날짜·시간 (최대 3개)</h3>
            <div className="flex flex-col gap-2">
              {slots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs text-gray-400">{i + 1}지망</span>
                  <input type="date" min={today()} value={s.date} onChange={(e) => setSlot(i, "date", e.target.value)} className={`${inp} flex-1`} />
                  <input type="time" value={s.time} disabled={!s.date} onChange={(e) => setSlot(i, "time", e.target.value)} className={`${inp} w-28 shrink-0 ${!s.date ? "bg-gray-100 text-gray-400" : ""}`} />
                </div>
              ))}
            </div>
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

          <button type="button" onClick={submit} disabled={busy} className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300">
            {busy ? "신청 중…" : "검진 신청하기"}
          </button>
        </>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:border-primary";
