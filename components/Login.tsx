"use client";

// 로그인 / 환자 회원가입 화면
// - 로그인: 아이디 + 비밀번호 (데모: patient/agent/hospital/admin · 0000)
// - 회원가입: 환자만 셀프 가입 가능 (에이전트·병원은 관리자만 추가)
import { useState } from "react";
import { authenticate, type Account } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  NATIONALITIES,
  saveProfile,
  fullName,
  EMPTY_PROFILE,
  type PatientProfile,
} from "@/lib/profile";

type Props = {
  onLogin: (account: Account, password: string) => void;
};

type Mode = "login" | "signup";

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>("login");

  // 로그인 입력
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // 회원가입 입력 (환자) — 아이디/비번 + b2b 수준 프로필
  const [suId, setSuId] = useState("");
  const [suPw, setSuPw] = useState("");
  const [profile, setProfile] = useState<PatientProfile>({ ...EMPTY_PROFILE });
  const setP = (field: keyof PatientProfile, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const account = await authenticate(loginId, password);
    setBusy(false);
    if (!account) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    onLogin(account, password);
  };

  const doSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const name = fullName(profile);
      // 인증/여정 계정은 Render(mvp) 백엔드에 생성 — name/국적/진료과만 저장
      const acc = await api.auth.registerPatient({
        login_id: suId,
        password: suPw,
        name: name || undefined,
        nationality: profile.nationality || undefined,
        department: profile.department || undefined,
      });
      // 여권 등 상세 프로필은 로컬에 보관 → 검진·부가서비스 요청 시 b2b로 함께 전달
      saveProfile(profile);
      onLogin(
        {
          id: acc.id,
          loginId: acc.loginId,
          role: "patient",
          name: acc.name,
          sub: acc.sub,
        },
        suPw,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-12">
      {/* 브랜드 */}
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">
          K
        </span>
        <h1 className="text-2xl font-black tracking-tight text-primary-dark">
          KMTP 환자 앱
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {mode === "login" ? "로그인" : "환자 회원가입"}
        </p>
      </div>

      {mode === "login" ? (
        <form
          onSubmit={doLogin}
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
              placeholder="아이디"
              autoComplete="username"
              className={inputCls}
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
              className={inputCls}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300"
          >
            {busy ? "확인 중…" : "로그인"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className="text-center text-sm font-semibold text-primary hover:underline"
          >
            환자 회원가입 →
          </button>
        </form>
      ) : (
        <form
          onSubmit={doSignup}
          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              아이디 *
            </label>
            <input
              type="text"
              value={suId}
              onChange={(e) => setSuId(e.target.value)}
              placeholder="사용할 아이디"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              비밀번호 * (4자 이상)
            </label>
            <input
              type="password"
              value={suPw}
              onChange={(e) => setSuPw(e.target.value)}
              placeholder="••••"
              className={inputCls}
            />
          </div>
          {/* 성명 분리 (여권 영문 표기) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                성 (Surname)
              </label>
              <input
                type="text"
                value={profile.surname}
                onChange={(e) => setP("surname", e.target.value)}
                placeholder="예: NGUYEN"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                이름 (Given Name)
              </label>
              <input
                type="text"
                value={profile.givenName}
                onChange={(e) => setP("givenName", e.target.value)}
                placeholder="예: VAN AN"
                className={inputCls}
              />
            </div>
          </div>

          {/* 국적 드롭다운 */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              국적
            </label>
            <select
              value={profile.nationality}
              onChange={(e) => setP("nationality", e.target.value)}
              className={inputCls}
            >
              <option value="">국적 선택 (선택)</option>
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* 여권 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                여권번호
              </label>
              <input
                type="text"
                value={profile.passportNumber}
                onChange={(e) => setP("passportNumber", e.target.value)}
                placeholder="예: C1234567"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                여권 만료일
              </label>
              <input
                type="date"
                value={profile.passportExpiry}
                onChange={(e) => setP("passportExpiry", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* 진료과 (자유입력) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              진료과 (복수 입력 가능)
            </label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => setP("department", e.target.value)}
              placeholder="예: 건강검진, 치과, 피부과"
              className={inputCls}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-300"
          >
            {busy ? "가입 중…" : "회원가입하고 시작하기"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className="text-center text-sm font-semibold text-gray-500 hover:underline"
          >
            ← 로그인으로
          </button>
        </form>
      )}

      {/* 데모 안내 */}
      {mode === "login" && (
        <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-600">데모 계정 (비번 0000)</p>
          <p className="mt-1">
            <code className="rounded bg-white px-1">patient</code>
          </p>
          <p className="mt-1 text-gray-400">
            ※ 환자 전용 앱입니다. 운영자는 별도 운영 콘솔을 이용하세요.
          </p>
        </div>
      )}
    </div>
  );
}
