"use client";

// 이해관계자 맵 (About) — 공통 화면 (역할 무관)
// "이 플랫폼은 누구를 연결하나" + 신뢰 3모듈
type Props = {
  onBack: () => void;
};

const GROUPS = [
  {
    title: "수요자",
    icon: "🙋",
    tone: "bg-primary-light text-primary-dark",
    items: ["환자", "가족", "해외 에이전트", "보험사"],
  },
  {
    title: "공급자",
    icon: "🏥",
    tone: "bg-sky-50 text-sky-800",
    items: ["성형", "피부", "치과", "정형", "검진", "대학병원 국제진료센터"],
  },
  {
    title: "운영 인프라",
    icon: "⚙️",
    tone: "bg-amber-50 text-amber-800",
    items: ["회복스테이", "통역", "결제", "에스크로", "보증", "사후관리"],
  },
];

const TRUST_MODULES = [
  { icon: "🔒", title: "가격잠금", desc: "예약 시점 가격 유지" },
  { icon: "🔄", title: "슬롯동기화", desc: "실시간 예약 동기화" },
  { icon: "🛡️", title: "검증후기", desc: "확인된 환자만 작성" },
];

export default function About({ onBack }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
      >
        ← 돌아가기
      </button>

      <h1 className="text-2xl font-black tracking-tight text-primary-dark">
        이 플랫폼은 누구를 연결하나
      </h1>
      <p className="mt-1.5 text-sm text-gray-500">
        수요자와 공급자 사이의 불신을, 운영 인프라와 신뢰 모듈로 메웁니다.
      </p>

      {/* 3그룹 */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <div
            key={g.title}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{g.icon}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${g.tone}`}
              >
                {g.title}
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600"
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 신뢰 3모듈 */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-bold text-gray-700">
          그 사이 불신을 막는 신뢰 3모듈
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TRUST_MODULES.map((m) => (
            <div
              key={m.title}
              className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-white"
            >
              <span className="text-2xl">{m.icon}</span>
              <span>
                <span className="block text-sm font-bold">{m.title}</span>
                <span className="block text-xs opacity-90">{m.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
