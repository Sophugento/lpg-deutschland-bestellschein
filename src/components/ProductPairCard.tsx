"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { ProductInfo } from "@/data/productInfo";
import { calcPromoRevente, calcPromoCabine, formatEUR, translateSize } from "@/lib/utils";
import { T } from "@/lib/i18n";
import QuantitySelector from "./QuantitySelector";
import ProductInfoModal from "./ProductInfoModal";

interface Props {
  products: Product[];
  quantities: Record<string, number>;
  onChange: (ref: string, qty: number) => void;
  t: T;
  lang: "de";
  productInfo: Record<string, ProductInfo>;
}

function StatusBadge({ status, t }: { status: string; t: T }) {
  if (status === "new") return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: "#2d2020" }}>
      {t.statusNew}
    </span>
  );
  if (status === "nicht verfügbar") return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#e0dbd8", color: "#7a6e6a" }}>
      {t.statusIndispo}
    </span>
  );
  if (status === "nicht vorrätig") return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#e0dbd8", color: "#7a6e6a" }}>
      {t.statusRupture}
    </span>
  );
  return null;
}

function isBlocked(status?: string) {
  return status === "nicht verfügbar" || status === "nicht vorrätig";
}

export default function ProductPairCard({ products, quantities, onChange, t, productInfo }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  const revente = products.find((p) => p.type === "revente");
  const cabine = products.find((p) => p.type === "professionnel");
  const recharge = products.find((p) => p.type === "recharge");

  const nameFr = products[0].nameFr;
  const nameDe = products[0].nameDe;
  const infoKey = products[0].infoKey ?? nameFr;
  const info = productInfo[infoKey];

  const hasRevente = Boolean(revente);
  const hasCabine = Boolean(cabine || recharge);
  const isPair = hasRevente && hasCabine;

  const reventeQty = revente ? quantities[revente.ref] || 0 : 0;
  const cabineQty = cabine ? quantities[cabine.ref] || 0 : 0;
  const rechargeQty = recharge ? quantities[recharge.ref] || 0 : 0;
  const isActive = reventeQty > 0 || cabineQty > 0 || rechargeQty > 0;

  const { paid: reventePaid, free: reventeFree } = calcPromoRevente(reventeQty);
  const { free: cabineFree } = calcPromoCabine(cabineQty);

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
            {nameDe}
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

        {/* Kolonnen */}
        <div className="flex">
          {/* REVENTE / VERKAUF */}
          {revente && (
            <div
              className="flex-1 px-3 py-3"
              style={isPair ? { borderRight: "1px solid #f0ebe9" } : {}}
            >
              <div className="flex flex-col items-start gap-1 mb-2">
                {(isPair || !hasCabine) && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: "#d598aa" }}
                  >
                    {t.revente}
                  </span>
                )}
                {revente.status && <StatusBadge status={revente.status} t={t} />}
              </div>
              <p className="text-xs" style={{ color: "#bba8a1" }}>
                {translateSize(revente.size)}
              </p>
              <p className="text-base font-bold mt-1" style={{ color: "#2d2020" }}>
                {formatEUR(revente.price)}
              </p>
              {revente.retailPrice ? (
                <p className="text-[10px] mb-2" style={{ color: "#bba8a1" }}>
                  {t.prixVente} {formatEUR(revente.retailPrice)}
                </p>
              ) : (
                <div className="mb-2 h-4" />
              )}
              <QuantitySelector value={reventeQty} onChange={(v) => onChange(revente.ref, v)} disabled={isBlocked(revente.status)} />
              {reventeQty > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs font-semibold" style={{ color: "#d598aa" }}>
                    = {formatEUR(reventePaid * revente.price)}
                  </p>
                  {revente.promoEligible && reventeFree > 0 && (
                    <p className="text-[10px]" style={{ color: "#d598aa" }}>
                      {t.promoLabel(reventeFree, reventeQty >= 10 ? "10+2" : "6+1")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CABINE / PROFESSIONELL */}
          {(cabine || recharge) && (() => {
            const prod = cabine || recharge!;
            const qty = cabine ? cabineQty : rechargeQty;
            const typeLabel = recharge ? t.recharge : t.cabine;
            const bgColor = recharge ? "#e8c0cc" : "#bba8a1";
            return (
              <div className="flex-1 px-3 py-3" style={{ backgroundColor: "#faf9f8" }}>
                <div className="flex flex-col items-start gap-1 mb-2">
                  {(isPair || !hasRevente) && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: bgColor }}
                    >
                      {typeLabel}
                    </span>
                  )}
                  {prod.status && <StatusBadge status={prod.status} t={t} />}
                </div>
                <p className="text-xs" style={{ color: "#bba8a1" }}>
                  {translateSize(prod.size)}
                </p>
                <p className="text-base font-bold mt-1" style={{ color: "#2d2020" }}>
                  {formatEUR(prod.price)}
                </p>
                {prod.retailPrice ? (
                  <p className="text-[10px] mb-2" style={{ color: "#bba8a1" }}>
                    {t.prixVente} {formatEUR(prod.retailPrice)}
                  </p>
                ) : (
                  <div className="mb-2 h-4" />
                )}
                <QuantitySelector value={qty} onChange={(v) => onChange(prod.ref, v)} disabled={isBlocked(prod.status)} />
                {qty > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-xs font-semibold" style={{ color: "#bba8a1" }}>
                      = {formatEUR(qty * prod.price)}
                    </p>
                    {cabine && cabine.promoEligible && cabineFree > 0 && (
                      <p className="text-[10px]" style={{ color: "#d598aa" }}>
                        {t.promoLabelKabine(cabineFree)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Produit seul */}
          {!hasRevente && !hasCabine && products[0] && (
            <div className="flex-1 px-3 py-3">
              <p className="text-xs mb-2" style={{ color: "#bba8a1" }}>
                {translateSize(products[0].size)}
              </p>
              <p className="text-base font-bold mt-1">{formatEUR(products[0].price)}</p>
              <div className="mb-2 h-4" />
              <QuantitySelector
                value={quantities[products[0].ref] || 0}
                onChange={(v) => onChange(products[0].ref, v)}
                disabled={isBlocked(products[0].status)}
              />
            </div>
          )}
        </div>
      </div>

      {showInfo && info && (
        <ProductInfoModal
          nameFr={nameFr}
          nameDe={nameDe}
          info={info}
          lang="de"
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
