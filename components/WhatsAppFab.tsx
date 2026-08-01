"use client";

// 접이식 상담 버튼 — 평소엔 작은 동그란 버튼만, 누르면 상담(WhatsApp) 옵션이 열림.
// (항상 펼쳐진 배너가 거슬린다는 피드백 반영: '상담' 버튼을 눌러야 나오게)
import { useState } from "react";
import { COORDINATOR } from "@/lib/services";

export default function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const href = `${COORDINATOR.whatsapp}?text=${encodeURIComponent("KMTP 상담 문의드립니다.")}`;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {open && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
            padding: 14,
            width: 232,
            border: "1px solid #eee",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0F766E", marginBottom: 8 }}>
            상담이 필요하세요?
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#22c55e",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 800,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            💬 WhatsApp 상담하기
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "상담 닫기" : "상담 열기"}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open ? "#374151" : "#22c55e",
          color: "#fff",
          border: "none",
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
