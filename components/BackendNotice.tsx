"use client";

// 백엔드 연결 상태 안내 (로딩/오류 공통 표시)
type Props = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export default function BackendNotice({ loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        불러오는 중…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm font-semibold text-amber-800">
          백엔드에 연결할 수 없어요
        </p>
        <p className="mt-1 text-xs text-amber-700">
          백엔드 서버(localhost:8000)가 켜져 있는지 확인하세요.
          <br />
          <code className="rounded bg-amber-100 px-1">
            backend 폴더 → uvicorn main:app --reload --port 8000
          </code>
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }
  return null;
}
