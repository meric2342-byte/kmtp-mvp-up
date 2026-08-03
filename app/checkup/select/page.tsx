"use client";
// 에이전시 검진 — 환자 선택 링크(?token=). 컨펌된 검진센터 후보 중 1개 선택 → 이후 확정서·에스크로.
import { useCallback, useEffect, useState } from "react";
import { B2B_API_BASE } from "@/lib/api";
import { ensurePushSubscribed } from "@/lib/push";

interface Candidate { id: number; hospital_name: string | null; program_name: string; price_krw: number; proposed_date: string | null; proposed_time: string | null; patient_selected: number; }
interface Data { id: number; patient_name: string; status: string; agency_name: string | null; confirmed_date: string | null; program: string | null; candidates: Candidate[]; }

const won = (n: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");

export default function CheckupSelectPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const load = useCallback(async (tk: string) => {
    try {
      const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(tk)}`);
      if (res.status === 404) { setErr("유효하지 않은 링크입니다."); return; }
      if (!res.ok) return;
      setData(await res.json());
    } catch { /* keep */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = new URLSearchParams(window.location.search).get("token");
    setToken(tk);
    if (tk) { load(tk); const t = setInterval(() => load(tk), 8000); return () => clearInterval(t); }
    else setErr("링크 토큰이 없습니다.");
  }, [load]);

  async function select(candidateId: number) {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(token)}/select`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate_id: candidateId }),
      });
      if (!res.ok) throw new Error();
      await load(token);
    } catch { setErr("선택에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function escrow() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`${B2B_API_BASE}/agency-checkup/by-token/${encodeURIComponent(token)}/escrow`, { method: "POST" });
      if (!res.ok) throw new Error();
      await load(token);
    } catch { setErr("에스크로 진행에 실패했습니다."); }
    finally { setBusy(false); }
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

  if (err) return <div className="min-h-full bg-white">{header}<main className="mx-auto max-w-2xl px-5 py-16 text-center text-gray-500">{err}</main></div>;
  if (!data) return <div className="min-h-full bg-white">{header}<main className="mx-auto max-w-2xl px-5 py-16 text-center text-gray-400">불러오는 중...</main></div>;

  const chosen = data.candidates.find((c) => c.patient_selected);
  const confirmed = ["검진확정", "환자수신", "에스크로진행"].includes(data.status);

  return (
    <div className="min-h-full bg-white">
      {header}
      <main className="mx-auto max-w-2xl px-5 py-8">
        {confirmed ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border-2 border-primary bg-primary-light px-6 py-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
              <p className="mt-2 text-lg font-bold text-primary-dark">검진 확정 · Check-up confirmed</p>
              <p className="mt-1 text-sm text-primary-dark/80">
                {chosen?.hospital_name} · {data.program}<br />
                <b>{data.confirmed_date || "날짜 조율 중"}</b>
              </p>
            </div>
            {data.status !== "에스크로진행" ? (
              <button type="button" onClick={escrow} disabled={busy} className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark disabled:bg-gray-300">
                에스크로 진행 · Proceed to escrow
              </button>
            ) : (
              <p className="text-center text-sm font-bold text-primary-dark">에스크로 진행이 시작되었습니다 · Escrow started</p>
            )}
          </div>
        ) : chosen ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">{data.patient_name}님, 아래 검진을 선택하셨습니다. 병원 최종 확정을 기다려 주세요.</p>
            <div className="rounded-2xl border-2 border-primary bg-primary-light px-5 py-4">
              <p className="font-bold text-primary-dark">✅ {chosen.hospital_name} · {chosen.program_name}</p>
              <p className="mt-1 text-sm text-gray-600">{won(chosen.price_krw)} · {chosen.proposed_date} {chosen.proposed_time}</p>
            </div>
            <p className="text-center text-[11px] text-gray-400">확정되면 이 화면에 자동으로 표시됩니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">검진을 선택하세요</h2>
              <p className="mt-1 text-sm text-gray-500">{data.patient_name}님 · 컨펌된 검진센터 중 1곳을 선택해 주세요.</p>
            </div>
            {data.candidates.length === 0 && <p className="text-sm text-gray-400">컨펌된 후보가 아직 없습니다. 잠시 후 다시 확인해 주세요.</p>}
            {data.candidates.map((c) => (
              <button key={c.id} type="button" onClick={() => select(c.id)} disabled={busy}
                className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-all hover:border-primary disabled:opacity-60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-gray-800">{c.hospital_name}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{c.program_name}</p>
                    <p className="mt-1 text-xs text-gray-400">희망일 {c.proposed_date || "-"} {c.proposed_time || ""}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black text-primary">{won(c.price_krw)}</p>
                </div>
                <p className="mt-2 text-xs font-bold text-primary">이 검진 선택하기 →</p>
              </button>
            ))}
          </div>
        )}

        {/* 실시간 알림 받기 */}
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
