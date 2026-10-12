import { getCatalog, fetchSheet } from "@/lib/catalog";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary debug endpoint. ?q=TEXT returns raw "Produkte" sheet rows containing TEXT.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (q) {
    const rows = await fetchSheet("Produkte");
    const needle = q.toUpperCase();
    return NextResponse.json(rows.filter((r) => JSON.stringify(r).toUpperCase().includes(needle)));
  }

  const catalog = await getCatalog();
  const byCategory = catalog.products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push({ ref: p.ref, nameDe: p.nameDe, type: p.type });
    return acc;
  }, {} as Record<string, { ref: string; nameDe: string; type: string }[]>);

  return NextResponse.json({
    totalProducts: catalog.products.length,
    totalOffers: catalog.offers.length,
    categories: byCategory,
  });
}
