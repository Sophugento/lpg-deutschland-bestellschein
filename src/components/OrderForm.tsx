"use client";

import { useState, useMemo } from "react";
import { calcPromoRevente, calcPromoCabine } from "@/lib/utils";
import { T } from "@/lib/i18n";
import { Product, Offer } from "@/data/products";
import { ProductInfo } from "@/data/productInfo";
import CategorySection from "@/components/CategorySection";
import OfferRow from "@/components/OfferRow";
import OrderBar from "@/components/OrderBar";
import OrderModal from "@/components/OrderModal";

interface Catalog {
  products: Product[];
  offers: Offer[];
  productInfo: Record<string, ProductInfo>;
}

interface Props {
  catalog: Catalog;
}

export default function OrderForm({ catalog }: Props) {
  const { products, offers, productInfo } = catalog;

  const lang = "de" as const;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [offerQtys, setOfferQtys] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const t = T;

  function updateQty(ref: string, qty: number) {
    setQuantities((q) => ({ ...q, [ref]: qty }));
  }

  function updateOfferQty(id: string, qty: number) {
    setOfferQtys((q) => ({ ...q, [id]: qty }));
  }

  const subtotal = useMemo(() => {
    const productTotal = products.reduce((sum, p) => {
      const qty = quantities[p.ref] || 0;
      if (qty === 0) return sum;
      const promoFn = p.type === "professionnel" ? calcPromoCabine : calcPromoRevente;
      const { paid } = p.promoEligible ? promoFn(qty) : { paid: qty };
      return sum + paid * p.price;
    }, 0);
    const offerTotal = offers.reduce(
      (sum, o) => sum + (offerQtys[o.id] || 0) * o.price,
      0
    );
    return Math.round((productTotal + offerTotal) * 100) / 100;
  }, [quantities, offerQtys, products, offers]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const categorizedProducts = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = products.filter((p) => p.category === cat);
      return acc;
    }, {} as Record<string, typeof products>);
  }, [categories, products]);

  return (
    <main className="min-h-screen pb-52">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "white", borderBottom: "1px solid #ded5d1" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#d598aa" }}>
            {t.brand}
          </p>
          <h1 className="text-base font-bold leading-tight" style={{ color: "#2d2020" }}>
            {t.title}
          </h1>
        </div>
      </header>

      {/* Règles */}
      <div
        className="mx-4 mt-4 mb-3 rounded-xl p-3 text-xs space-y-1"
        style={{ backgroundColor: "#f0cad620", border: "1px solid #f0cad6" }}
      >
        <p className="font-bold" style={{ color: "#bf7585" }}>
          {t.rulesTitle}
        </p>
        <p style={{ color: "#8a5565" }}>
          • {t.ruleMin} <strong>200 €</strong> {t.priceNote}
        </p>
        <p style={{ color: "#8a5565" }}>
          • {t.ruleShipping} <strong>10 €</strong> {t.ruleShippingDetail}
        </p>
        <p style={{ color: "#8a5565" }}>• {t.rulePromo}</p>
        <p style={{ color: "#8a5565" }}>• {t.rulePromoKabine}</p>
        <p style={{ color: "#8a5565" }}>• {t.ruleMinQty}</p>
        <p className="pt-1 font-semibold" style={{ color: "#bf7585" }}>
          ⚠️ {t.htNote}
        </p>
      </div>

      <div className="px-4">
        {/* Offres spéciales */}
        {offers.length > 0 && (
          <div className="mb-3 rounded-2xl overflow-hidden border" style={{ borderColor: "#d598aa40" }}>
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ backgroundColor: "#d598aa15" }}
            >
              <span className="font-bold text-sm tracking-wide uppercase" style={{ color: "#d598aa" }}>
                🎁 {t.offresSpeciales}
              </span>
            </div>
            <div className="px-3 py-3" style={{ backgroundColor: "#f7f4f3" }}>
              {offers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  qty={offerQtys[offer.id] || 0}
                  onChange={updateOfferQty}
                  t={t}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Catégories produits */}
        {categories.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            products={categorizedProducts[cat]}
            quantities={quantities}
            onChange={updateQty}
            t={t}
            lang={lang}
            productInfo={productInfo}
          />
        ))}
      </div>

      <OrderBar subtotal={subtotal} onSubmit={() => setModalOpen(true)} t={t} />

      {modalOpen && (
        <OrderModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); setQuantities({}); setOfferQtys({}); }}
          products={products}
          offers={offers}
          quantities={quantities}
          offerQtys={offerQtys}
          subtotal={subtotal}
          t={t}
          lang={lang}
        />
      )}
    </main>
  );
}
