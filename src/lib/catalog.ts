import { Product, Offer, PRODUCTS, OFFERS } from "@/data/products";
import { ProductInfo, PRODUCT_INFO } from "@/data/productInfo";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";

interface GvizTable {
  cols: { label: string; type: string }[];
  rows: ({ c: ({ v: unknown; f?: string } | null)[] } | null)[];
}

async function fetchSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  if (!SHEET_ID) return [];
  // headers=1 forces gviz to use row 1 as header — avoids contaminated label bug
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${sheetName}`);
  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  const table: GvizTable = JSON.parse(text.slice(start, end)).table;
  const labels = table.cols.map((c) => {
    const label = c.label.trim();
    const markerIdx = label.indexOf(" 📌");
    return markerIdx >= 0 ? label.slice(0, markerIdx) : label;
  });
  const dataRows = table.rows.filter((row) => row !== null && row.c !== null);
  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    row!.c.forEach((cell, i) => {
      obj[labels[i]] = cell?.v ?? "";
    });
    return obj;
  });
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function num(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export interface Catalog {
  products: Product[];
  offers: Offer[];
  productInfo: Record<string, ProductInfo>;
}

export async function getCatalog(): Promise<Catalog> {
  if (!SHEET_ID) {
    return { products: PRODUCTS, offers: OFFERS, productInfo: PRODUCT_INFO };
  }
  try {
    const [prodRows, offerRows, descRows] = await Promise.all([
      fetchSheet("Produkte"),
      fetchSheet("Sonderangebote"),
      fetchSheet("Descriptions & Images"),
    ]);

    // Build override map from sheet rows (ref → updatable fields only).
    // PRODUCTS static list is always the base — the sheet only patches what changed.
    const overrides = new Map<string, Partial<Product>>();
    prodRows
      .filter((r) => str(r["Réf."]) && !str(r["Réf."]).startsWith("📌"))
      .forEach((r) => {
        const ref = str(r["Réf."]);
        const patch: Partial<Product> = {};
        // Support both "Nom" (single column) and separate "Nom FR"/"Nom DE" columns
        const nomFr = str(r["Nom FR"] ?? r["Nom"]);
        const nomDe = str(r["Nom DE"] ?? r["Nom"]);
        if (nomDe)  patch.nameDe = nomDe;
        if (nomFr)  patch.nameFr = nomFr;
        if (str(r["Type"]))              patch.type = str(r["Type"]) as Product["type"];
        if (str(r["Contenant"]))         patch.size = str(r["Contenant"]);
        if (num(r["Prix EUR (HT)"]))     patch.price = num(r["Prix EUR (HT)"]);
        if (num(r["Prix vente EUR"]))    patch.retailPrice = num(r["Prix vente EUR"]);
        if (str(r["Catégorie"]))         patch.category = str(r["Catégorie"]);
        if (str(r["Sous-catégorie"]))    patch.subcategory = str(r["Sous-catégorie"]);
        const status = str(r["Statut"]).toLowerCase();
        if (status) patch.status = status as Product["status"];
        overrides.set(ref, patch);
      });

    // 1. Apply sheet overrides to all static products
    const staticRefs = new Set(PRODUCTS.map((p) => p.ref));
    const products: Product[] = PRODUCTS.map((p) => {
      const patch = overrides.get(p.ref);
      return patch ? { ...p, ...patch } : p;
    });

    // 2. Append new products from the sheet that don't exist in static data
    prodRows
      .filter((r) => str(r["Réf."]) && !str(r["Réf."]).startsWith("📌") && !staticRefs.has(str(r["Réf."])))
      .forEach((r) => {
        const ref = str(r["Réf."]);
        // Skip if we'd create a duplicate (same ref already added)
        if (products.some((p) => p.ref === ref)) return;
        products.push({
          ref,
          nameFr: str(r["Nom FR"] ?? r["Nom"]),
          nameDe: str(r["Nom DE"] ?? r["Nom"]),
          type: str(r["Type"]) as Product["type"] || "professionnel",
          size: str(r["Contenant"]),
          price: num(r["Prix EUR (HT)"]),
          retailPrice: num(r["Prix vente EUR"]) || undefined,
          category: str(r["Catégorie"]),
          subcategory: str(r["Sous-catégorie"]),
          promoEligible: false,
          status: (str(r["Statut"]).toLowerCase() || undefined) as Product["status"],
        });
      });

    const offers: Offer[] = offerRows
      .filter((r) => str(r["ID"]) && !str(r["ID"]).startsWith("📌"))
      .map((r) => ({
        id: str(r["ID"]),
        nameFr: str(r["Nom"]),
        nameDe: str(r["Nom"]),
        price: num(r["Prix EUR (HT)"]),
        description: str(r["Description"]),
        gift: str(r["Cadeau inclus"]),
      }));

    const productInfo: Record<string, ProductInfo> = { ...PRODUCT_INFO };
    descRows
      .filter((r) => str(r["Nom (clé)"]) && !str(r["Nom (clé)"]).startsWith("📌"))
      .forEach((r) => {
        const key = str(r["Nom (clé)"]);
        const existing = PRODUCT_INFO[key];
        const benefits = [str(r["Bénéfice 1"]), str(r["Bénéfice 2"]), str(r["Bénéfice 3"])].filter(Boolean);
        productInfo[key] = {
          description: str(r["Description"]) || existing?.description || "",
          // Prefer German description from sheet; fall back to static DE version
          descriptionDe: str(r["Description DE"]) || existing?.descriptionDe || str(r["Description"]) || "",
          benefits: benefits.length ? benefits : (existing?.benefits ?? []),
          // Sheet has no separate DE benefits column → keep static German benefits if they exist
          benefitsDe: existing?.benefitsDe ?? (benefits.length ? benefits : []),
          // Keep static image if sheet URL is empty
          imageUrl: str(r["URL Image"]) || existing?.imageUrl || undefined,
        };
      });

    // Debug: log category breakdown so issues can be spotted in Vercel logs
    const catCounts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("[catalog] categories from sheet merge:", JSON.stringify(catCounts));

    return { products, offers, productInfo };
  } catch (err) {
    console.error("Google Sheets unavailable, using static data:", err);
    return { products: PRODUCTS, offers: OFFERS, productInfo: PRODUCT_INFO };
  }
}
