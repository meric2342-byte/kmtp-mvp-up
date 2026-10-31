"use client";

// 인트로/랜딩 — 리디자인 2차 (깊은 틸 + 골드 · 프리미엄 헬스·트래블)
// 화이트라벨 원칙: 환자 화면이므로 KMTP 대신 중립 브랜드(Care Journey)만 노출합니다.
import { useState, useEffect } from "react";

type Props = {
  onStart: () => void;
};

const STATS = [
  { value: "95%", label: "No-Surprise 거래율" },
  { value: "10", unit: "곳", label: "협력 병원" },
  { value: "5", unit: "성급", label: "협력 호텔" },
  { value: "24/7", label: "실시간 여정 안내" },
];

const FEATURED_HOSPITALS = [
  "서울아산병원",
  "서울대학교병원",
  "신촌 세브란스",
  "삼성서울병원",
  "서울성모병원",
  "KMI 연구소",
];

type IconName = "lock" | "shield" | "route";

const FEATURE_CARDS: { icon: IconName; title: string; en: string; desc: string }[] = [
  {
    icon: "lock",
    title: "가격잠금",
    en: "Price Lock",
    desc: "예약 시점에 가격을 잠가 입국 후에도 동일한 금액으로 청구됩니다. 숨겨진 추가 비용이 없습니다.",
  },
  {
    icon: "shield",
    title: "에스크로 결제",
    en: "Escrow",
    desc: "치료 완료가 확인될 때까지 결제금이 제3자 에스크로 계정에 안전하게 보관됩니다. 분쟁 시 환불을 보호합니다.",
  },
  {
    icon: "route",
    title: "실시간 여정",
    en: "Live Journey",
    desc: "입국부터 출국까지 픽업·병원 일정·통역·회복을 한 화면에서 추적합니다.",
  },
];

const PROCESS = [
  { n: "01", title: "시술·일정 선택", desc: "병원과 시술, 희망 날짜를 고릅니다." },
  { n: "02", title: "확정 견적 수령", desc: "병원이 검토한 가격잠금 견적을 받습니다." },
  { n: "03", title: "에스크로 예치", desc: "결제금은 치료 완료 시까지 보호됩니다." },
  { n: "04", title: "한국에서 케어", desc: "픽업부터 출국까지 실시간으로 안내합니다." },
];

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "lock")
    return (
      <svg {...common}>
        <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        <path d="M12 14.5v2.5" />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...common}>
        <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6L12 3z" />
        <path d="M8.8 12.2l2.3 2.3 4.2-4.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
    </svg>
  );
}

