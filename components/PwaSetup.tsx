"use client";

// PWA: 서비스워커 등록 + '홈 화면에 추가' 설치 유도 배너(2회차부터).
// iOS는 공유→홈 화면 추가 가이드 + "설치해야 푸시 수신 가능" 안내.
import { useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/push";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PwaSetup() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    if (isStandalone()) return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") return;

    const visits = Number(localStorage.getItem("pwa-visits") || "0") + 1;
    localStorage.setItem("pwa-visits", String(visits));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (visits >= 2) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS는 beforeinstallprompt가 없음 → 2회차부터 수동 가이드
    if (isIOS() && visits >= 2) setShow(true);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  const install = async () => {
    if (isIOS()) {
      setIosGuide(true);
      return;
    }
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => {});
      dismiss();
    }
  };

  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", background: "#0F766E", color: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 6px 24px rgba(0,0,0,0.25)" }}>
        {!iosGuide ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>홈 화면에 추가 · Install the app</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                실시간 견적·일정 알림을 받으세요. Get real-time quote & schedule alerts.
              </div>
            </div>
            <button onClick={install} style={{ background: "#fff", color: "#0F766E", border: 0, borderRadius: 9, padding: "9px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              추가 · Add
            </button>
            <button onClick={dismiss} aria-label="닫기" style={{ background: "transparent", color: "#fff", border: 0, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>iPhone 설치 방법 · Install on iPhone</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>하단 공유 버튼 <b>⎋</b> 탭 · Tap the Share button</li>
              <li>&ldquo;홈 화면에 추가 · Add to Home Screen&rdquo; 선택</li>
            </ol>
            <p style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
              ⚠️ iOS는 <b>설치해야 푸시 알림</b>을 받을 수 있어요. On iOS, install is required to receive push.
            </p>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <button onClick={dismiss} style={{ background: "#fff", color: "#0F766E", border: 0, borderRadius: 9, padding: "7px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>확인 · OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
