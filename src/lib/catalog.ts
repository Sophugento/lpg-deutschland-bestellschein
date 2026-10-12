import { Product, Offer, PRODUCTS, OFFERS } from "@/data/products";
import { ProductInfo, PRODUCT_INFO } from "@/data/productInfo";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";

interface GvizTable {
  cols: { label: string; type: string }[];
  rows: ({ c: ({ v: unknown; f?: string } | null)[] } | null)[];
}

export async function fetchSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  if (!SHEET_ID) return [];
  // headers=1 forces gviz to use row 1 as header — avoids contaminated label bug
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${sheetName}`);
  // Force UTF-8 decoding — gviz sometimes sends Content-Type: charset=ISO-8859-1
  // even though the payload is UTF-8, which mangles German special characters.
  const buffer = await res.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buffer);
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
    return { products: PRODUCTS.filter((p) => p.status !== "inactif"), offers: OFFERS, productInfo: PRODUCT_INFO };
  }
  try {
    const [prodRows, offerRows, descRows] = await Promise.all([
      fetchSheet("Produkte"),
      fetchSheet("Sonderangebote"),
      fetchSheet("Descriptions & Images"),
    ]);

    // The sheet is the single source of truth: one product per sheet row, in sheet order.
    // Static data only supplies fields the sheet lacks (infoKey, promo fallback).
    const staticByRef = new Map(PRODUCTS.map((p) => [p.ref.split("-")[0], p]));
    const refCount = new Map<string, number>();
    const products: Product[] = prodRows
      .filter((r) => str(r["Réf."]) && !str(r["Réf."]).startsWith("📌"))
      .map((r) => {
        const baseRef = str(r["Réf."]);
        const n = (refCount.get(baseRef) || 0) + 1;
        refCount.set(baseRef, n);
        // LPG reuses some refs for different products; keep each row with a unique key
        const ref = n === 1 ? baseRef : `${baseRef}-${n}`;
        const base = n === 1 ? staticByRef.get(baseRef) : undefined;
        const promo = str(r["Promo éligible"]).toLowerCase();
        return {
          ref,
          nameFr: str(r["Nom FR"] ?? r["Nom"]),
          nameDe: str(r["Nom DE"] ?? r["Nom"]),
          infoKey: base?.infoKey,
          type: (str(r["Type"]) || "professionnel") as Product["type"],
          size: str(r["Contenant"]),
          price: num(r["Prix EUR (HT)"]),
          retailPrice: num(r["Prix vente EUR"]) || undefined,
          category: str(r["Catégorie"]),
          subcategory: str(r["Sous-catégorie"]),
          promoEligible: promo ? promo === "true" : base?.promoEligible ?? false,
          status: (str(r["Statut"]).toLowerCase() || undefined) as Product["status"],
        };
      });
    if (products.length === 0) throw new Error("Sheet 'Produkte' returned no products");

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

    // Remove products marked inactif (deleted from sheet but still in static data)
    const activeProducts = products.filter((p) => p.status !== "inactif");

    // Debug: log category breakdown so issues can be spotted in Vercel logs
    const catCounts = activeProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("[catalog] categories from sheet merge:", JSON.stringify(catCounts));

    return { products: activeProducts, offers, productInfo };
  } catch (err) {
    console.error("Google Sheets unavailable, using static data:", err);
    return { products: PRODUCTS.filter((p) => p.status !== "inactif"), offers: OFFERS, productInfo: PRODUCT_INFO };
  }
}
