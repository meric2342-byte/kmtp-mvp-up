"use client";

// 로그인 화면 — 아이디 + 비밀번호 (데모)
// 아이디: patient / agent / hospital, 비밀번호: 0000
import { useState } from "react";
import { authenticate, type Account } from "@/lib/auth";

type Props = {
  onLogin: (account: Account) => void;
};

export default function Login({ onLogin }: Props) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = authenticate(loginId, password);
    if (!account) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    setError(null);
    onLogin(account);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-12">
      {/* 브랜드 */}
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">
          K
        </span>
        <h1 className="text-2xl font-black tracking-tight text-primary-dark">
          KMTP 신뢰 운영 콘솔
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">로그인</p>
      </div>

      {/* 로그인 폼 */}
      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            아이디
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="patient / agent / hospital"
            autoComplete="username"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            autoComplete="current-password"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-1 rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark"
        >
          로그인
        </button>
      </form>

      {/* 데모 안내 */}
      <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <p className="font-semibold text-gray-600">데모 계정</p>
        <p className="mt-1">
          아이디: <code className="rounded bg-white px-1">patient</code> ·{" "}
          <code className="rounded bg-white px-1">agent</code> ·{" "}
          <code className="rounded bg-white px-1">hospital</code>
        </p>
        <p className="mt-0.5">
          비밀번호: <code className="rounded bg-white px-1">0000</code> (공통)
        </p>
      </div>
    </div>
  );
}
