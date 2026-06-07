// ============================================================
// 백엔드(FastAPI, localhost:8000) 호출 헬퍼
// 환경변수 NEXT_PUBLIC_API_BASE로 주소 변경 가능 (기본 localhost:8000)
// ============================================================

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${path} 실패: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---- 도메인 타입 (백엔드 응답) ----
export type Patient = {
  id: string;
  name: string;
  nationality: string | null;
  department: string | null;
  agent_id: string | null;
  hospital_id: string | null;
};

export type JourneyEvent = {
  id: number;
  patient_id: string;
  stage: string;
  occurred_at: string;
  note: string | null;
};

export type JourneyState = {
  patient_id: string;
  events: JourneyEvent[];
  done_stages: string[];
  current_stage: string | null;
};

export type Transfer = {
  id: number;
  patient_id: string;
  type: string;
  driver_name: string | null;
  driver_phone: string | null;
  car_number: string | null;
  pickup_scheduled: string | null;
  driver_arrived: string | null;
  boarded: string | null;
  status: string;
};

export type Notification = {
  id: number;
  patient_id: string;
  recipient_role: string;
  channel: string;
  content: string;
  sent_at: string;
  read: number;
  sender: string | null; // 보낸 사람 (카톡 UI용). "나"=본인 발신
};

export type Appointment = {
  id: number;
  patient_id: string;
  hospital_id: string;
  scheduled_at: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
};

// ---- API 함수 ----
export const api = {
  health: () => req<{ ok: boolean; time: string }>("/health"),

  patients: (params?: { agent_id?: string; hospital_id?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString();
    return req<Patient[]>(`/patients${q ? `?${q}` : ""}`);
  },
  patient: (id: string) => req<Patient>(`/patients/${id}`),

  journey: (patientId: string) => req<JourneyState>(`/journey/${patientId}`),
  addJourneyEvent: (body: { patient_id: string; stage: string; note?: string }) =>
    req<{ event_id: number; notifications: number[] }>("/journey", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transfers: (patientId?: string) =>
    req<Transfer[]>(`/transfers${patientId ? `?patient_id=${patientId}` : ""}`),
  updateTransfer: (id: number, status: string) =>
    req<Transfer>(`/transfers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  appointments: (params?: { patient_id?: string; hospital_id?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString();
    return req<Appointment[]>(`/appointments${q ? `?${q}` : ""}`);
  },

  notifications: (params?: {
    recipient_role?: string;
    patient_id?: string;
    unread_only?: boolean;
  }) => {
    const entries = Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined && v !== false)
      .map(([k, v]) => [k, String(v)]) as [string, string][];
    const q = new URLSearchParams(entries).toString();
    return req<Notification[]>(`/notifications${q ? `?${q}` : ""}`);
  },
  markRead: (id: number) =>
    req<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" }),

  // 환자가 기사에게 카톡 메시지 전송 (자동 답장 포함)
  sendDriverMessage: (patient_id: string, content: string) =>
    req<{ ok: boolean }>("/messages/driver", {
      method: "POST",
      body: JSON.stringify({ patient_id, content }),
    }),
};
