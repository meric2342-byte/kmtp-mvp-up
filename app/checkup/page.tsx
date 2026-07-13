"use client";

// 외국인 건강검진 여정 MVP 프로토타입 (mock)
// 4단계: 사전문진 → 병원·프로그램 선택 → 예약 요청 → 병원 컨펌
import { useState } from "react";

const CONDITIONS = ["고혈압", "당뇨", "심장질환", "신장질환", "갑상선", "없음"];

type Program = {
  id: string;
  name: string;
  hospital: string;
  desc: string;
  price: number;
  featured: boolean;
};

const PROGRAMS: Program[] = [
  {
    id: "premium",
    name: "종합검진 프리미엄",
    hospital: "서울메디케어 국제병원",
    desc: "위·대장내시경 포함 정밀 검진",
    price: 1_500_000,
    featured: true,
  },
  {
    id: "basic",
    name: "기본 종합검진",
    hospital: "서울메디케어 국제병원",
    desc: "기본 혈액·영상검사",
    price: 900_000,
    featured: false,
  },
];

const DATES = ["7월 20일", "7월 21일", "7월 22일", "7월 23일", "7월 24일"];

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");

const STEPS = [
  { n: 1, label: "사전문진" },
  { n: 2, label: "병원·프로그램" },
  { n: 3, label: "예약 요청" },
  { n: 4, label: "병원 컨펌" },
];

