"use client";

// 공통 상단 바 — 역할별 브랜드 표시 + 로그아웃
// 화이트라벨 원칙: patient 화면에는 KMTP를 드러내지 않고 중립 브랜드를 씁니다.
import type { Account, Role } from "@/lib/auth";

// 역할별 브랜드 표기
const BRAND: Record<Role, { mark: string; name: string; sub: string }> = {
  // 환자: 화이트라벨(중립 브랜드) — KMTP 미노출
  patient: { mark: "C", name: "Care Journey", sub: "안심 의료 여정" },
  // 에이전트/병원: KMTP 파트너 콘솔 (B2B)
  agent: { mark: "K", name: "KMTP 파트너 콘솔", sub: "에이전트" },
  hospital: { mark: "K", name: "KMTP 파트너 콘솔", sub: "병원" },
};

type Props = {
  account: Account;
  onLogout: () => void;
  right?: React.ReactNode; // 우측에 추가로 넣을 요소 (예: 현재 선택 요약)
};

export default function TopBar({ account, onLogout, right }: Props) {
  const brand = BRAND[account.role];
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
            {brand.mark}
          </span>
          <span className="text-lg font-black tracking-tight text-primary-dark">
            {brand.name}
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            {brand.sub}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {right}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
