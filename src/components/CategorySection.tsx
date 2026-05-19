"use client";

import { useState, useMemo } from "react";
import { Product } from "@/data/products";
import { ProductInfo } from "@/data/productInfo";
import ProductPairCard from "./ProductPairCard";
import SizeVariantCard from "./SizeVariantCard";
import { T, Lang } from "@/lib/i18n";

interface Props {
  category: string;
  products: Product[];
  quantities: Record<string, number>;
  onChange: (ref: string, qty: number) => void;
  t: T;
  lang: Lang;
  productInfo: Record<string, ProductInfo>;
}

type CardGroup =
  | { kind: "pair"; products: Product[] }
  | { kind: "sizes"; baseName: string; baseNameDe: string; products: Product[] };

function getBaseName(nameFr: string): string {
  const idx = nameFr.indexOf(" — ");
  return idx >= 0 ? nameFr.slice(0, idx) : nameFr;
}

function groupProducts(products: Product[]): CardGroup[] {
  // Only products whose nameFr contains " — " can be size variants (e.g. "TUNIQUE NOIRE — S/36")
  const baseCount = new Map<string, number>();
  for (const p of products) {
    if (p.nameFr.includes(" — ")) {
      const base = getBaseName(p.nameFr);
      baseCount.set(base, (baseCount.get(base) || 0) + 1);
    }
  }

  const seen = new Set<string>();
  const result: CardGroup[] = [];

  for (const p of products) {
    const base = getBaseName(p.nameFr);
    const isSizeVariant = p.nameFr.includes(" — ") && (baseCount.get(base) || 0) > 1;

    if (isSizeVariant) {
      if (seen.has(`sizes__${base}`)) continue;
      seen.add(`sizes__${base}`);
      const group = products.filter((x) => getBaseName(x.nameFr) === base && x.size !== "");
      // baseName DE: take part before " — " from first product's nameDe
      const baseNameDe = getBaseName(group[0].nameDe);
      result.push({ kind: "sizes", baseName: base, baseNameDe, products: group });
    } else {
      const key = `${p.subcategory}__${p.nameFr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const group = products.filter(
        (x) => x.nameFr === p.nameFr && x.subcategory === p.subcategory
      );
      result.push({ kind: "pair", products: group });
    }
  }
  return result;
}

function groupBySubcategory(products: Product[]): Record<string, Product[]> {
  return products.reduce((acc, p) => {
    if (!acc[p.subcategory]) acc[p.subcategory] = [];
    acc[p.subcategory].push(p);
    return acc;
  }, {} as Record<string, Product[]>);
}

export default function CategorySection({ category, products, quantities, onChange, t, lang, productInfo }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = products.filter((p) => (quantities[p.ref] || 0) > 0).length;
  const grouped = useMemo(() => groupBySubcategory(products), [products]);
  const groupedCards = useMemo(
    () => Object.fromEntries(
      Object.entries(grouped).map(([sub, prods]) => [sub, groupProducts(prods)])
    ),
    [grouped]
  );

  const catName = (t as Record<string, unknown>)[category] as string ?? category;

  return (
    <div className="mb-3 rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "#ded5d1" }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide uppercase" style={{ color: "#2d2020" }}>
            {catName}
          </span>
          {activeCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: "#d598aa" }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <span style={{ color: "#d598aa", fontSize: "20px", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="px-3 py-3" style={{ backgroundColor: "#f7f4f3" }}>
          {Object.entries(grouped).map(([sub]) => (
            <div key={sub}>
              {sub !== category && (
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2 mt-1"
                  style={{ color: "#bba8a1" }}
                >
                  {t.subcategories[sub] ?? sub}
                </p>
              )}
              {groupedCards[sub].map((card) =>
                card.kind === "sizes" ? (
                  <SizeVariantCard
                    key={card.baseName}
                    baseName={card.baseName}
                    baseNameDe={card.baseNameDe}
                    products={card.products}
                    quantities={quantities}
                    onChange={onChange}
                    t={t}
                    lang={lang}
                    productInfo={productInfo}
                  />
                ) : (
                  <ProductPairCard
                    key={card.products.map((p) => p.ref).join("_")}
                    products={card.products}
                    quantities={quantities}
                    onChange={onChange}
                    t={t}
                    lang={lang}
                    productInfo={productInfo}
                  />
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
