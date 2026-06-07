"use client";

// 에이전트(agent, 유치업자) 영역
// 담당 환자들의 현재 단계 목록. 견적·수수료는 표시하지 않습니다.
import type { Account } from "@/lib/auth";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import TopBar from "@/components/TopBar";
import PatientCard from "@/components/PatientCard";
import BackendNotice from "@/components/BackendNotice";

type Props = {
  account: Account;
  onLogout: () => void;
};

export default function AgentApp({ account, onLogout }: Props) {
  // 이 에이전트가 담당하는 환자만
  const patients = useAsync(
    () => api.patients({ agent_id: account.id }),
    [account.id],
  );

  return (
    <div className="min-h-full">
      <TopBar account={account} onLogout={onLogout} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          담당 환자 관리
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {account.sub} · 담당 환자들의 여정을 한눈에 관리합니다.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <BackendNotice
            loading={patients.loading}
            error={patients.error}
            onRetry={patients.reload}
          />
          {patients.data?.length === 0 && (
            <p className="text-sm text-gray-400">담당 환자가 없습니다.</p>
          )}
          {patients.data?.map((p) => (
            <PatientCard key={p.id} patient={p} role="agent" />
          ))}
        </div>
      </main>
    </div>
  );
}
