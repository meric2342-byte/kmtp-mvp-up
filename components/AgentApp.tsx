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

        {/* KMTP의 유치업자 지원 + 마이크로 MSO */}
        <AgentSupport />
      </main>
    </div>
  );
}

const MSO_SERVICES = [
  { icon: "🚐", label: "차량·공항 픽업" },
  { icon: "🏨", label: "숙소·회복스테이" },
  { icon: "🗓️", label: "일정 관리" },
  { icon: "🗣️", label: "통역" },
  { icon: "📞", label: "고객 응대" },
];

function AgentSupport() {
  return (
    <section className="mt-10 flex flex-col gap-4">
      {/* 지원 메시지 */}
      <div className="rounded-2xl bg-primary px-6 py-5 text-white">
        <h3 className="text-lg font-black">
          KMTP는 유치사업자와 경쟁하지 않고, 지원합니다
        </h3>
        <p className="mt-1.5 text-sm opacity-90">
          영업·상담은 유치사업자가, 복잡한 운영은 공동 운영센터가 — 각자 가장
          잘하는 일에 집중합니다.
        </p>
      </div>

      {/* 마이크로 MSO */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <p className="text-sm font-bold text-gray-800">
          마이크로 MSO — 공동 운영센터가 대신 처리
        </p>
        <p className="mt-1 text-xs text-gray-500">
          차량·공항 픽업·숙소·일정·통역·고객 응대를 KMTP 운영센터가 맡아, 유치사업자는
          환자 영업·상담에 집중할 수 있습니다.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MSO_SERVICES.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 px-2 py-3 text-center"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[11px] font-semibold text-gray-600">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 인큐베이팅 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
        <p className="text-sm font-bold text-amber-800">
          🌱 신생 유치사업자 인큐베이팅
        </p>
        <p className="mt-1 text-xs text-amber-900/80">
          설립 1~3년차 신생 유치사업자가 빠르게 자리잡도록 운영 인프라·신뢰
          시스템을 함께 제공합니다.
        </p>
      </div>
    </section>
  );
}
