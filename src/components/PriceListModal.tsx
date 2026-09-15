"use client";

import { useEffect } from "react";
import { Product } from "@/data/products";
import { formatEUR } from "@/lib/utils";
import { T } from "@/lib/i18n";

interface Props {
  products: Product[];
  onClose: () => void;
}

function groupByCategory(products: Product[]) {
  const result: Record<string, Record<string, Product[]>> = {};
  for (const p of products) {
    if (!result[p.category]) result[p.category] = {};
    if (!result[p.category][p.subcategory]) result[p.category][p.subcategory] = [];
    result[p.category][p.subcategory].push(p);
  }
  return result;
}

export default function PriceListModal({ products, onClose }: Props) {
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

  const grouped = groupByCategory(products);
  const t = T;

  const typeLabel = (type: string) => {
    if (type === "revente") return "Verkauf";
    if (type === "professionnel") return "Professionell";
    if (type === "recharge") return "Nachfüllung";
    return type;
  };

  const catName = (cat: string) =>
    (t as Record<string, unknown>)[cat] as string ?? cat;

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(45,32,32,0.5)" }}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden flex flex-col"
        style={{ top: "48px", backgroundColor: "#f7f4f3" }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: "white", borderColor: "#ded5d1" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#d598aa" }}>
              LPG Deutschland
            </p>
            <h2 className="text-base font-bold" style={{ color: "#2d2020" }}>
              Preisliste 2026
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-light leading-none"
            style={{ color: "#bba8a1" }}
            aria-label="Schliessen"
          >
            ×
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: "#f7f4f3" }}>
              <tr style={{ borderBottom: "2px solid #ded5d1" }}>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wide" style={{ color: "#bba8a1", width: "40%" }}>
                  Produkt
                </th>
                <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wide" style={{ color: "#bba8a1" }}>
                  Typ / Inhalt
                </th>
                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wide" style={{ color: "#bba8a1" }}>
                  Preis HT
                </th>
                <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wide" style={{ color: "#bba8a1" }}>
                  Empf. VK
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cat, subs]) => (
                <>
                  {/* Category header */}
                  <tr key={`cat-${cat}`}>
                    <td
                      colSpan={4}
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: "#d598aa", color: "white" }}
                    >
                      {catName(cat)}
                    </td>
                  </tr>

                  {Object.entries(subs).map(([sub, prods]) => (
                    <>
                      {/* Subcategory header (only if different from category) */}
                      {sub !== cat && (
                        <tr key={`sub-${sub}`}>
                          <td
                            colSpan={4}
                            className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ backgroundColor: "#f0ebe9", color: "#bba8a1" }}
                          >
                            {t.subcategories[sub] ?? sub}
                          </td>
                        </tr>
                      )}

                      {/* Product rows */}
                      {prods.map((p, i) => (
                        <tr
                          key={p.ref}
                          style={{
                            backgroundColor: i % 2 === 0 ? "white" : "#faf8f7",
                            borderBottom: "1px solid #f0ebe9",
                          }}
                        >
                          <td className="px-4 py-2.5">
                            <span className="font-semibold block leading-tight" style={{ color: "#2d2020" }}>
                              {p.nameDe}
                            </span>
                            {p.nameFr !== p.nameDe && (
                              <span className="block leading-tight italic" style={{ color: "#bba8a1", fontSize: "10px" }}>
                                {p.nameFr}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5" style={{ color: "#8a7070" }}>
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1"
                              style={{
                                backgroundColor: p.type === "revente" ? "#d598aa20" : "#f0ebe9",
                                color: p.type === "revente" ? "#d598aa" : "#8a7070",
                              }}
                            >
                              {typeLabel(p.type)}
                            </span>
                            {p.size && <span style={{ color: "#bba8a1" }}>{p.size}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "#2d2020" }}>
                            {formatEUR(p.price)}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: p.retailPrice ? "#d598aa" : "#ded5d1" }}>
                            {p.retailPrice ? formatEUR(p.retailPrice) : "—"}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
