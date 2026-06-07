"use client";

// 병원(hospital) 영역 — 골격
// 작업 4·5에서 예약 환자 도착 상태 / 진료 일정이 채워집니다.
import type { Account } from "@/lib/auth";
import TopBar from "@/components/TopBar";

type Props = {
  account: Account;
  onLogout: () => void;
};

export default function HospitalApp({ account, onLogout }: Props) {
  return (
    <div className="min-h-full">
      <TopBar account={account} onLogout={onLogout} />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          예약 환자 관리
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {account.sub} · 예약 환자의 도착 상태와 진료 일정을 확인합니다.
        </p>

        <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-400">
            예약 환자 도착 상태 · 진료 일정이 곧 표시됩니다.
            <br />
            (다음 작업에서 채워집니다 — 에이전트·수수료는 표시되지 않습니다)
          </p>
        </div>
      </main>
    </div>
  );
}
