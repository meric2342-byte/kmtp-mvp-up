"use client";

// 인트로/랜딩 — 로그인 전 공통 첫 화면 (역할 무관)
// 신뢰 운영체계 메시지 + No-Surprise 지표 + 신뢰 3모듈
type Props = {
  onStart: () => void;
  onAbout: () => void;
};

const TRUST_MODULES = [
  {
    icon: "🔒",
    title: "가격잠금",
    desc: "예약 시점 가격을 잠가 입국 후에도 그대로",
  },
  {
    icon: "🔄",
    title: "슬롯동기화",
    desc: "병원 예약 슬롯을 실시간 동기화해 노쇼·중복 방지",
  },
  {
    icon: "🛡️",
    title: "검증후기",
    desc: "결제·시술이 확인된 환자만 작성하는 진짜 후기",
  },
];

export default function Intro({ onStart, onAbout }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-5 py-14">
      {/* 핵심 지표 배지 */}
      <div className="mb-6 flex justify-center">
        <span className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-bold text-primary-dark">
          No-Surprise 거래율 95% — 예약 시점 가격·조건이 입국 후에도 그대로
        </span>
      </div>

      {/* 큰 제목 */}
      <h1 className="text-center text-2xl font-black leading-snug tracking-tight text-primary-dark sm:text-3xl">
        병원을 소개하는 곳이 아니라,
        <br />
        외국인 환자의 한국 의료 여정을
        <br />
        <span className="text-primary">신뢰 가능하게 연결하는</span> 신뢰
        운영체계
      </h1>

      <p className="mt-4 text-center text-sm text-gray-500">
        가격잠금 견적부터 에스크로 결제, 검증된 후기, 실시간 여정 추적까지 —
        안심하고 받는 한국 의료관광.
      </p>

      {/* 신뢰 3모듈 */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TRUST_MODULES.map((m) => (
          <div
            key={m.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 text-center"
          >
            <span className="text-3xl">{m.icon}</span>
            <p className="mt-2 text-base font-bold text-gray-800">{m.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 시작하기 / 이해관계자 맵 */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-primary px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-primary-dark"
        >
          시작하기 →
        </button>
        <button
          type="button"
          onClick={onAbout}
          className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          이 플랫폼은 누구를 연결하나? (이해관계자 맵)
        </button>
      </div>
    </div>
  );
}
