"use client";

// 인트로/랜딩 — 리디자인된 다크 히어로 + 신뢰 지표 + 병원 쇼케이스
import { useState, useEffect } from "react";

type Props = {
  onStart: () => void;
};

const STATS = [
  { value: "95%", label: "No-Surprise 거래율" },
  { value: "10개", label: "협력병원" },
  { value: "5성급", label: "협력호텔" },
  { value: "실시간", label: "여정 추적" },
];

const FEATURED_HOSPITALS = [
  { emoji: "🏥", name: "서울아산병원" },
  { emoji: "🏛️", name: "서울대학교병원" },
  { emoji: "🏥", name: "신촌 세브란스" },
  { emoji: "🏥", name: "삼성서울병원" },
  { emoji: "🏥", name: "서울성모병원" },
  { emoji: "🔬", name: "KMI 연구소" },
];

const FEATURE_CARDS = [
  {
    icon: "🔒",
    title: "가격잠금",
    desc: "예약 시점에 가격을 잠가 입국 후에도 동일한 금액으로 청구됩니다. 숨겨진 추가 비용 없음.",
  },
  {
    icon: "🛡️",
    title: "에스크로 결제",
    desc: "치료 완료가 확인될 때까지 결제금이 KMTP에 안전하게 보관됩니다. 분쟁 시 환불 보호.",
  },
  {
    icon: "📍",
    title: "실시간 여정",
    desc: "입국부터 출국까지 픽업·병원 일정·회복까지 한눈에 추적합니다.",
  },
];

export default function Intro({ onStart }: Props) {
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    setHasDraft(!!localStorage.getItem("kmtp_case_draft"));
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      {/* 이전 견적 이어가기 배너 */}
      {hasDraft && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-semibold">
            이전에 작성하신 견적이 있습니다 — 이어서 진행하시겠어요?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onStart}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
            >
              이어가기
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("kmtp_case_draft");
                setHasDraft(false);
              }}
              className="rounded-lg border border-amber-300 px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              새로 시작
            </button>
          </div>
        </div>
      )}

      {/* 다크 히어로 섹션 */}
      <section
        className="flex flex-col items-center justify-center px-5 py-20 text-center"
        style={{ background: "linear-gradient(135deg, #12525a 0%, #1f6f78 60%, #2a8a95 100%)" }}
      >
        {/* 신뢰 배지 */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          No-Surprise 거래율 95% 달성
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          한국 의료관광,
          <br />
          <span className="text-emerald-300">믿을 수 있게</span> 시작하세요
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          가격잠금 견적 · 에스크로 결제 · 실시간 여정 추적으로
          <br className="hidden sm:block" />
          예상치 못한 비용 걱정 없이 한국 의료를 경험하세요.
        </p>

        {/* 통계 행 */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm"
            >
              <span className="text-2xl font-black text-white sm:text-3xl">{s.value}</span>
              <span className="mt-1 text-xs font-medium text-white/70">{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA 버튼 */}
        <button
          type="button"
          onClick={onStart}
          className="mt-10 rounded-2xl bg-white px-12 py-4 text-lg font-black text-primary-dark shadow-lg transition-all hover:bg-primary-light hover:shadow-xl"
        >
          지금 예약 시작하기 →
        </button>

        {/* 협력병원 쇼케이스 */}
        <div className="mt-10 w-full max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            협력 병원
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED_HOSPITALS.map((h) => (
              <span
                key={h.name}
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                {h.emoji} {h.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 카드 3개 */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <h2 className="mb-8 text-center text-xl font-black text-primary-dark sm:text-2xl">
          왜 KMTP인가요?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="text-4xl">{c.icon}</span>
              <h3 className="mt-4 text-base font-bold text-gray-800">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 문의 채널 */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-500">
        <p className="font-semibold text-gray-700">문의 채널</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/821012345678?text=KMTP%20문의드립니다"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600"
          >
            📱 WhatsApp 문의
          </a>
          <a
            href="https://open.kakao.com/o/kmtp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-800 transition-colors hover:bg-yellow-500"
          >
            💬 카카오톡 문의
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          WhatsApp · KakaoTalk · 한국어·영어·중국어 지원
        </p>
      </footer>
    </div>
  );
}
