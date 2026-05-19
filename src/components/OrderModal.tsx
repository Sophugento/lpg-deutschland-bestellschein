"use client";

import { useState, useEffect } from "react";
import { Product, Offer, SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/data/products";
import { calcPromoRevente, calcPromoCabine, formatEUR } from "@/lib/utils";
import { T } from "@/lib/i18n";

interface Address {
  company: string;
  address: string;
  postalCode: string;
  city: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  sameDelivery: boolean;
  delivery: Address;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  offers: Offer[];
  quantities: Record<string, number>;
  offerQtys: Record<string, number>;
  subtotal: number;
  t: T;
  lang: "de";
}

const EMPTY_DELIVERY: Address = { company: "", address: "", postalCode: "", city: "" };

export default function OrderModal({
  onClose,
  onSuccess,
  products,
  offers,
  quantities,
  offerQtys,
  subtotal,
  t,
}: Props) {
  const [c, setC] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    postalCode: "",
    city: "",
    email: "",
    phone: "",
    notes: "",
    sameDelivery: true,
    delivery: { ...EMPTY_DELIVERY },
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const totalTTC = total * 1.19;

  const selectedProducts = products.filter((p) => (quantities[p.ref] || 0) > 0);
  const selectedOffers = offers.filter((o) => (offerQtys[o.id] || 0) > 0);

  function upd<K extends keyof ContactInfo>(field: K, val: ContactInfo[K]) {
    setC((prev) => ({ ...prev, [field]: val }));
  }

  function updDelivery<K extends keyof Address>(field: K, val: string) {
    setC((prev) => ({ ...prev, delivery: { ...prev.delivery, [field]: val } }));
  }

  const deliveryValid =
    c.sameDelivery ||
    (c.delivery.address.trim() && c.delivery.postalCode.trim() && c.delivery.city.trim());

  const isValid =
    c.firstName.trim() &&
    c.lastName.trim() &&
    c.email.trim() &&
    c.phone.trim() &&
    c.address.trim() &&
    c.postalCode.trim() &&
    c.city.trim() &&
    deliveryValid;

  async function handleSubmit() {
    if (!isValid) return;
    setStatus("sending");

    const orderLines = [
      ...selectedOffers.map((o) => ({
        ref: o.id,
        name: o.nameDe,
        type: "offre",
        size: "",
        qty: offerQtys[o.id],
        unitPrice: o.price,
        freeQty: 0,
        lineTotal: offerQtys[o.id] * o.price,
        description: o.description,
        gift: o.gift,
      })),
      ...selectedProducts.map((p) => {
        const qty = quantities[p.ref];
        const promoFn = p.type === "professionnel" ? calcPromoCabine : calcPromoRevente;
        const { paid, free } = p.promoEligible ? promoFn(qty) : { paid: qty, free: 0 };
        return {
          ref: p.ref,
          name: p.nameDe,
          type: p.type,
          size: p.size,
          qty,
          unitPrice: p.price,
          freeQty: free,
          lineTotal: paid * p.price,
        };
      }),
    ];

    const deliveryAddress = c.sameDelivery
      ? { company: c.company, address: c.address, postalCode: c.postalCode, city: c.city }
      : c.delivery;

    try {
      const res = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: c,
          deliveryAddress,
          orderLines,
          subtotal,
          shipping,
          total,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unbekannter Fehler");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col" style={{ height: "calc(100dvh - 48px)" }}>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3"
                style={{ backgroundColor: "#d598aa" }}
              >
                ✓
              </div>
              <h2 className="text-lg font-bold mb-1">{t.successTitle}</h2>
              <p className="text-sm" style={{ color: "#bba8a1" }}>{t.successMsg}</p>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: "#f7f4f3", border: "1px solid #ded5d1" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#bba8a1" }}>
                {t.recap}
              </p>
              <div className="space-y-1.5">
                {selectedOffers.map((o) => (
                  <div key={o.id} className="flex justify-between text-xs">
                    <span className="flex-1 pr-2" style={{ color: "#2d2020" }}>
                      {o.nameDe} ×{offerQtys[o.id]}
                    </span>
                    <span className="font-semibold">{formatEUR(offerQtys[o.id] * o.price)}</span>
                  </div>
                ))}
                {selectedProducts.map((p) => {
                  const qty = quantities[p.ref];
                  const promoFn = p.type === "professionnel" ? calcPromoCabine : calcPromoRevente;
                  const { paid, free } = p.promoEligible ? promoFn(qty) : { paid: qty, free: 0 };
                  return (
                    <div key={p.ref} className="flex justify-between text-xs">
                      <span className="flex-1 pr-2" style={{ color: "#2d2020" }}>
                        {p.nameDe}
                        {p.size ? ` (${p.size})` : ""} ×{qty}
                        {free > 0 && <span style={{ color: "#d598aa" }}> +{free}</span>}
                      </span>
                      <span className="font-semibold">{formatEUR(paid * p.price)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: "#ded5d1" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#bba8a1" }}>{t.shippingLabel}</span>
                  <span>{shipping === 0 ? t.shippingFree : formatEUR(SHIPPING_COST)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>{t.total}</span>
                  <span style={{ color: "#d598aa" }}>{formatEUR(total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#bba8a1" }}>{t.totalTTC}</span>
                  <span style={{ color: "#bba8a1" }}>{formatEUR(totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: "#ded5d1" }}>
            <button
              onClick={onSuccess}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: "#d598aa" }}
            >
              {t.btnClose}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col" style={{ height: "calc(100dvh - 48px)" }}>
        <div className="px-5 pt-5 pb-3 border-b shrink-0" style={{ borderColor: "#ded5d1" }}>
          <h2 className="text-lg font-bold">{t.modalTitle}</h2>
          <p className="text-xs mt-0.5" style={{ color: "#bba8a1" }}>
            {t.coordTitle}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Récapitulatif */}
          <div className="pb-4 border-b" style={{ borderColor: "#ded5d1" }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#bba8a1" }}>
              {t.recap}
            </p>
            <div className="space-y-1.5">
              {selectedOffers.map((o) => (
                <div key={o.id} className="flex justify-between text-xs">
                  <span className="flex-1 truncate pr-2">
                    {o.nameDe} ×{offerQtys[o.id]}
                  </span>
                  <span className="font-semibold">{formatEUR(offerQtys[o.id] * o.price)}</span>
                </div>
              ))}
              {selectedProducts.map((p) => {
                const qty = quantities[p.ref];
                const promoFn = p.type === "professionnel" ? calcPromoCabine : calcPromoRevente;
                const { paid, free } = p.promoEligible ? promoFn(qty) : { paid: qty, free: 0 };
                return (
                  <div key={p.ref} className="flex justify-between text-xs">
                    <span className="flex-1 truncate pr-2">
                      {p.nameDe}
                      {p.size ? ` (${p.size})` : ""} ×{qty}
                      {free > 0 && <span style={{ color: "#d598aa" }}> +{free}</span>}
                    </span>
                    <span className="font-semibold">{formatEUR(paid * p.price)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: "#ded5d1" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#bba8a1" }}>{t.sousTotal}</span>
                <span>{formatEUR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#bba8a1" }}>{t.shippingLabel}</span>
                <span>{shipping === 0 ? t.shippingFree : formatEUR(SHIPPING_COST)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>{t.total}</span>
                <span style={{ color: "#d598aa" }}>{formatEUR(total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#bba8a1" }}>{t.totalTTC}</span>
                <span style={{ color: "#bba8a1" }}>{formatEUR(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <p className="text-xs font-bold uppercase tracking-wide pt-1" style={{ color: "#bba8a1" }}>
            {t.coordTitle}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.firstName} value={c.firstName} onChange={(v) => upd("firstName", v)} />
            <Field label={t.lastName} value={c.lastName} onChange={(v) => upd("lastName", v)} />
          </div>
          <Field label={t.company} value={c.company} onChange={(v) => upd("company", v)} />
          <Field label={t.address} value={c.address} onChange={(v) => upd("address", v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.postalCode} value={c.postalCode} onChange={(v) => upd("postalCode", v)} />
            <div className="col-span-2">
              <Field label={t.city} value={c.city} onChange={(v) => upd("city", v)} />
            </div>
          </div>
          <Field label={t.email} type="email" value={c.email} onChange={(v) => upd("email", v)} />
          <Field label={t.phone} type="tel" value={c.phone} onChange={(v) => upd("phone", v)} />

          {/* Adresse livraison */}
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "#f0cad620", border: "1px solid #f0cad6" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "#bf7585" }}>
              {t.deliveryQuestion}
            </p>
            <div className="flex gap-3">
              <ToggleBtn active={c.sameDelivery} onClick={() => upd("sameDelivery", true)} label={t.deliveryYes} />
              <ToggleBtn active={!c.sameDelivery} onClick={() => upd("sameDelivery", false)} label={t.deliveryNo} />
            </div>
          </div>

          {!c.sameDelivery && (
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#bba8a1" }}>
                {t.deliveryTitle}
              </p>
              <Field label={t.deliveryCompany} value={c.delivery.company} onChange={(v) => updDelivery("company", v)} />
              <Field label={t.deliveryAddress} value={c.delivery.address} onChange={(v) => updDelivery("address", v)} />
              <div className="grid grid-cols-3 gap-3">
                <Field label={t.deliveryPostalCode} value={c.delivery.postalCode} onChange={(v) => updDelivery("postalCode", v)} />
                <div className="col-span-2">
                  <Field label={t.deliveryCity} value={c.delivery.city} onChange={(v) => updDelivery("city", v)} />
                </div>
              </div>
            </div>
          )}

          <Field label={t.notes} value={c.notes} onChange={(v) => upd("notes", v)} multiline />

          {status === "error" && (
            <p className="text-xs text-center" style={{ color: "#bf7585" }}>
              {t.errorPrefix}{errorMsg}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid || status === "sending"}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white mt-2 mb-2"
            style={{
              backgroundColor: isValid && status === "idle" ? "#d598aa" : "#ded5d1",
              cursor: isValid && status === "idle" ? "pointer" : "not-allowed",
            }}
          >
            {status === "sending" ? t.btnSending : t.btnConfirm}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Field({
  label, value, onChange, type = "text", multiline = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const cls = "w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#d598aa] transition-colors bg-white";
  const style = { borderColor: "#ded5d1" };
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "#bba8a1" }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cls} style={style} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} style={style} />
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
      style={{
        borderColor: active ? "#d598aa" : "#ded5d1",
        backgroundColor: active ? "#d598aa" : "white",
        color: active ? "white" : "#bba8a1",
      }}
    >
      {label}
    </button>
  );
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(45,32,32,0.5)" }}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
        style={{ top: "48px", backgroundColor: "#f7f4f3" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-10 text-2xl font-light"
          style={{ color: "#bba8a1" }}
          aria-label="Schliessen"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
