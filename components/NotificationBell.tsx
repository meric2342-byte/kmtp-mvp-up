"use client";

// 인앱 알림 벨 — 역할별 알림을 주기적으로 가져와 표시 (배지 + 드롭다운)
// 실제 카톡/문자가 아니라 '앱 안에서 뜨는 알림' 시뮬레이션
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/auth";
import { api, type Notification } from "@/lib/api";

type Props = {
  role: Role;
  patientId?: string; // patient는 본인 알림만
};

export default function NotificationBell({ role, patientId }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const params: { recipient_role: Role; patient_id?: string } = {
        recipient_role: role,
      };
      if (patientId) params.patient_id = patientId;
      setItems(await api.notifications(params));
    } catch {
      // 백엔드 미연결 시 조용히 무시 (다른 곳에서 안내)
    }
  };

  // 최초 + 5초마다 폴링
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, patientId]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id: number) => {
    await api.markRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)),
    );
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-lg hover:bg-gray-50"
        aria-label="알림"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700">
            알림 {unread > 0 && <span className="text-red-500">({unread})</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                알림이 없습니다.
              </p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && markRead(n.id)}
                className={`block w-full border-b border-gray-50 px-4 py-3 text-left last:border-0 ${
                  n.read ? "bg-white" : "bg-primary-light/40"
                }`}
              >
                <span className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className="flex-1">
                    <span className="block text-sm text-gray-700">
                      {n.content}
                    </span>
                    <span className="block text-[11px] text-gray-400">
                      {n.sent_at.replace("T", " ").slice(5, 16)}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
