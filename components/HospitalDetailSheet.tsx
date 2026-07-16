"use client";

import { HospitalOption, REVIEWS, formatKRW } from "@/lib/data";
import { Procedure } from "@/lib/procedures";

type Props = {
  hospital: HospitalOption;
  procedure: Procedure | null;
  onClose: () => void;
};

function hospitalProcPriceLocal(hospital: HospitalOption, proc: Procedure | null): number | null {
  if (!proc) return null;
  const t = hospital.treatments.find((t) => t.deptId === proc.deptId);
  return t ? t.total : null;
}

export default function HospitalDetailSheet({ hospital, procedure, onClose }: Props) {
  const price = hospitalProcPriceLocal(hospital, procedure);
  const hospitalReviews = REVIEWS.filter((r) => r.hospitalId === hospital.id);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    hospital.address ?? hospital.name
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{hospital.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{hospital.area}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="font-semibold text-gray-800">{hospital.rating.toFixed(1)}</span>
            <span className="text-gray-400 text-sm">({hospital.reviewCount.toLocaleString()}건)</span>
          </div>

          {/* Badges */}
          {hospital.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hospital.badges.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary-dark border border-primary/20"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Intro */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {hospital.intro ?? "한국 의료관광 협력 병원"}
          </p>

          {/* Address */}
          {hospital.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span>{hospital.address}</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary underline text-xs"
              >
                지도 보기
              </a>
            </div>
          )}
          {!hospital.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span>{hospital.area}</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary underline text-xs"
              >
                지도 보기
              </a>
            </div>
          )}

          {/* Doctors */}
          {hospital.doctors && hospital.doctors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">의료진</h3>
              <div className="space-y-1">
                {hospital.doctors.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-primary">👨‍⚕️</span>
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{doc.specialty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedure price */}
          {procedure && (
            <div className="bg-primary-light rounded-xl p-4">
              <p className="text-xs text-primary-dark font-medium mb-1">이 병원 · {procedure.name} 견적</p>
              {price !== null ? (
                <p className="text-xl font-bold text-primary">{formatKRW(price)}</p>
              ) : (
                <p className="text-sm text-gray-500">해당 시술 견적 없음 (상담 문의)</p>
              )}
            </div>
          )}

          {/* Reviews */}
          {hospitalReviews.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">이 병원 후기</h3>
              <div className="space-y-3">
                {hospitalReviews.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{r.name}</span>
                      <span className="text-xs text-gray-400">{r.country}</span>
                      {r.verified && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          검증됨
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? "text-yellow-400" : "text-gray-200"}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{r.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
