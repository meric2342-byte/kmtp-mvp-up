"use client";

// 병원(hospital) 영역
// 예약 환자의 도착 상태·진료 일정. 에이전트·수수료는 표시하지 않습니다.
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

export default function HospitalApp({ account, onLogout }: Props) {
  // 이 병원에 예약된 환자만
  const patients = useAsync(
    () => api.patients({ hospital_id: account.id }),
    [account.id],
  );

  return (
    <div className="min-h-full">
      <TopBar account={account} onLogout={onLogout} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          예약 환자 관리
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {account.sub} · 예약 환자의 도착 상태와 진료 일정을 확인합니다.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <BackendNotice
            loading={patients.loading}
            error={patients.error}
            onRetry={patients.reload}
          />
          {patients.data?.length === 0 && (
            <p className="text-sm text-gray-400">예약 환자가 없습니다.</p>
          )}
          {patients.data?.map((p) => (
            <PatientCard key={p.id} patient={p} role="hospital" />
          ))}
        </div>
      </main>
    </div>
  );
}
