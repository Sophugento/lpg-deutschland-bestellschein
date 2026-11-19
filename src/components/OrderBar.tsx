"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/utils";
import { MIN_ORDER, SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/data/products";
import { T } from "@/lib/i18n";

interface Props {
  subtotal: number;
  onSubmit: () => void;
  t: T;
  promoCode: string | null;
  onPromoChange: (code: string | null) => void;
}

export default function OrderBar({ subtotal, onSubmit, t, promoCode, onPromoChange }: Props) {
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [checking, setChecking] = useState(false);

  const shipping = promoCode || subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const totalTTC = total * 1.19;
  const missing = MIN_ORDER - subtotal;
  const canSubmit = promoCode ? subtotal > 0 : subtotal >= MIN_ORDER;

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setChecking(true);
    setPromoError(false);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput }),
      });
      const { valid, code } = await res.json();
      if (valid) {
        onPromoChange(code);
        setPromoOpen(false);
        setPromoInput("");
      } else {
        setPromoError(true);
      }
    } catch {
      setPromoError(true);
    } finally {
      setChecking(false);
    }
  }

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
          {!promoCode && subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
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
        <div className="mb-2">
          {promoCode ? (
            <div className="flex items-center justify-between text-[11px] rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "#d598aa15", color: "#bf7585" }}>
              <span className="font-semibold">✓ {t.promoActive(promoCode)}</span>
              <button onClick={() => onPromoChange(null)} className="underline ml-2 shrink-0">{t.promoRemove}</button>
            </div>
          ) : promoOpen ? (
            <div>
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  placeholder={t.promoPlaceholder}
                  autoCapitalize="characters"
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none uppercase"
                  style={{ borderColor: promoError ? "#bf7585" : "#ded5d1" }}
                />
                <button
                  onClick={applyPromo}
                  disabled={checking}
                  className="px-4 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#d598aa" }}
                >
                  {checking ? "…" : t.promoApply}
                </button>
              </div>
              {promoError && <p className="text-[10px] mt-1" style={{ color: "#bf7585" }}>{t.promoInvalid}</p>}
            </div>
          ) : (
            <button onClick={() => setPromoOpen(true)} className="text-[11px] underline" style={{ color: "#bba8a1" }}>
              {t.promoLink}
            </button>
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
