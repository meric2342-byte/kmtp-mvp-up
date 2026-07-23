"use client";

// 비대면 사전상담(세컨드오피니언) — 방문 전 문진 기반 원격 상담 신청 + 소견 확인.
// 요청은 b2b 운영 백엔드(/consultations)로 전송, 상태·소견을 폴링해 표시한다.
import { useCallback, useEffect, useState } from "react";
import { B2B_API_BASE } from "@/lib/api";
import { loadProfile } from "@/lib/profile";

const CONDITIONS = ["고혈압", "당뇨", "심장질환", "신장질환", "갑상선", "없음"];

const STAGES = [
  { key: "상담요청", label: "접수" },
  { key: "병원배정", label: "검진기관 배정" },
  { key: "소견완료", label: "소견 도착" },
];
function stageIndex(s: string): number {
  if (s === "소견완료") return 2;
  if (s === "병원배정") return 1;
  return 0;
}

interface ConsultRow {
  id: number; status: string; doctor_opinion: string | null;
  recommended_department: string | null; recommended_hospital: string | null;
  video_link: string | null; consult_datetime: string | null;
}

export default function ConsultPage() {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [meds, setMeds] = useState("");
  const [allergy, setAllergy] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [preferred, setPreferred] = useState("");
  const [ref, setRef] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [reqId, setReqId] = useState<number | null>(null);
  const [remote, setRemote] = useState<ConsultRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRef(new URLSearchParams(window.location.search).get("ref"));
      const p = loadProfile();
      const fn = [p.surname, p.givenName].filter(Boolean).join(" ").trim();
      if (fn) setName(fn);
    }
  }, []);

  function toggle(c: string) {
    setConditions((prev) => {
      if (c === "없음") return prev.includes("없음") ? [] : ["없음"];
      const next = prev.filter((x) => x !== "없음");
      return next.includes(c) ? next.filter((x) => x !== c) : [...next, c];
    });
  }

  async function submit() {
    if (!name.trim()) { setError("이름을 입력하세요."); return; }
    if (!question.trim()) { setError("상담 요청 내용을 입력하세요."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${B2B_API_BASE}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: name.trim(), question: question.trim(),
          conditions, meds, allergy, image_link: imageLink,
          preferred_datetime: preferred || undefined, ref: ref || undefined,
        }),
      });
      if (res.ok) { const d = await res.json(); setReqId(d?.id ?? null); }
      setSubmitted(true);
    } catch {
      setSubmitted(true); // 데모: 백엔드 미연동 시에도 진행
    } finally {
      setBusy(false);
    }
  }

  const poll = useCallback(async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch(`${B2B_API_BASE}/consultations/by-patient/${encodeURIComponent(name.trim())}`);
      if (!res.ok) return;
      const list: ConsultRow[] = await res.json();
      if (!Array.isArray(list) || !list.length) return;
      const mine = (reqId != null ? list.find((x) => x.id === reqId) : null) ?? list[0];
      if (mine) setRemote(mine);
    } catch { /* 무시 */ }
  }, [name, reqId]);

  useEffect(() => {
    if (!submitted) return;
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [submitted, poll]);

  const stage = remote ? stageIndex(remote.status) : 0;

  return (
    <div className="min-h-full bg-white">
      <main className="mx-auto max-w-lg px-5 py-8">
        <h1 className="text-2xl font-bold text-primary-dark">비대면 사전상담</h1>
        <p className="mt-1.5 text-sm text-gray-500">방문 전, 문진과 영상 자료로 전문의 소견(세컨드오피니언)을 받아보세요.</p>

        {!submitted ? (
          <div className="mt-6 flex flex-col gap-4">
            <Field label="이름"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: NGUYEN VAN AN" className={inp} /></Field>
            <Field label="상담 요청 내용 *"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="증상·기간·궁금한 점 (예: 무릎 통증 6개월, MRI 판독 요청)" className={inp} /></Field>
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">기저질환</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggle(c)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${conditions.includes(c) ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>{c}</button>
                ))}
              </div>
            </div>
            <Field label="복용약"><input value={meds} onChange={(e) => setMeds(e.target.value)} className={inp} /></Field>
            <Field label="알레르기"><input value={allergy} onChange={(e) => setAllergy(e.target.value)} className={inp} /></Field>
            <Field label="영상/판독 링크 (선택)"><input value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="MRI·CT 등 공유 링크" className={inp} /></Field>
            <Field label="희망 상담 일시 (선택)"><input value={preferred} onChange={(e) => setPreferred(e.target.value)} placeholder="2026-08-05 14:00" className={inp} /></Field>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button onClick={submit} disabled={busy} className="rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-primary-dark disabled:bg-gray-300">
              {busy ? "전송 중…" : "상담 신청"}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {/* 진행 단계 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {STAGES.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${i <= stage ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>{s.label}</span>
                  {i < STAGES.length - 1 && <span className={i < stage ? "text-primary" : "text-gray-300"}>›</span>}
                </div>
              ))}
            </div>

            {stage < 2 ? (
              <div className="rounded-xl bg-amber-50 px-4 py-4">
                <p className="text-sm font-bold text-amber-800">
                  {stage === 1 ? "검진기관 배정 완료 · 전문의 소견 작성 중" : "접수됨 · 검진기관 배정 대기 중"}
                </p>
                <p className="mt-1 text-xs text-amber-700">소견이 도착하면 이 화면에 표시됩니다.</p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-primary bg-primary-light px-5 py-5">
                <p className="text-base font-bold text-primary-dark">✅ 전문의 소견 도착</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-primary-dark/90">{remote?.doctor_opinion}</p>
                <p className="mt-3 text-sm text-primary-dark/80">추천: {remote?.recommended_department || "-"} · {remote?.recommended_hospital || "-"}
                  {remote?.consult_datetime ? ` · 상담일시 ${remote.consult_datetime}` : ""}</p>
                {remote?.video_link && (
                  <a href={remote.video_link} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">🎥 영상 상담 참여</a>
                )}
              </div>
            )}
            <button onClick={poll} className="rounded-xl border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary-light">↻ 상태 새로고침</button>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>{children}</div>);
}
const inp = "w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-primary";
