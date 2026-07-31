"use client";

// 전 화면 상시 WhatsApp 상담 진입(FAB) — 언니가이드 벤치마크(상담 상시화).
// 응답시간 문구는 허위 방지 위해 표기하지 않음(실측 후 별도 반영).
import { COORDINATOR } from "@/lib/services";

export default function WhatsAppFab() {
  const href = `${COORDINATOR.whatsapp}?text=${encodeURIComponent("KMTP 상담 문의드립니다.")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp 상담"
      style={{
        position: "fixed",
        right: 16,
        bottom: 84,
        zIndex: 9998,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#22c55e",
        color: "#fff",
        borderRadius: 999,
        padding: "12px 16px",
        fontWeight: 800,
        fontSize: 14,
        textDecoration: "none",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ fontSize: 18 }}>💬</span>
      <span>상담 · Chat</span>
    </a>
  );
}
