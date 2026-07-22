"use client";

// #19 국적 선택 — 공식 리스트(영문/alpha2 검색, EN 우선) + 국기 이모지.
// 중국·러시아·UAE 선택 시 행정구역(성/주/에미리트) 2단계 선택.
// 데이터는 b2b 운영 백엔드(/refdata) — 실적보고 공식 리스트와 동일 소스.
import { useEffect, useMemo, useRef, useState } from "react";
import { B2B_API_BASE } from "@/lib/api";

type Nat = { ko: string; en: string | null; alpha2: string | null; alpha3: string | null; numeric: string | null };
type RuRegion = { ko: string; ru: string | null; federal: string | null };

const REGION_COUNTRIES: Record<string, string> = { CN: "china", RU: "russia", AE: "uae" };

// 백엔드(/refdata) 미가용 시 폴백 — 의료관광 주요 유입국(영문 검색·국기 유지).
const FALLBACK: Nat[] = [
  { ko: "베트남", en: "Vietnam", alpha2: "VN", alpha3: "VNM", numeric: "704" },
  { ko: "중국", en: "China", alpha2: "CN", alpha3: "CHN", numeric: "156" },
  { ko: "일본", en: "Japan", alpha2: "JP", alpha3: "JPN", numeric: "392" },
  { ko: "몽골", en: "Mongolia", alpha2: "MN", alpha3: "MNG", numeric: "496" },
  { ko: "러시아", en: "Russia", alpha2: "RU", alpha3: "RUS", numeric: "643" },
  { ko: "카자흐스탄", en: "Kazakhstan", alpha2: "KZ", alpha3: "KAZ", numeric: "398" },
  { ko: "우즈베키스탄", en: "Uzbekistan", alpha2: "UZ", alpha3: "UZB", numeric: "860" },
  { ko: "태국", en: "Thailand", alpha2: "TH", alpha3: "THA", numeric: "764" },
  { ko: "인도네시아", en: "Indonesia", alpha2: "ID", alpha3: "IDN", numeric: "360" },
  { ko: "필리핀", en: "Philippines", alpha2: "PH", alpha3: "PHL", numeric: "608" },
  { ko: "말레이시아", en: "Malaysia", alpha2: "MY", alpha3: "MYS", numeric: "458" },
  { ko: "싱가포르", en: "Singapore", alpha2: "SG", alpha3: "SGP", numeric: "702" },
  { ko: "미국", en: "United States", alpha2: "US", alpha3: "USA", numeric: "840" },
  { ko: "아랍에미리트", en: "United Arab Emirates", alpha2: "AE", alpha3: "ARE", numeric: "784" },
  { ko: "사우디아라비아", en: "Saudi Arabia", alpha2: "SA", alpha3: "SAU", numeric: "682" },
];

// 행정구역 폴백(백엔드 미가용 시). 실제 전체 목록은 /refdata/regions 제공.
const REGION_FALLBACK: Record<string, string[]> = {
  china: ["감숙성", "광동성", "귀주성", "길림성", "요녕성", "산동성", "상해시", "북경시", "천진시", "흑룡강성", "내몽고자치구", "복건성", "강소성", "절강성", "사천성"],
  russia: ["모스크바", "상트페테르부르크", "블라디보스토크", "노보시비르스크", "카잔"],
  uae: ["아부다비보건청", "두바이보건청"],
};

function flag(a2: string | null): string {
  if (!a2 || !/^[A-Za-z]{2}$/.test(a2)) return "";
  const cc = a2.toUpperCase();
  return String.fromCodePoint(0x1f1e6 + cc.charCodeAt(0) - 65, 0x1f1e6 + cc.charCodeAt(1) - 65);
}

type Props = {
  nationality: string;            // 한글명
  onSelectNationality: (ko: string) => void;
  onSelectRegion?: (region: string) => void;
};

export default function NationalityPicker({ nationality, onSelectNationality, onSelectRegion }: Props) {
  const [list, setList] = useState<Nat[]>([]);
  const [iso, setIso] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${B2B_API_BASE}/refdata/nationalities`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setList(d.nationalities?.length ? d.nationalities : FALLBACK))
      .catch(() => setList(FALLBACK));
  }, []);

  // 선택된 국적의 alpha2 동기화(부모가 한글명만 들고 있을 때)
  useEffect(() => {
    if (!nationality || list.length === 0) return;
    const found = list.find((n) => n.ko === nationality);
    if (found?.alpha2 && found.alpha2 !== iso) setIso(found.alpha2);
  }, [nationality, list, iso]);

  useEffect(() => {
    const country = REGION_COUNTRIES[iso];
    if (!country) { setRegions([]); setRegion(""); return; }
    fetch(`${B2B_API_BASE}/refdata/regions?country=${country}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const rs = (d.regions ?? []).map((x: string | RuRegion) => (typeof x === "string" ? x : x.ko));
        setRegions(rs.length ? rs : (REGION_FALLBACK[country] ?? []));
      })
      .catch(() => setRegions(REGION_FALLBACK[country] ?? []));
  }, [iso]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 30);
    return list
      .map((n) => {
        const en = (n.en || "").toLowerCase();
        const ko = n.ko.toLowerCase();
        const a2 = (n.alpha2 || "").toLowerCase();
        let score = -1;
        if (en.startsWith(q) || a2 === q) score = 3;
        else if (en.includes(q)) score = 2;
        else if (ko.includes(q)) score = 1;
        return { n, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((x) => x.n);
  }, [query, list]);

  const label = nationality ? `${flag(iso)} ${nationality}${iso ? ` (${iso})` : ""}` : "";

  return (
    <div ref={boxRef} className="relative">
      <input
        value={open ? query : label}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder="국적 검색 (영문/한글/코드) — 예: Viet, 중국, CN"
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border-2 border-gray-100 bg-white shadow-xl">
          {filtered.map((n) => (
            <button
              key={`${n.ko}-${n.alpha2}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelectNationality(n.ko);
                setIso(n.alpha2 || "");
                setRegion("");
                onSelectRegion?.("");
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-2.5 text-left text-sm hover:bg-primary-light/30"
            >
              <span>{flag(n.alpha2)}</span>
              <span className="flex-1 font-medium text-gray-800">{n.ko}</span>
              <span className="text-xs text-gray-400">{n.en} · {n.alpha2}</span>
            </button>
          ))}
        </div>
      )}
      {regions.length > 0 && (
        <select
          value={region}
          onChange={(e) => { setRegion(e.target.value); onSelectRegion?.(e.target.value); }}
          className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="">행정구역 선택 (성/주/에미리트)</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
    </div>
  );
}