export default function Intro({ onStart }: Props) {
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    setHasDraft(!!localStorage.getItem("kmtp_case_draft"));
  }, []);

  const scrollToProcess = () =>
    document.getElementById("process")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-full flex-col">
      {/* 이전 견적 이어가기 배너 */}
      {hasDraft && (
        <div className="border-b border-gold/30 bg-gold-light/70 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              작성 중이던 견적이 있습니다 — 이어서 진행하시겠어요?
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={onStart}
                className="btn-gold px-4 py-1.5 text-xs"
              >
                이어가기
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("kmtp_case_draft");
                  setHasDraft(false);
                }}
                className="rounded-[0.9rem] border border-gold/40 bg-white/60 px-4 py-1.5 text-xs font-semibold text-gold-dark transition-colors hover:bg-white"
              >
                새로 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 히어로 ───────────────────────────────────────── */}
      <section className="hero-lux relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        {/* 골드 오브 장식 */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-gold/20" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-gold/15" />

        {/* 브랜드 바 */}
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white ring-1 ring-gold/50">
              C
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-black tracking-tight text-white">Care Journey</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                안심 의료 여정
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:border-gold/60 hover:text-white"
          >
            로그인
          </button>
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          {/* 아이브로 */}
          <div className="animate-fade-up glass-dark inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-light">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            Premium Medical Travel · Korea
          </div>

          {/* 헤드라인 */}
          <h1
            className="animate-fade-up mt-7 max-w-2xl text-[2rem] font-black leading-[1.18] text-white sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            한국 의료관광,
            <br />
            <span className="text-gold-gradient">믿을 수 있게</span> 시작하세요
          </h1>

          <p
            className="animate-fade-up mt-5 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            가격잠금 견적 · 에스크로 결제 · 실시간 여정 추적으로
            <br className="hidden sm:block" />
            예상치 못한 비용 걱정 없이 한국 의료를 경험하세요.
          </p>

          {/* CTA */}
          <div
            className="animate-fade-up mt-9 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <button
              type="button"
              onClick={onStart}
              className="btn-gold px-10 py-4 text-base"
            >
              지금 예약 시작하기 →
            </button>
            <button
              type="button"
              onClick={scrollToProcess}
              className="rounded-[0.9rem] border border-white/25 px-8 py-4 text-base font-bold text-white transition-colors hover:border-gold/60 hover:bg-white/5"
            >
              진행 과정 보기
            </button>
          </div>

          {/* 통계 */}
          <dl
            className="animate-fade-up glass-dark mt-12 grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-4"
            style={{ animationDelay: "320ms" }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center px-4 py-5 ${
                  i % 2 === 1 ? "border-l border-white/10" : ""
                } ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${
                  i === 2 ? "sm:border-l" : ""
                }`}
              >
                <dt className="order-2 mt-1 text-[11px] font-medium text-white/60">{s.label}</dt>
                <dd className="order-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {s.value}
                  {s.unit && <span className="ml-0.5 text-base font-bold text-gold">{s.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 협력 병원 스트립 */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-5 sm:flex-row sm:justify-between">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              Partner Hospitals
            </p>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 sm:justify-end">
              {FEATURED_HOSPITALS.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <span className="h-1 w-1 rounded-full bg-gold/70" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 핵심 가치 ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-dark">
            Why Care Journey
          </p>
          <h2 className="mt-2 text-2xl font-black text-primary-dark sm:text-3xl">
            비용도, 일정도 — 예상한 그대로
          </h2>
          <div className="gold-rule mx-auto mt-5 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((c) => (
            <article
              key={c.title}
              className="card-premium group flex flex-col p-6 transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-gold-light ring-1 ring-gold/40 transition-transform group-hover:-translate-y-0.5">
                <Icon name={c.icon} />
              </span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                {c.en}
              </p>
              <h3 className="mt-1 text-lg font-black text-ink">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{c.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 진행 과정 ─────────────────────────────────────── */}
      <section id="process" className="scroll-mt-4 border-y border-black/5 bg-white/60">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-dark">
              How It Works
            </p>
            <h2 className="mt-2 text-2xl font-black text-primary-dark sm:text-3xl">
              네 단계로 끝나는 안심 예약
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
            {PROCESS.map((p, i) => (
              <li key={p.n} className="relative flex gap-4 sm:flex-col sm:gap-0">
                {/* 연결선 (데스크톱) */}
                {i < PROCESS.length - 1 && (
                  <span className="absolute left-[calc(50%+1.75rem)] right-[calc(-50%+1.75rem)] top-6 hidden h-px bg-gradient-to-r from-gold/60 to-gold/10 sm:block" />
                )}
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-cream text-sm font-black text-gold-dark sm:mx-auto">
                  {p.n}
                </span>
                <div className="sm:mt-4 sm:text-center">
                  <h3 className="text-[15px] font-black text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{p.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={onStart}
              className="btn-primary-lux px-10 py-3.5 text-base"
            >
              무료로 견적 받아보기
            </button>
          </div>
        </div>
      </section>

      {/* ── 푸터: 문의 채널 ───────────────────────────────── */}
      <footer className="mx-auto w-full max-w-5xl px-5 py-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-dark">Contact</p>
        <p className="mt-2 text-base font-black text-primary-dark">궁금한 점은 언제든 문의하세요</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/821012345678?text=Care%20Journey%20문의드립니다"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[0.9rem] border border-black/5 bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-[var(--shadow-card)] transition-colors hover:border-[#25D366]/50"
          >
            <span className="h-2 w-2 rounded-full bg-[#25D366]" />
            WhatsApp 문의
          </a>
          <a
            href="https://open.kakao.com/o/kmtp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[0.9rem] border border-black/5 bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-[var(--shadow-card)] transition-colors hover:border-[#FEE500]"
          >
            <span className="h-2 w-2 rounded-full bg-[#FEE500] ring-1 ring-black/10" />
            카카오톡 문의
          </a>
        </div>
        <p className="mt-5 text-xs text-gray-400">한국어 · English · 中文 지원</p>
      </footer>
    </div>
  );
}
