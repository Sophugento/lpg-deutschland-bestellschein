"use client";

import { ProductInfo } from "@/data/productInfo";
import { Lang } from "@/lib/i18n";

interface Props {
  nameFr: string;
  nameDe: string;
  info: ProductInfo;
  lang: Lang;
  onClose: () => void;
}

export default function ProductInfoModal({ nameFr, nameDe, info, lang, onClose }: Props) {
  const name = lang === "de" ? nameDe : nameFr;
  const description = lang === "de" ? info.descriptionDe : info.description;
  const benefits = lang === "de" ? info.benefitsDe : info.benefits;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      style={{ backgroundColor: "rgba(45,32,32,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: "white", maxWidth: "400px", maxHeight: "78vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête fixe */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #f0ebe9" }}>
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#2d2020" }}>
            {name}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-base font-light shrink-0 ml-2"
            style={{ backgroundColor: "#f0ebe9", color: "#bba8a1" }}
          >
            ×
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {/* Image */}
          {info.imageUrl && (
            <div className="flex items-center justify-center py-4" style={{ backgroundColor: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={info.imageUrl}
                alt={name}
                style={{ height: "160px", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Texte */}
          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b5050" }}>
              {description}
            </p>
            <ul className="space-y-2 mb-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#2d2020" }}>
                  <span className="shrink-0 font-bold" style={{ color: "#d598aa" }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
