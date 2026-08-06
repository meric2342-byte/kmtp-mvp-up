"use client";

// 공통 상단 바 — 역할별 브랜드 표시 + 로그아웃
// 화이트라벨 원칙: patient 화면에는 KMTP를 드러내지 않고 중립 브랜드를 씁니다.
import type { Account, Role } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";

// 역할별 브랜드 표기
const BRAND: Record<Role, { mark: string; name: string; sub: string }> = {
  // 환자: 화이트라벨(중립 브랜드) — KMTP 미노출
  patient: { mark: "C", name: "Care Journey", sub: "안심 의료 여정" },
  // 에이전트/병원: KMTP 파트너 콘솔 (B2B)
  agent: { mark: "K", name: "KMTP 파트너 콘솔", sub: "에이전트" },
  hospital: { mark: "K", name: "KMTP 파트너 콘솔", sub: "병원" },
  admin: { mark: "K", name: "KMTP 관리자 콘솔", sub: "관리자" },
};

type Props = {
  account: Account;
  onLogout: () => void;
  right?: React.ReactNode; // 우측에 추가로 넣을 요소 (예: 현재 선택 요약)
};

export default function TopBar({ account, onLogout, right }: Props) {
  const brand = BRAND[account.role];
  return (
    <header className="accent-topline sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-black text-white ring-1 ring-gold/50">
            {brand.mark}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-white" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-black tracking-tight text-primary-dark">
              {brand.name}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
              {brand.sub}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {right}
          <NotificationBell
            role={account.role}
            patientId={account.role === "patient" ? account.id : undefined}
          />
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-primary/30 hover:text-primary-dark"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
