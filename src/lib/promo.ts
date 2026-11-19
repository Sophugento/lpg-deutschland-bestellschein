// Server-side only: never import from a client component, so the codes stay out of the page bundle.
// A valid code waives the minimum order value and the shipping cost.
const PROMO_CODES = ["LPG-E92BNE"];

export function normalizePromo(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export function isValidPromo(code: unknown): boolean {
  return PROMO_CODES.includes(normalizePromo(code));
}
