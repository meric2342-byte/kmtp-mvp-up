// PWA 서비스워커 등록 + 웹 푸시 구독 (백엔드는 b2b Railway = B2B_API_BASE)
import { B2B_API_BASE } from "@/lib/api";

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* 등록 실패는 무시(비지원 환경) */
    });
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 알림 권한 요청 + 구독 저장. audience 예: 'patient:123'. 성공 시 true. */
export async function ensurePushSubscribed(audience: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    // 백엔드 VAPID 설정 여부 확인
    const keyRes = await fetch(`${B2B_API_BASE}/push/public-key`).then((r) => r.json()).catch(() => null);
    if (!keyRes?.enabled || !keyRes.public_key) return false;

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.public_key) as BufferSource,
      });
    }
    await fetch(`${B2B_API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        endpoint: sub.endpoint,
        keys: {
          p256dh: bufToB64Url(sub.getKey("p256dh")),
          auth: bufToB64Url(sub.getKey("auth")),
        },
      }),
    });
    return true;
  } catch {
    return false;
  }
}

/** 구독 해지(설정 off). */
export async function unsubscribePush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch(`${B2B_API_BASE}/push/unsubscribe`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** 현재 알림 권한 상태 */
export function notifPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
