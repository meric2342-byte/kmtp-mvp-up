"use client";

// 인앱 알림 벨 — 역할별 알림을 주기적으로 가져와 표시 (배지 + 드롭다운)
// 실제 카톡/문자가 아니라 '앱 안에서 뜨는 알림' 시뮬레이션
import { useCallback, useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/auth";
import { api, type Notification } from "@/lib/api";

type Props = {
  role: Role;
  patientId?: string; // patient는 본인 알림만
};

// 새 알림 도착 시 짧은 비프음(브라우저 자동재생 정책상 사용자 상호작용 이후 확실히 울림).
function beep() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.start(t); o.stop(t + 0.36);
    o.onended = () => ctx.close().catch(() => {});
  } catch { /* noop */ }
}

export default function NotificationBell({ role, patientId }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const seenMaxId = useRef<number>(-1);

  const load = useCallback(async () => {
    try {
      const params: { recipient_role: Role; patient_id?: string } = { recipient_role: role };
      if (patientId) params.patient_id = patientId;
      const data = await api.notifications(params);
      setItems(data);
      // 신규 알림 감지 → 소리로 '울림'(최초 로드는 기준값만 설정)
      const maxId = data.reduce((m, n) => (n.id > m ? n.id : m), -1);
      if (seenMaxId.current < 0) {
        seenMaxId.current = maxId;
      } else if (maxId > seenMaxId.current) {
        const hasUnread = data.some((n) => n.id > seenMaxId.current && !n.read);
        seenMaxId.current = maxId;
        if (hasUnread) beep();
      }
    } catch {
      // 백엔드 미연결 시 조용히 무시 (다른 곳에서 안내)
    }
  }, [role, patientId]);

  // 최초 + 5초마다 폴링(숨겨진 탭에서도 소리 알림 유지)
  useEffect(() => {
    seenMaxId.current = -1;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

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
