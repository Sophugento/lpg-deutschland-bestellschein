"use client";

import { formatEUR } from "@/lib/utils";
import { MIN_ORDER, SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/data/products";
import { T } from "@/lib/i18n";

interface Props {
  subtotal: number;
  onSubmit: () => void;
  t: T;
}

export default function OrderBar({ subtotal, onSubmit, t }: Props) {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const totalTTC = total * 1.19;
  const missing = MIN_ORDER - subtotal;
  const canSubmit = subtotal >= MIN_ORDER;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 shadow-xl"
      style={{ backgroundColor: "white", borderTop: "1px solid #ded5d1" }}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="mb-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#bba8a1" }}>{t.sousTotal} <span className="text-[10px]">({t.priceNote})</span></span>
            <span className="font-semibold">{formatEUR(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#bba8a1" }}>{t.port}</span>
            <span className="font-semibold">
              {subtotal === 0 ? "—" : shipping === 0 ? t.portOffert : formatEUR(SHIPPING_COST)}
            </span>
          </div>
          {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="text-[10px]" style={{ color: "#bba8a1" }}>{t.portOffertDes}</p>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t" style={{ borderColor: "#ded5d1" }}>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#bba8a1" }}>{t.total}</span>
            <span className="text-xl font-bold" style={{ color: "#d598aa" }}>{formatEUR(total)}</span>
          </div>
          {total > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[10px]" style={{ color: "#bba8a1" }}>{t.totalTTC}</span>
              <span className="text-[11px] font-semibold" style={{ color: "#bba8a1" }}>{formatEUR(totalTTC)}</span>
            </div>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            backgroundColor: canSubmit ? "#d598aa" : "#ded5d1",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {subtotal === 0
            ? t.btnStart
            : !canSubmit
            ? t.btnMinNotReached(formatEUR(missing))
            : t.btnSend}
        </button>
      </div>
    </div>
  );
}
