"use client";

// KMTP 환자 앱 — 환자 전용.
// 운영자(에이전시·병원·관리자)는 별도 운영 콘솔(kmtp-b2b)을 사용합니다.
import { useState } from "react";
import type { Account } from "@/lib/auth";
import Intro from "@/components/Intro";
import About from "@/components/About";
import Login from "@/components/Login";
import PatientApp from "@/components/PatientApp";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  // 이해관계자 맵 (인트로에서 진입)
  if (showAbout) {
    return <About onBack={() => setShowAbout(false)} />;
  }

  // 첫 화면 (인트로/랜딩)
  if (!entered) {
    return (
      <Intro
        onStart={() => setEntered(true)}
        onAbout={() => setShowAbout(true)}
      />
    );
  }

  // 로그인 전
  if (!account) {
    return <Login onLogin={(acc) => setAccount(acc)} />;
  }

  const logout = () => setAccount(null);

  // 환자 전용 — 운영자 계정으로 들어오면 안내만
  if (account.role !== "patient") {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">
          K
        </span>
        <h1 className="text-xl font-black text-primary-dark">환자 전용 앱입니다</h1>
        <p className="text-sm text-gray-500">
          에이전시·병원·운영자는 별도 운영 콘솔(관리 사이트)을 이용해 주세요.
        </p>
        <button
          onClick={logout}
          className="mt-2 rounded-xl border-2 border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 hover:border-primary/40"
        >
          ← 로그아웃
        </button>
      </div>
    );
  }

  return <PatientApp account={account} onLogout={logout} />;
}
