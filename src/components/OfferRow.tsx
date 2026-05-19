"use client";

import { Offer } from "@/data/products";
import { formatEUR } from "@/lib/utils";
import { T } from "@/lib/i18n";
import QuantitySelector from "./QuantitySelector";

interface Props {
  offer: Offer;
  qty: number;
  onChange: (id: string, qty: number) => void;
  t: T;
  lang: "de";
}

export default function OfferRow({ offer, qty, onChange }: Props) {
  return (
    <div
      className={`rounded-xl border mb-2 overflow-hidden transition-shadow ${qty > 0 ? "shadow-md" : "shadow-sm"}`}
      style={{ borderColor: qty > 0 ? "#d598aa" : "#ded5d1", backgroundColor: "white" }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide">{offer.nameDe}</p>
          <p className="text-xs mt-1" style={{ color: "#bba8a1" }}>{offer.description}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: "#d598aa" }}>
            🎁 {offer.gift}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-base font-bold">{formatEUR(offer.price)}</p>
          <QuantitySelector value={qty} onChange={(v) => onChange(offer.id, v)} />
          {qty > 0 && (
            <p className="text-xs font-semibold" style={{ color: "#d598aa" }}>
              = {formatEUR(qty * offer.price)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
