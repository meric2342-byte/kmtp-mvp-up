"use client";
// 환자 직접선택: 검진센터 카탈로그에서 센터·프로그램을 고르고 가능한 날짜·시간을 제안 → 센터 조율 → 확정 → 에스크로.
import { useCallback, useEffect, useState } from "react";
import { B2B_API_BASE } from "@/lib/api";
import { ensurePushSubscribed } from "@/lib/push";

interface Program { id: number; hospital_id: number; hospital_name: string; name: string; price_krw: number; duration?: string | null; includes?: string | null; }
interface Candidate { id: number; hospital_name: string | null; program_name: string; price_krw: number; proposed_date: string | null; proposed_time: string | null; center_status: string; center_note: string | null; patient_selected: number; }
interface Data { id: number; patient_name: string; status: string; agency_name: string | null; confirmed_date: string | null; program: string | null; candidates: Candidate[]; }

const won = (n: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");

export default function CheckupSelectPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  // 선택 입력
  const [selProg, setSelProg] = useState<Program | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async (tk: string) => {
    try {
      const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(tk)}`);
      if (res.status === 404) { setErr("유효하지 않은 링크입니다."); return; }
      if (res.ok) setData(await res.json());
    } catch { /* keep */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = new URLSearchParams(window.location.search).get("token");
    setToken(tk);
    fetch(`${B2B_API_BASE}/hospital-programs`).then((r) => r.json()).then((d) => setPrograms(Array.isArray(d) ? d : [])).catch(() => setPrograms([]));
    if (tk) { load(tk); const t = setInterval(() => load(tk), 8000); return () => clearInterval(t); }
    else setErr("링크 토큰이 없습니다.");
  }, [load]);

  async function choose() {
    if (!token || !selProg) { setErr("검진 프로그램을 선택하세요."); return; }
    if (!date) { setErr("가능한 날짜를 선택하세요."); return; }
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(token)}/patient-choose`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospital_id: selProg.hospital_id, program_name: selProg.name, price_krw: selProg.price_krw, proposed_date: date, proposed_time: time, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      setSelProg(null); setDate(""); setTime(""); setNote("");
      await load(token);
    } catch { setErr("선택 전송에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function escrow() {
    if (!token) return;
    setBusy(true);
    try { const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(token)}/escrow`, { method: "POST" }); if (!res.ok) throw new Error(); await load(token); }
    catch { setErr("에스크로 진행 실패"); } finally { setBusy(false); }
  }

  const header = (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">검</span>
        <span className="text-lg font-black tracking-tight text-primary-dark">건강검진 선택</span>
        {data?.agency_name && <span className="ml-auto text-xs text-gray-400">{data.agency_name} 제공</span>}
      </div>
    </header>
  );

  if (err && !data) return <div className="min-h-full bg-white">{header}<main className="mx-auto max-w-2xl px-5 py-16 text-center text-gray-500">{err}</main></div>;
  if (!data) return <div className="min-h-full bg-white">{header}<main className="mx-auto max-w-2xl px-5 py-16 text-center text-gray-400">불러오는 중...</main></div>;

  const chosen = data.candidates.find((c) => c.patient_selected);
  const confirmed = ["검진확정", "환자수신", "에스크로진행"].includes(data.status);
  const pickMode = ["환자선택대기", "변경요청"].includes(data.status);
  const centers = Array.from(new Set(programs.map((p) => p.hospital_name)));

  return (
    <div className="min-h-full bg-white">
      {header}
      <main className="mx-auto max-w-2xl px-5 py-8">
        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

        {confirmed ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border-2 border-primary bg-primary-light px-6 py-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
              <p className="mt-2 text-lg font-bold text-primary-dark">검진 확정 · Confirmed</p>
              <p className="mt-1 text-sm text-primary-dark/80">{chosen?.hospital_name} · {data.program}<br /><b>{data.confirmed_date || "날짜 조율 중"}</b></p>
            </div>
            {data.status !== "에스크로진행"
              ? <button onClick={escrow} disabled={busy} className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark disabled:bg-gray-300">에스크로 진행 · Proceed to escrow</button>
              : <p className="text-center text-sm font-bold text-primary-dark">에스크로 진행이 시작되었습니다</p>}
          </div>
        ) : data.status === "센터컨펌중" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">{data.patient_name}님, 아래 검진을 선택하셨습니다. 검진센터가 시간을 확정하는 중입니다.</p>
            <div className="rounded-2xl border-2 border-primary bg-primary-light px-5 py-4">
              <p className="font-bold text-primary-dark">🧭 {chosen?.hospital_name} · {chosen?.program_name}</p>
              <p className="mt-1 text-sm text-gray-600">{won(chosen?.price_krw ?? 0)} · 희망 {chosen?.proposed_date} {chosen?.proposed_time}</p>
            </div>
            <p className="text-center text-[11px] text-gray-400">센터 확정 시 자동으로 갱신됩니다.</p>
          </div>
        ) : data.status === "환자선택완료" ? (
          <div className="rounded-2xl border-2 border-primary bg-primary-light px-5 py-4 text-center">
            <p className="font-bold text-primary-dark">✅ 검진센터 시간 컨펌 완료</p>
            <p className="mt-1 text-sm text-gray-600">{chosen?.hospital_name} · {chosen?.program_name} · {chosen?.proposed_date}<br />에이전시 최종 확정을 기다려 주세요.</p>
          </div>
        ) : pickMode ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">검진센터·시간 선택</h2>
              <p className="mt-1 text-sm text-gray-500">{data.patient_name}님, 원하는 검진센터·프로그램을 고르고 가능한 날짜·시간을 알려주세요.</p>
              {data.status === "변경요청" && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">선택하신 시간이 어려워 다른 시간을 골라주세요.</p>}
            </div>

            {centers.map((cn) => (
              <section key={cn}>
                <p className="mb-2 text-sm font-bold text-gray-700">🏥 {cn}</p>
                <div className="flex flex-col gap-2">
                  {programs.filter((p) => p.hospital_name === cn).map((p) => {
                    const sel = selProg?.id === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setSelProg(p)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${sel ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"}`}>
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
              </section>
            ))}

            {selProg && (
              <div className="rounded-2xl border border-primary/30 bg-primary-light/40 p-4">
                <p className="mb-2 text-sm font-bold text-primary-dark">가능한 날짜·시간 제안</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
                </div>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="추가 가능 시간·요청 (선택)" className={`${inputCls} mt-2`} />
                <button type="button" onClick={choose} disabled={busy} className="mt-3 w-full rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark disabled:bg-gray-300">
                  {selProg.hospital_name} · {selProg.name} 선택하고 시간 제안
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">진행 상태: {data.status}</p>
        )}

        <button type="button"
          onClick={async () => { const ok = await ensurePushSubscribed(`patient:${data.id}`); setPushMsg(ok ? "🔔 실시간 알림이 켜졌습니다" : "알림을 켤 수 없어요(앱 설치·권한 확인)"); }}
          className="mt-8 w-full rounded-xl border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary-light">
          🔔 실시간 알림 받기 · Get updates
        </button>
        {pushMsg && <p className="mt-2 text-center text-[11px] text-gray-500">{pushMsg}</p>}
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:border-primary";
