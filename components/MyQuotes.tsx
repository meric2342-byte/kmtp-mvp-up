"use client";

// "내 견적" — draft의 case_id로 b2b 부가서비스 요청의 상태·확정금액을 폴링해서 보여준다.
// 본사(admin)가 견적확정하면 status='견적확정' + quote_amount가 채워져 여기로 돌아온다.
// 확정 건이 있으면 에스크로 결제 단계로 이동하는 버튼을 노출한다.
import { useEffect, useState, useCallback } from "react";
import { B2B_API_BASE } from "@/lib/api";
import { formatKRW } from "@/lib/data";

type CaseQuote = {
  id: number;
  patient_name: string | null;
  nationality: string | null;
  service_type: string | null;
  details: string | null;
  procedure_name: string | null;
  price_krw: number | null;
  quote_amount: number | null;
  quote_sent_at: string | null;
  status: string;
  source: string | null;
  created_at: string;
};

// by-case 응답: { case_id, items, total_quote, quote_sent }
type CaseResponse = {
  case_id: string;
  items: CaseQuote[];
  total_quote: number;
  quote_sent: boolean;
};

type Props = {
  caseId: string;
  onGoEscrow: () => void;
};

const TYPE_ICON: Record<string, string> = {
  호텔: "🏨", 택시: "🚕", 배차: "🚐", 통역: "🗣", 공항픽업: "✈️",
};

export default function MyQuotes({ caseId, onGoEscrow }: Props) {
  const [quotes, setQuotes] = useState<CaseQuote[]>([]);
  const [quoteSent, setQuoteSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>("");

  const load = useCallback(async () => {
    if (!caseId) { setLoading(false); return; }
    try {
      const res = await fetch(`${B2B_API_BASE}/service-requests/by-case/${encodeURIComponent(caseId)}`);
      if (!res.ok) throw new Error(`조회 실패 (${res.status})`);
      const data = (await res.json()) as CaseResponse;
      setQuotes(data.items ?? []);
      setQuoteSent(Boolean(data.quote_sent));
      setError(null);
      setLastSync(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      setError("견적 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  // 최초 로드 + 15초 폴링 (본사 견적확정이 자동 반영되도록)
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const isConfirmedStatus = (s: string) => s === "견적확정" || s === "견적발송";
  const confirmed = quotes.filter((q) => isConfirmedStatus(q.status));
  const hasConfirmed = confirmed.length > 0;
  // 확정 합계: 확정금액이 있으면 그 값, 없으면 요청가(price_krw)
  const confirmedTotal = confirmed.reduce(
    (s, q) => s + (q.quote_amount ?? q.price_krw ?? 0), 0,
  );
  const requestedTotal = quotes.reduce(
    (s, q) => s + (q.quote_amount ?? q.price_krw ?? 0), 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary-dark sm:text-2xl">내 견적</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            요청하신 서비스의 확정 상태를 실시간으로 확인합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-primary/40"
        >
          ↻ 새로고침
        </button>
      </div>

      {/* case 식별 */}
      {caseId && (
        <div className="rounded-xl bg-primary-light/40 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary-dark">🗂 {caseId}</span>
          {lastSync && <span className="text-[11px] text-gray-400">동기화 {lastSync}</span>}
        </div>
      )}

      {quoteSent && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-bold text-emerald-800">📩 견적서가 발송되었습니다</p>
          <p className="mt-0.5 text-xs text-emerald-700">운영팀이 최종 견적을 확정해 보냈습니다. 아래 확정 금액으로 결제를 진행하실 수 있습니다.</p>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-3 text-sm font-semibold text-red-600">{error}</p>
      ) : quotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">아직 요청한 견적이 없습니다.</p>
          <p className="mt-1 text-xs text-gray-400">견적·예약 탭에서 서비스를 요청하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {quotes.map((q) => {
              const isConfirmed = isConfirmedStatus(q.status);
              return (
                <div key={q.id}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 ${isConfirmed ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-white"}`}>
                  <span className="text-base">{TYPE_ICON[q.service_type ?? ""] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">{q.procedure_name || q.service_type}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    {q.details && <p className="mt-0.5 text-xs text-gray-500">{q.details}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    {isConfirmed ? (
                      <>
                        <p className="text-[11px] text-gray-400">확정 금액</p>
                        <p className="text-sm font-black text-emerald-700">
                          {formatKRW(q.quote_amount ?? q.price_krw ?? 0)}
                        </p>
                      </>
                    ) : (
                      q.price_krw ? (
                        <>
                          <p className="text-[11px] text-gray-400">요청 금액</p>
                          <p className="text-sm font-bold text-gray-500">{formatKRW(q.price_krw)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">견적 대기</p>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 합계 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">요청 합계</span>
              <span className="font-bold text-gray-700">{formatKRW(requestedTotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-sm font-semibold text-emerald-700">확정 합계 ({confirmed.length}건)</span>
              <span className="text-lg font-black text-emerald-700">{formatKRW(confirmedTotal)}</span>
            </div>
          </div>

          {/* 확정 시 에스크로 진행 */}
          {hasConfirmed ? (
            <button
              type="button"
              onClick={onGoEscrow}
              className="rounded-2xl bg-primary py-4 text-base font-black text-white transition-colors hover:bg-primary-dark"
            >
              확정 견적으로 에스크로 결제 진행 →
            </button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">견적 확정 대기 중…</p>
              <p className="mt-0.5 text-xs text-amber-700">
                운영팀이 확정하면 이 화면에 확정 금액이 표시되고 결제를 진행할 수 있습니다.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const sent = status === "견적발송";
  const confirmed = status === "견적확정" || sent;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        confirmed
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {sent ? "📩 견적발송" : confirmed ? "✓ 견적확정" : "요청"}
    </span>
  );
}
