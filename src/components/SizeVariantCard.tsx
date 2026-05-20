"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { ProductInfo } from "@/data/productInfo";
import { formatEUR } from "@/lib/utils";
import { T } from "@/lib/i18n";
import QuantitySelector from "./QuantitySelector";
import ProductInfoModal from "./ProductInfoModal";

interface Props {
  baseName: string;
  baseNameDe: string;
  products: Product[];
  quantities: Record<string, number>;
  onChange: (ref: string, qty: number) => void;
  t: T;
  lang: "de";
  productInfo: Record<string, ProductInfo>;
}

export default function SizeVariantCard({
  baseName,
  baseNameDe,
  products,
  quantities,
  onChange,
  productInfo,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);

  const rawKey = products[0].infoKey ?? products[0].nameFr;
  const baseKey = rawKey.includes(" — ") ? rawKey.slice(0, rawKey.indexOf(" — ")) : rawKey;
  const info = productInfo[baseKey] ?? productInfo[rawKey];
  const isActive = products.some((p) => (quantities[p.ref] || 0) > 0);

  return (
    <>
      <div
        className={`rounded-xl border mb-2 overflow-hidden transition-shadow ${isActive ? "shadow-md" : "shadow-sm"}`}
        style={{ borderColor: isActive ? "#d598aa" : "#ded5d1", backgroundColor: "white" }}
      >
        {/* Header */}
        <div
          className="px-4 pt-3 pb-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid #f0ebe9" }}
        >
          <p className="text-sm font-bold uppercase tracking-wide flex-1 mr-2" style={{ color: "#2d2020" }}>
            {baseNameDe}
          </p>
          {info && (
            <button
              onClick={() => setShowInfo(true)}
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors"
              style={{ borderColor: "#d598aa", color: "#d598aa" }}
              aria-label="Produktinfo"
            >
              i
            </button>
          )}
        </div>

        {/* Lignes par taille */}
        <div>
          {products.map((p, idx) => {
            const qty = quantities[p.ref] || 0;
            return (
              <div
                key={p.ref}
                className="px-4 py-2.5"
                style={idx < products.length - 1 ? { borderBottom: "1px solid #f0ebe9" } : {}}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold w-14 shrink-0" style={{ color: "#bba8a1" }}>
                    {p.size}
                  </span>
                  <span className="text-sm font-bold shrink-0 w-20 whitespace-nowrap" style={{ color: "#2d2020" }}>
                    {formatEUR(p.price)}
                  </span>
                  <QuantitySelector value={qty} onChange={(v) => onChange(p.ref, v)} />
                </div>
                {qty > 0 && (
                  <p className="text-xs font-semibold mt-1 pl-16" style={{ color: "#d598aa" }}>
                    = {formatEUR(qty * p.price)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showInfo && info && (
        <ProductInfoModal
          nameFr={baseName}
          nameDe={baseNameDe}
          info={info}
          lang="de"
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
