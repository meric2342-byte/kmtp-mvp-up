"use client";

// KMTP — 진입점: 로그인 여부 / 역할에 따라 화면을 분기합니다.
// - 로그인 전: 역할 선택 로그인 화면
// - patient: 견적·예약·신뢰 흐름 (+ 여정 추적 예정)
// - agent:   담당 환자 관리
// - hospital: 예약 환자 관리
import { useState } from "react";
import type { Account } from "@/lib/auth";
import Intro from "@/components/Intro";
import Login from "@/components/Login";
import PatientApp from "@/components/PatientApp";
import AgentApp from "@/components/AgentApp";
import HospitalApp from "@/components/HospitalApp";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  // 공통 첫 화면 (인트로/랜딩)
  if (!entered) {
    return <Intro onStart={() => setEntered(true)} />;
  }

  // 로그인 전
  if (!account) {
    return <Login onLogin={setAccount} />;
  }

  // 로그인 후 — 역할별 화면
  const logout = () => setAccount(null);
  switch (account.role) {
    case "patient":
      return <PatientApp account={account} onLogout={logout} />;
    case "agent":
      return <AgentApp account={account} onLogout={logout} />;
    case "hospital":
      return <HospitalApp account={account} onLogout={logout} />;
  }
}
