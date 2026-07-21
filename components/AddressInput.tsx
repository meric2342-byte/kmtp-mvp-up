"use client";

// 구글 Places 자동완성 주소 입력 — 픽업/이동 장소 입력에 공용으로 재사용.
// StepHotelServices·AddonServices 등 여러 화면에서 import 해서 쓴다.
import { useState, useEffect, useRef } from "react";

type WindowWithGoogle = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          el: HTMLInputElement,
          opts?: Record<string, unknown>,
        ) => {
          addListener: (
            ev: string,
            cb: () => void,
          ) => { remove?: () => void };
          getPlace: () => {
            formatted_address?: string;
            name?: string;
          };
        };
      };
    };
  };
};

// 구글 맵스 스크립트를 1회만 로드하고 준비 여부를 반환한다.
export function useGoogleMaps(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    const w = window as WindowWithGoogle;
    if (w.google?.maps?.places) { setReady(true); return; }
    const existing = document.getElementById("gmaps-script");
    if (existing) { existing.addEventListener("load", () => setReady(true)); return; }
    const s = document.createElement("script");
    s.id = "gmaps-script";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=ko`;
    s.async = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

const inp =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

// 구글 자동완성이 붙는 주소 입력. ready=false(키 없음/미로딩)면 일반 텍스트 입력으로 동작.
export default function AddressInput({
  value,
  onChange,
  placeholder,
  ready,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ready: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const places = (window as WindowWithGoogle).google?.maps?.places;
    if (!places) return;
    const ac = new places.Autocomplete(ref.current, {
      fields: ["formatted_address", "name"],
      componentRestrictions: { country: "kr" },
    });
    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const addr = place?.formatted_address ?? "";
      const name = place?.name ?? "";
      const label =
        name && addr && !addr.includes(name) ? `${name} (${addr})` : addr || name;
      if (label) onChange(label);
    });
    return () => { listener?.remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className ?? inp}
    />
  );
}
