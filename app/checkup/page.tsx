"use client";

// 외국인 건강검진 여정 MVP 프로토타입 (mock)
// 4단계: 사전문진 → 병원·프로그램 선택 → 예약 요청 → 병원 컨펌
import { useCallback, useEffect, useState } from "react";
import { B2B_API_BASE } from "@/lib/api";

const CONDITIONS = ["고혈압", "당뇨", "심장질환", "신장질환", "갑상선", "없음"];

type Program = {
  id: string;
  name: string;
  hospital: string;
  badge: string;        // 검진 유형 배지
  tagline: string;      // 한 줄 요약
  duration: string;     // 소요 시간
  includes: string[];   // 포함 항목
  targets: string;      // 권장 대상
  price: number;
  featured: boolean;
};

const PROGRAMS: Program[] = [
  {
    id: "basic",
    name: "기본 종합검진",
    hospital: "서울메디케어 국제병원",
    badge: "기본",
    tagline: "혈액·영상 기본 항목으로 건강 상태를 빠르게 확인합니다.",
    duration: "약 2~3시간 (당일 결과 요약 제공)",
    includes: [
      "혈액검사 (혈구·혈당·지질·간·신장·갑상선 기능)",
      "흉부 X선",
      "복부 초음파",
      "심전도(ECG)",
      "소변·대변검사",
      "영문/현지어 결과 요약 리포트",
      "통역 코디네이터 동행",
    ],
    targets: "20~40대 · 기본 건강 확인 · 단기 방문자",
    price: 900_000,
    featured: false,
  },
  {
    id: "premium",
    name: "프리미엄 종합검진",
    hospital: "서울메디케어 국제병원",
    badge: "인기",
    tagline: "내시경 포함 정밀 검진. 가장 많이 선택하는 표준 패키지입니다.",
    duration: "약 4~5시간 (당일 결과 상담 포함)",
    includes: [
      "기본 혈액검사 전 항목",
      "위내시경 (수면 옵션 가능)",
      "대장내시경 또는 분변 잠혈검사",
      "흉부 CT (저선량)",
      "복부 초음파",
      "갑상선 초음파",
      "유방 초음파 (여성)",
      "골밀도 검사",
      "영문 전문의 소견서 + 화상 상담 1회",
    ],
    targets: "40~60대 · 정기 정밀 검진 · 가족력 있는 분",
    price: 1_500_000,
    featured: true,
  },
  {
    id: "vip",
    name: "VIP 전신 정밀검진",
    hospital: "서울아산병원 · 서울메디케어",
    badge: "프리미엄",
    tagline: "MRI·CT 전신 스캔 포함. 암·심혈관·뇌 전반을 한 번에 점검합니다.",
    duration: "약 6~8시간 (2일 분할 가능)",
    includes: [
      "프리미엄 검진 전 항목",
      "뇌 MRI (뇌졸중·종양 스크리닝)",
      "심장 CT (관상동맥 칼슘 스코어)",
      "폐 CT (결절·암 조기 발견)",
      "PET-CT 암 조기검진 (옵션)",
      "경동맥 초음파",
      "인지기능검사",
      "전문의 종합 소견 + 맞춤 건강 플랜",
      "영문 리포트 + 화상 상담 2회",
    ],
    targets: "50대 이상 · 고위험군 · 경영인·VIP",
    price: 3_500_000,
    featured: false,
  },
  {
    id: "cancer",
    name: "암 조기검진 패키지",
    hospital: "삼성서울병원 · 서울대학교병원",
    badge: "암 특화",
    tagline: "주요 6대 암(위·대장·폐·간·유방·자궁경부)을 집중 스크리닝합니다.",
    duration: "약 5~6시간 (당일 결과 일부 제공)",
    includes: [
      "위내시경 + 조직검사(필요 시)",
      "대장내시경",
      "폐 CT (저선량)",
      "간초음파 + AFP",
      "유방 초음파·맘모그래피 (여성)",
      "자궁경부 세포진 + HPV (여성)",
      "전립선 PSA (남성)",
      "종양 표지자 혈액검사 (CEA·CA19-9 등)",
      "전문의 결과 상담 + 영문 소견서",
    ],
    targets: "40대 이상 · 가족력 있는 분 · 암 조기 발견 원하는 분",
    price: 2_500_000,
    featured: false,
  },
  {
    id: "cardio",
    name: "심혈관 정밀검진",
    hospital: "신촌 세브란스병원 · 서울아산병원",
    badge: "심장 특화",
    tagline: "심장·혈관 전문 정밀 검사. 협심증·심근경색 위험도를 사전에 파악합니다.",
    duration: "약 4~5시간",
    includes: [
      "심장 초음파 (심기능·판막·구조 평가)",
      "관상동맥 CT (칼슘 스코어 + 협착 여부)",
      "심전도·24시간 홀터 심전도",
      "경동맥 초음파 (동맥경화 평가)",
      "혈압·맥파속도(PWV)",
      "혈액 (LDL·HDL·중성지방·hs-CRP 등)",
      "심장내과 전문의 판독 + 영문 소견서",
    ],
    targets: "고혈압·당뇨·고지혈증 있는 분 · 가족력 · 40대 이상 남성",
    price: 2_200_000,
    featured: false,
  },
  {
    id: "womens",
    name: "여성 건강검진",
    hospital: "강남차병원 · 서울성모병원",
    badge: "여성 특화",
    tagline: "여성 전용 항목(부인과·유방·갑상선) 중심의 맞춤 검진입니다.",
    duration: "약 3~4시간",
    includes: [
      "기본 혈액검사 전 항목",
      "유방 초음파 + 맘모그래피",
      "자궁경부 세포진 (PAP smear) + HPV",
      "자궁·난소 초음파",
      "갑상선 초음파 + 기능검사",
      "골밀도 검사 (DEXA)",
      "여성 호르몬 (FSH·E2·AMH)",
      "산부인과 전문의 상담 + 영문 소견서",
    ],
    targets: "20~50대 여성 · 부인과 이상 증상 · 폐경 전후",
    price: 1_800_000,
    featured: false,
  },
];

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");

