"use client";

// 관리자(admin) 콘솔 — 에이전트/병원 계정 추가 + 전체 계정 목록
import { useState } from "react";
import type { Account } from "@/lib/auth";
import { api, type AccountRow } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import TopBar from "@/components/TopBar";
import BackendNotice from "@/components/BackendNotice";

type Props = {
  account: Account;
  adminPassword: string;
  onLogout: () => void;
};

const ROLE_LABEL: Record<string, string> = {
  patient: "환자",
  agent: "에이전트",
  hospital: "병원",
  admin: "관리자",
};

export default function AdminApp({ account, adminPassword, onLogout }: Props) {
  const accounts = useAsync(
    () => api.auth.listAccounts(account.loginId, adminPassword),
    [account.loginId, adminPassword],
  );

  // 새 계정 입력
  const [role, setRole] = useState<"agent" | "hospital">("agent");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const acc = await api.auth.adminCreateAccount({
        admin_login_id: account.loginId,
        admin_password: adminPassword,
        login_id: loginId,
        password,
        role,
        name: name || undefined,
        contact: contact || undefined,
      });
      setMsg({
        ok: true,
        text: `${ROLE_LABEL[role]} 계정 생성됨: ${acc.loginId} (${acc.id})`,
      });
      setLoginId("");
      setPassword("");
      setName("");
      setContact("");
      accounts.reload();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : "생성에 실패했습니다.",
      });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <div className="min-h-full">
      <TopBar account={account} onLogout={onLogout} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">
          계정 관리
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          에이전트·병원 계정을 생성합니다. (환자는 로그인 화면에서 직접 가입)
        </p>

        {/* 계정 생성 폼 */}
        <form
          onSubmit={create}
          className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6"
        >
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">
              역할
            </label>
            <div className="flex gap-2">
              {(["agent", "hospital"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                    role === r
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                아이디 *
              </label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="로그인 아이디"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                비밀번호 * (4자 이상)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {role === "agent" ? "에이전시명" : "병원명"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "agent" ? "예: 한빛메디투어" : "예: 서울 OO병원"}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                연락처
              </label>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="예: +82-2-000-0000 (선택)"
                className={inputCls}
              />
            </div>
          </div>

          {msg && (
            <p
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                msg.ok ? "bg-primary-light text-primary-dark" : "bg-red-50 text-red-600"
              }`}
            >
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300"
          >
            {busy ? "생성 중…" : `${ROLE_LABEL[role]} 계정 생성`}
          </button>
        </form>

        {/* 계정 목록 */}
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-bold text-gray-700">전체 계정</h3>
          <BackendNotice
            loading={accounts.loading}
            error={accounts.error}
            onRetry={accounts.reload}
          />
          {accounts.data && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">아이디</th>
                    <th className="px-4 py-2.5 font-semibold">역할</th>
                    <th className="px-4 py-2.5 font-semibold">이름</th>
                    <th className="px-4 py-2.5 font-semibold">코드</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.data.map((a: AccountRow) => (
                    <tr key={a.login_id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">
                        {a.login_id}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {ROLE_LABEL[a.role] ?? a.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{a.name}</td>
                      <td className="px-4 py-2.5 text-gray-400">{a.ref_id ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
