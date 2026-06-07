"use client";

// 역할 선택 로그인 화면 (공통) — 복잡한 인증 없이 mock 계정 선택
import { MOCK_ACCOUNTS, ROLE_META, type Account } from "@/lib/auth";

type Props = {
  onLogin: (account: Account) => void;
};

export default function Login({ onLogin }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-12">
      {/* 브랜드 */}
      <div className="mb-10 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">
          K
        </span>
        <h1 className="text-2xl font-black tracking-tight text-primary-dark">
          KMTP 신뢰 운영 콘솔
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          역할을 선택해 로그인하세요 (데모 계정)
        </p>
      </div>

      {/* 역할 카드 */}
      <div className="flex flex-col gap-3">
        {MOCK_ACCOUNTS.map((acc) => {
          const meta = ROLE_META[acc.role];
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onLogin(acc)}
              className={`flex items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition-all hover:bg-primary-light/40 ${meta.tone}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">
                {meta.icon}
              </span>
              <span className="flex-1">
                <span className="block text-base font-bold text-gray-800">
                  {meta.label}
                </span>
                <span className="block text-xs text-gray-500">{meta.desc}</span>
              </span>
              <span className="text-sm font-bold text-primary">로그인 →</span>
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        ※ 데모용 mock 로그인입니다. 비밀번호 없이 역할별 화면을 체험할 수 있어요.
      </p>
    </div>
  );
}