const STEPS = [
  { n: 1, label: "사전문진" },
  { n: 2, label: "병원·프로그램" },
  { n: 3, label: "예약 요청" },
  { n: 4, label: "병원 컨펌" },
];

// 검진 다단계 승인: 접수 → 본사 승인 → 검진기관 승인 → 확정
const CHECKUP_STAGES = [
  { key: "요청", label: "접수" },
  { key: "본사승인", label: "본사 승인" },
  { key: "병원승인", label: "검진기관 승인" },
  { key: "확정", label: "확정" },
];
function checkupStageIndex(s: string): number {
  if (s === "확정") return 3;
  if (s === "병원승인") return 2;
  if (s === "본사승인") return 1;
  return 0; // 요청·견적확정·견적발송
}

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
  const today = new Date().toISOString().slice(0, 10);
  const [dates, setDates] = useState<string[]>(["", "", ""]);
  const chosenDates = dates.filter(Boolean);
  const [status, setStatus] = useState<"none" | "pending" | "confirmed">("none");
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  // 실제 백엔드 승인 단계(요청/본사승인/병원승인/확정) 폴링 반영
  const [requestId, setRequestId] = useState<number | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<string>("요청");

  // 에이전시 귀속 코드(링크 ?ref=). 없으면 우리 직접 방문으로 처리됨.
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRef(new URLSearchParams(window.location.search).get("ref"));
    }
  }, []);

  const program = PROGRAMS.find((p) => p.id === programId) ?? null;

  function toggleCondition(c: string) {
    setConditions((prev) => {
      if (c === "없음") return prev.includes("없음") ? [] : ["없음"];
      const next = prev.filter((x) => x !== "없음");
      return next.includes(c) ? next.filter((x) => x !== c) : [...next, c];
    });
  }

  function setDateAt(i: number, val: string) {
    setDates((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  async function requestBooking() {
    // 검진 요청은 항상 b2b 운영 백엔드(에이전시 관리)로 전송한다.
    try {
      const res = await fetch(`${B2B_API_BASE}/checkup-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: name || "이름 미입력",
          conditions,
          meds,
          allergy,
          image_link: imageLink,
          program: program?.name ?? null,
          preferred_dates: chosenDates,
          ref: ref || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (created?.id != null) setRequestId(created.id);
      }
    } catch {
      // 데모: 백엔드 미연동 시 무시하고 진행
    }
    setRemoteStatus("요청");
    setStatus("pending");
    setStep(4);
  }

  // 승인 진행 상태 폴링 — 본사/검진기관 승인 결과를 환자 화면에 반영(5초 간격)
  const pollStatus = useCallback(async () => {
    const who = (name || "이름 미입력").trim();
    if (!who) return;
    try {
      const res = await fetch(`${B2B_API_BASE}/checkup-requests/by-patient/${encodeURIComponent(who)}`);
      if (!res.ok) return;
      const list: { id: number; status: string; confirmed_date: string | null }[] = await res.json();
      if (!Array.isArray(list) || list.length === 0) return;
      const mine = (requestId != null ? list.find((x) => x.id === requestId) : null) ?? list[0];
      if (!mine) return;
      setRemoteStatus(mine.status);
      if (mine.confirmed_date) setConfirmedDate(mine.confirmed_date);
      if (mine.status === "확정") setStatus("confirmed");
    } catch {
      // 네트워크 오류는 조용히 무시(다음 폴링에서 재시도)
    }
  }, [name, requestId]);

  useEffect(() => {
    if (step !== 4 || status === "confirmed") return;
    pollStatus();
    const t = setInterval(pollStatus, 5000);
    return () => clearInterval(t);
  }, [step, status, pollStatus]);

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

            <div className="flex flex-col gap-4">
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
                    {/* 헤더 */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-gray-800">{p.name}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            p.featured ? "bg-primary text-white" : "bg-primary-light text-primary-dark"
                          }`}>{p.badge}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{p.hospital}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-primary">{won(p.price)}</p>
                        <span className="text-[10px] font-bold text-primary-dark bg-primary-light px-2 py-0.5 rounded-full">🔒 가격잠금</span>
                      </div>
                    </div>

                    {/* 한 줄 요약 */}
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.tagline}</p>

                    {/* 소요 시간 */}
                    <p className="mt-1.5 text-xs text-gray-400">⏱ {p.duration}</p>

                    {/* 포함 항목 */}
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5">포함 항목</p>
                      <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                        {p.includes.map((item) => (
                          <li key={item} className="flex items-start gap-1 text-[11px] text-gray-600">
                            <span className="text-primary mt-0.5 shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 권장 대상 */}
                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                      👥 권장 대상: {p.targets}
                    </div>
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
                <p><b>{program.name}</b> · {won(program.price)}</p>
                <p className="text-xs mt-0.5 text-primary-dark/70">{program.tagline}</p>
              </div>
            )}

            <section>
              <p className="mb-3 text-sm font-semibold text-gray-700">희망 날짜 (최대 3개, 달력에서 선택)</p>
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="date"
                    min={today}
                    value={dates[i] ?? ""}
                    onChange={(e) => setDateAt(i, e.target.value)}
                    className={inputCls}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">1지망부터 순서대로 선택하세요. 병원이 이 중 하나로 컨펌합니다.</p>
            </section>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className={prevCls}>← 이전</button>
              <button
                type="button"
                disabled={chosenDates.length === 0}
                onClick={requestBooking}
                className={`${nextCls} ${chosenDates.length === 0 ? "cursor-not-allowed !bg-gray-300" : ""}`}
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
                {/* 승인 진행 단계 (실시간 반영) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {CHECKUP_STAGES.map((s, i) => {
                    const done = i <= checkupStageIndex(remoteStatus);
                    return (
                      <div key={s.key} className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${done ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                          {s.label}
                        </span>
                        {i < CHECKUP_STAGES.length - 1 && (
                          <span className={i < checkupStageIndex(remoteStatus) ? "text-primary" : "text-gray-300"}>›</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-4">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      {remoteStatus === "본사승인" ? "본사 승인 완료 · 검진기관 승인 대기 중"
                        : remoteStatus === "병원승인" ? "검진기관 승인 완료 · 본사 최종 승인 대기 중"
                        : "접수됨 · 본사 승인 대기 중"}
                    </p>
                    <p className="text-xs text-amber-700">희망 날짜: {chosenDates.join(", ") || "미정"}</p>
                  </div>
                </div>
                <button type="button" onClick={pollStatus} className="rounded-xl border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary-light">
                  ↻ 진행 상태 새로고침
                </button>
                <p className="text-center text-[11px] text-gray-400">승인이 진행되면 자동으로 갱신됩니다.</p>
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
              <button type="button" onClick={() => { setStep(1); setStatus("none"); setConfirmedDate(null); setRequestId(null); setRemoteStatus("요청"); }} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
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
