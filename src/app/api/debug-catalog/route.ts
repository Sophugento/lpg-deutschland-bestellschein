import { getCatalog } from "@/lib/catalog";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary debug endpoint — shows category breakdown from live sheet data.
// Call: GET /api/debug-catalog
// Remove this file once the Technik issue is resolved.
export async function GET() {
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
