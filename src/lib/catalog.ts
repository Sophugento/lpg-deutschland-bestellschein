import { Product, Offer, PRODUCTS, OFFERS } from "@/data/products";
import { ProductInfo, PRODUCT_INFO } from "@/data/productInfo";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";

interface GvizTable {
  cols: { label: string; type: string }[];
  rows: ({ c: ({ v: unknown; f?: string } | null)[] } | null)[];
}

async function fetchSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  if (!SHEET_ID) return [];
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${sheetName}`);
  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  const table: GvizTable = JSON.parse(text.slice(start, end)).table;
  let labels = table.cols.map((c) => {
    const label = c.label.trim();
    const markerIdx = label.indexOf(" 📌");
    const cleaned = markerIdx >= 0 ? label.slice(0, markerIdx) : label;
    return cleanLabel(cleaned);
  });

  const dataRows = table.rows.filter((row) => row !== null && row.c !== null);

  // Excel imports leave col labels empty — use first data row as header instead
  if (labels.every((l) => l === "") && dataRows.length > 0) {
    labels = dataRows[0]!.c.map((cell) => String(cell?.v ?? "").trim());
    dataRows.shift();
  }

  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    row!.c.forEach((cell, i) => {
      obj[labels[i]] = cell?.v ?? "";
    });
    return obj;
  });
}

// Known column headers sorted longest-first so multi-word names match before single words
const KNOWN_HEADERS = [
  "Prix vente EUR", "Sous-catégorie", "Promo éligible", "Prix EUR (HT)",
  "Nom (clé)", "Description DE", "Cadeau inclus", "URL Image",
  "Contenant", "Catégorie", "Bénéfice 1", "Bénéfice 2", "Bénéfice 3",
  "Description", "Statut", "Type", "Nom", "Réf.", "ID",
];

// gviz sometimes embeds all column values in the label (e.g. "Réf. 102435100 102435200…").
// Strip everything after the known header prefix so lookups like r["Réf."] still work.
function cleanLabel(label: string): string {
  for (const h of KNOWN_HEADERS) {
    if (label === h || label.startsWith(h + " ")) return h;
  }
  // Fallback: cut at first digit (handles unknown numeric columns)
  const di = label.search(/\d/);
  return di > 0 ? label.slice(0, di).trim() : label;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}
function num(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}
function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "true";
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

    // Build ref → infoKey map from static data so sheet name changes never break the "i" button
    const staticInfoKey = new Map(PRODUCTS.map((p) => [p.ref, p.infoKey ?? p.nameFr]));

    const products: Product[] = prodRows
      .filter((r) => str(r["Réf."]) && !str(r["Réf."]).startsWith("📌"))
      .map((r) => ({
        ref: str(r["Réf."]),
        nameFr: str(r["Nom"]),
        nameDe: str(r["Nom"]),
        infoKey: staticInfoKey.get(str(r["Réf."])) ?? str(r["Nom"]),
        type: str(r["Type"]) as Product["type"],
        size: str(r["Contenant"]),
        price: num(r["Prix EUR (HT)"]),
        retailPrice: num(r["Prix vente EUR"]) || undefined,
        category: str(r["Catégorie"]),
        subcategory: str(r["Sous-catégorie"]),
        promoEligible: bool(r["Promo éligible"]),
        status: (str(r["Statut"]).toLowerCase() || undefined) as Product["status"],
      }));

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
        const benefits = [str(r["Bénéfice 1"]), str(r["Bénéfice 2"]), str(r["Bénéfice 3"])].filter(Boolean);
        productInfo[key] = {
          description: str(r["Description"]),
          descriptionDe: str(r["Description DE"]),
          benefits,
          benefitsDe: benefits,
          imageUrl: str(r["URL Image"]) || undefined,
        };
      });

    return {
      products: products.length > 0 ? products : PRODUCTS,
      offers,
      productInfo,
    };
  } catch (err) {
    console.error("Google Sheets unavailable, using static data:", err);
    return { products: PRODUCTS, offers: OFFERS, productInfo: PRODUCT_INFO };
  }
}