export default function CheckupPage() {
  const [step, setStep] = useState(1);

  // 1. 사전문진
  const [name, setName] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [meds, setMeds] = useState("");
  const [allergy, setAllergy] = useState("");
  const [imageLink, setImageLink] = useState("");

  // 2. 프로그램
  const [programId, setProgramId] = useState<string | null>(null);

  // 3~4. 예약·컨펌
  const [dates, setDates] = useState<string[]>([]);
  const [status, setStatus] = useState<"none" | "pending" | "confirmed">("none");
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);

  const program = PROGRAMS.find((p) => p.id === programId) ?? null;

  function toggleCondition(c: string) {
    setConditions((prev) => {
      if (c === "없음") return prev.includes("없음") ? [] : ["없음"];
      const next = prev.filter((x) => x !== "없음");
      return next.includes(c) ? next.filter((x) => x !== c) : [...next, c];
    });
  }

  function toggleDate(d: string) {
    setDates((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      if (prev.length >= 3) return prev;
      return [...prev, d];
    });
  }

  async function requestBooking() {
    // 에이전시 관리 페이지(b2b 백엔드)로 전송. NEXT_PUBLIC_API_URL 미설정 시 데모로만 진행.
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      try {
        await fetch(`${api}/checkup-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_name: name || "이름 미입력",
            conditions,
            meds,
            allergy,
            image_link: imageLink,
            program: program?.name ?? null,
            preferred_dates: dates,
            agent_id: 1,
          }),
        });
      } catch {
        // 데모: 백엔드 미연동 시 무시하고 진행
      }
    }
    setStatus("pending");
    setStep(4);
  }

  function demoConfirm() {
    setConfirmedDate(dates[0] ?? DATES[0]);
    setStatus("confirmed");
  }

  return (
    <div className="min-h-full bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
            검
          </span>
          <span className="text-lg font-black tracking-tight text-primary-dark">
            건강검진 여정
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            사전문진부터 예약 확정까지
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        {/* 스텝퍼 */}
        <ol className="mb-10 flex w-full items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const done = s.n < step;
            const active = s.n === step;
            return (
              <li key={s.n} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  {i !== 0 && (
                    <div className={`h-0.5 flex-1 ${s.n <= step ? "bg-primary" : "bg-gray-200"}`} />
                  )}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      active
                        ? "bg-primary text-white ring-4 ring-primary-light"
                        : done
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {done ? "✓" : s.n}
                  </div>
                  {i !== STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${s.n < step ? "bg-primary" : "bg-gray-200"}`} />
                  )}
                </div>
                <span
                  className={`text-center text-[11px] leading-tight sm:text-xs ${
                    active ? "font-bold text-primary-dark" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* 1. 사전문진 · 앙케이트 */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">사전문진 · 앙케이트</h2>
              <p className="mt-1 text-sm text-gray-500">검진 전 상태를 미리 확인합니다. 안내는 WhatsApp으로 받습니다.</p>
            </div>

            <Field label="환자 이름 (여권 영문)">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: NGUYEN VAN AN" className={inputCls} />
            </Field>

            <section>
              <p className="mb-3 text-sm font-semibold text-gray-700">기저질환 (해당 항목 선택)</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => {
                  const on = conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        on
                          ? "bg-primary-light font-bold text-primary-dark"
                          : "border-2 border-gray-200 text-gray-600 hover:border-primary/40"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {c}
                    </button>
                  );
                })}
              </div>
            </section>

            <Field label="복용 중인 약">
              <input value={meds} onChange={(e) => setMeds(e.target.value)} placeholder="예: 아스피린 100mg" className={inputCls} />
            </Field>
            <Field label="알레르기">
              <input value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="약물 · 음식 알레르기" className={inputCls} />
            </Field>
            <Field label="기존 검사영상(MRI/CT) 링크 (선택)">
              <input value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="영상 공유 링크 붙여넣기" className={inputCls} />
              <p className="mt-1 text-xs text-gray-400">파일 업로드·판독뷰어는 다음 단계에서 제공됩니다.</p>
            </Field>

            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className={nextCls}>
                병원 선택 →
              </button>
            </div>
          </div>
        )}

        {/* 2. 병원 · 프로그램 선택 */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">병원 · 검진 프로그램 선택</h2>
              <p className="mt-1 text-sm text-gray-500">가격잠금이 적용된 프로그램입니다. 예약 시점 가격이 청구 시점까지 유지됩니다.</p>
            </div>

            <div className="flex flex-col gap-3">
              {PROGRAMS.map((p) => {
                const sel = p.id === programId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProgramId(p.id)}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      sel
                        ? "border-primary bg-primary-light"
                        : p.featured
                          ? "border-primary/60 bg-white hover:border-primary"
                          : "border-gray-200 bg-white hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-800">{p.name}</span>
                      <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-bold text-primary-dark">
                        🔒 가격잠금
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{p.hospital} · {p.desc}</p>
                    <p className="mt-2 text-lg font-black text-primary">{won(p.price)}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className={prevCls}>← 이전</button>
              <button
                type="button"
                disabled={!programId}
                onClick={() => setStep(3)}
                className={`${nextCls} ${!programId ? "cursor-not-allowed !bg-gray-300" : ""}`}
              >
                예약 요청 →
              </button>
            </div>
          </div>
        )}

        {/* 3. 예약 요청 */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">예약 요청</h2>
              <p className="mt-1 text-sm text-gray-500">희망 날짜를 최대 3개까지 선택하면 병원이 컨펌합니다.</p>
            </div>

            {program && (
              <div className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary-dark">
                선택 프로그램: <b>{program.name}</b> · {won(program.price)}
              </div>
            )}

            <section>
              <p className="mb-3 text-sm font-semibold text-gray-700">희망 날짜 (최대 3개 · {dates.length}/3)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {DATES.map((d) => {
                  const on = dates.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDate(d)}
                      className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-primary/40"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className={prevCls}>← 이전</button>
              <button
                type="button"
                disabled={dates.length === 0}
                onClick={requestBooking}
                className={`${nextCls} ${dates.length === 0 ? "cursor-not-allowed !bg-gray-300" : ""}`}
              >
                예약 요청 보내기 →
              </button>
            </div>
          </div>
        )}

        {/* 4. 병원 컨펌 */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">병원 컨펌</h2>
              <p className="mt-1 text-sm text-gray-500">병원이 날짜를 확정하면 WhatsApp으로 안내가 발송됩니다.</p>
            </div>

            {status === "pending" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-4">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">병원 컨펌 대기 중</p>
                    <p className="text-xs text-amber-700">희망 날짜: {dates.join(", ")}</p>
                  </div>
                </div>
                <button type="button" onClick={demoConfirm} className="rounded-xl border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary-light">
                  ▶ 데모: 병원이 컨펌했다고 가정
                </button>
              </div>
            )}

            {status === "confirmed" && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-primary bg-primary-light px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-white">✓</span>
                <p className="text-lg font-bold text-primary-dark">검진 예약 확정</p>
                <p className="text-sm text-primary-dark/80">
                  {program?.name} · <b>{confirmedDate}</b> 확정
                  <br />WhatsApp으로 안내가 발송되었습니다.
                </p>
                <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-dark">
                  다음: 호텔 · 항공 예약 안내
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(3)} className={prevCls}>← 이전</button>
              <button type="button" onClick={() => { setStep(1); setStatus("none"); setConfirmedDate(null); }} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                처음부터 다시
              </button>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-gray-400">
          ※ 데모 프로토타입입니다. 실제 검진·결제·병원 연동은 이루어지지 않습니다.
        </p>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:border-primary";
const nextCls =
  "rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-dark";
const prevCls =
  "rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
