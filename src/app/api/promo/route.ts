import { NextRequest, NextResponse } from "next/server";
import { isValidPromo, normalizePromo } from "@/lib/promo";

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: "" }));
  return NextResponse.json({ valid: isValidPromo(code), code: normalizePromo(code) });
}
