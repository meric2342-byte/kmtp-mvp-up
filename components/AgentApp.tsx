"use client";

// 에이전트(agent, 유치업자) 영역 — 골격
// 작업 4·5에서 담당 환자 여정 목록 / 픽업 진행 현황이 채워집니다.
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";

type Props = {
  account: Account;
  onLogout: () => void;
};

export default function AgentApp({ account, onLogout }: Props) {
  return (
    <div className="min-h-full">
      <TopBar account={account} onLogout={onLogout} />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          담당 환자 관리
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {account.sub} · 담당 환자들의 여정과 픽업을 한눈에 관리합니다.
        </p>

        <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-400">
            담당 환자 여정 목록 · 픽업 진행 현황이 곧 표시됩니다.
            <br />
            (다음 작업에서 채워집니다 — 견적·수수료는 표시되지 않습니다)
          </p>
        </div>
      </main>
    </div>
  );
}
