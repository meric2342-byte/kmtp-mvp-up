"use client";

// 카카오톡 스타일 메시지 화면 (말풍선 UI)
// 각 상황(여정 단계·픽업)마다 자동 생성된 메시지를 카톡처럼 보여줍니다.
// - sender === "나" : 오른쪽 노란 말풍선(본인 발신)
// - 그 외          : 왼쪽 흰 말풍선(상대 발신, 보낸이 이름 표시)
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/auth";
import { api, type Notification } from "@/lib/api";

type Props = {
  role: Role;
  patientId?: string; // 환자: 본인 대화. 미지정(agent/hospital): 담당 전체
  allowSend?: boolean; // 환자만 기사에게 전송 가능
  showPatientLabel?: boolean; // agent/hospital: 어느 환자 메시지인지 표시
};

function hhmm(iso: string): string {
  const t = (iso.split("T")[1] ?? "").slice(0, 5);
  return t;
}

function avatar(sender: string | null): string {
  if (!sender) return "🩺";
  if (sender.includes("기사")) return "🚗";
  if (sender.includes("병원")) return "🏥";
  return "🩺";
}

export default function KakaoChat({
  role,
  patientId,
  allowSend = false,
  showPatientLabel = false,
}: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const params: { recipient_role: Role; patient_id?: string } = {
        recipient_role: role,
      };
      if (patientId) params.patient_id = patientId;
      const data = await api.notifications(params);
      // 오래된 메시지가 위로 (오름차순)
      setItems([...data].sort((a, b) => a.id - b.id));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  };

  // 최초 + 5초 폴링
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, patientId]);

  // 새 메시지 오면 맨 아래로 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || !patientId) return;
    setSending(true);
    try {
      await api.sendDriverMessage(patientId, content);
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center gap-2 bg-[#a3b8cc] px-4 py-3">
        <span className="text-lg">💬</span>
        <span className="text-sm font-bold text-gray-800">
          {allowSend ? "기사님 · KMTP 케어" : "메시지"}
        </span>
      </div>

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className="flex max-h-[420px] min-h-[320px] flex-col gap-3 overflow-y-auto bg-[#b2c7d9] px-3 py-4"
      >
        {!loaded && (
          <p className="m-auto text-sm text-gray-600">불러오는 중…</p>
        )}
        {loaded && error && (
          <p className="m-auto text-center text-sm text-gray-700">
            메시지를 불러올 수 없어요.
            <br />
            (백엔드 연결 확인)
          </p>
        )}
        {loaded && !error && items.length === 0 && (
          <p className="m-auto text-sm text-gray-600">아직 메시지가 없어요.</p>
        )}

        {items.map((m) => {
          const mine = m.sender === "나";
          if (mine) {
            // 오른쪽 노란 말풍선
            return (
              <div key={m.id} className="flex items-end justify-end gap-1.5">
                <span className="mb-0.5 text-[10px] text-gray-600">
                  {hhmm(m.sent_at)}
                </span>
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#fee500] px-3 py-2 text-sm text-gray-900">
                  {m.content}
                </div>
              </div>
            );
          }
          // 왼쪽 흰 말풍선 (보낸이 표시)
          return (
            <div key={m.id} className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-lg">
                {avatar(m.sender)}
              </span>
              <div className="max-w-[78%]">
                <p className="mb-1 text-xs text-gray-700">
                  {m.sender ?? "KMTP 케어"}
                  {showPatientLabel && (
                    <span className="ml-1 text-gray-500">· {m.patient_id}</span>
                  )}
                </p>
                <div className="flex items-end gap-1.5">
                  <div className="max-w-full rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-gray-900">
                    {m.content}
                  </div>
                  <span className="mb-0.5 shrink-0 text-[10px] text-gray-600">
                    {hhmm(m.sent_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력창 (환자만) */}
      {allowSend && (
        <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="기사님에게 메시지 보내기…"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className="rounded-full bg-[#fee500] px-4 py-2 text-sm font-bold text-gray-900 disabled:opacity-50"
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
}
