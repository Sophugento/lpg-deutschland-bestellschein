import { NextRequest, NextResponse } from "next/server";

interface OrderLine {
  ref: string;
  name: string;
  type: string;
  size: string;
  qty: number;
  unitPrice: number;
  freeQty: number;
  lineTotal: number;
  description?: string;
  gift?: string;
}

interface Address {
  company: string;
  address: string;
  postalCode: string;
  city: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  sameDelivery: boolean;
}

interface OrderPayload {
  contact: ContactInfo;
  deliveryAddress: Address;
  orderLines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
}

function eur(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function buildHtml(payload: OrderPayload): string {
  const { contact, deliveryAddress, orderLines, subtotal, shipping, total } = payload;
  const date = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const labels = {
    title: "Bestellschein",
    date: `Datum: ${date}`,
    coord: "Kontaktdaten",
    delivery: "Lieferadresse",
    order: "Bestellung",
    ref: "Ref.",
    product: "Produkt",
    qty: "Anz.",
    unit: "E.P.",
    total: "Total",
    subtotal: "Zwischensumme",
    shipping: "Porto",
    shippingFree: "Gratis",
    grandTotal: "Total",
    totalTTC: "Total inkl. MwSt. (19%)",
    notes: "Bemerkungen",
    name: "Name",
    studio: "Firma / Studio",
    addr: "Adresse",
    email: "E-Mail",
    phone: "Tel.",
    typeRevente: "Verkauf",
    typeCabine: "Professionell",
    typeRecharge: "Nachfüllung",
  };

  const sameDelivery = contact.sameDelivery;
  const deliveryHtml = sameDelivery
    ? `<tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.delivery}</td><td style="font-size:13px">Gleich</td></tr>`
    : `<tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.delivery}</td><td style="font-size:13px">${deliveryAddress.company ? deliveryAddress.company + "<br>" : ""}${deliveryAddress.address}<br>${deliveryAddress.postalCode} ${deliveryAddress.city}</td></tr>`;

  const typeLabel = (type: string) => {
    if (type === "revente") return labels.typeRevente;
    if (type === "professionnel") return labels.typeCabine;
    if (type === "recharge") return labels.typeRecharge;
    return "";
  };

  const rows = orderLines.map((l) => {
    const tl = typeLabel(l.type);
    const detail = [tl, l.size].filter(Boolean).join(" – ");
    const descHtml = l.type === "offre" && (l.description || l.gift)
      ? `${l.description ? `<br><span style="font-size:11px;color:#bba8a1;font-weight:400">${l.description}</span>` : ""}${l.gift ? `<br><span style="font-size:11px;color:#d598aa;font-weight:400">🎁 ${l.gift}</span>` : ""}`
      : "";
    return `
    <tr style="border-bottom:1px solid #f0ebe9">
      <td style="padding:7px 8px;font-size:11px;color:#999">${l.ref}</td>
      <td style="padding:7px 8px;font-size:13px">${l.name}${detail ? ` <span style="color:#bba8a1;font-size:11px">(${detail})</span>` : ""}${descHtml}</td>
      <td style="padding:7px 8px;font-size:12px;text-align:center">${l.qty}${l.freeQty > 0 ? ` <span style="color:#d598aa">+${l.freeQty}</span>` : ""}</td>
      <td style="padding:7px 8px;font-size:12px;text-align:right">${eur(l.unitPrice)}</td>
      <td style="padding:7px 8px;font-size:13px;font-weight:600;text-align:right">${eur(l.lineTotal)}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f4f3;font-family:system-ui,sans-serif">
  <div style="max-width:620px;margin:24px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#d598aa,#c47d94);padding:28px 32px">
      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;letter-spacing:-0.5px">LPG Deutschland</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${labels.title} — ${date}</p>
    </div>
    <div style="padding:28px 32px">
      <h2 style="font-size:11px;color:#bba8a1;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">${labels.coord}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:4px 0;font-size:13px;color:#666;width:140px">${labels.name}</td><td style="font-size:13px;font-weight:600">${contact.firstName} ${contact.lastName}</td></tr>
        ${contact.company ? `<tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.studio}</td><td style="font-size:13px">${contact.company}</td></tr>` : ""}
        <tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.addr}</td><td style="font-size:13px">${contact.address}, ${contact.postalCode} ${contact.city}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.email}</td><td style="font-size:13px">${contact.email}</td></tr>
        ${contact.phone ? `<tr><td style="padding:4px 0;font-size:13px;color:#666">${labels.phone}</td><td style="font-size:13px">${contact.phone}</td></tr>` : ""}
        ${deliveryHtml}
      </table>

      <h2 style="font-size:11px;color:#bba8a1;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">${labels.order}</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ded5d1;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f7f4f3">
            <th style="padding:8px;font-size:10px;color:#bba8a1;text-align:left;font-weight:700">${labels.ref}</th>
            <th style="padding:8px;font-size:10px;color:#bba8a1;text-align:left;font-weight:700">${labels.product}</th>
            <th style="padding:8px;font-size:10px;color:#bba8a1;text-align:center;font-weight:700">${labels.qty}</th>
            <th style="padding:8px;font-size:10px;color:#bba8a1;text-align:right;font-weight:700">${labels.unit}</th>
            <th style="padding:8px;font-size:10px;color:#bba8a1;text-align:right;font-weight:700">${labels.total}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:5px 0;font-size:13px;color:#666">${labels.subtotal}</td><td style="font-size:13px;text-align:right">${eur(subtotal)}</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#666">${labels.shipping}</td><td style="font-size:13px;text-align:right">${shipping === 0 ? labels.shippingFree : eur(shipping)}</td></tr>
        <tr><td style="padding:10px 0 4px;font-size:16px;font-weight:700;border-top:2px solid #ded5d1">${labels.grandTotal}</td><td style="padding:10px 0 4px;font-size:16px;font-weight:700;text-align:right;border-top:2px solid #ded5d1;color:#d598aa">${eur(total)}</td></tr>
        <tr><td style="padding:3px 0;font-size:11px;color:#bba8a1">${labels.totalTTC}</td><td style="font-size:11px;text-align:right;color:#bba8a1">${eur(total * 1.19)}</td></tr>
      </table>

      ${contact.notes ? `<div style="margin-top:20px;padding:14px;background:#f7f4f3;border-radius:10px"><p style="margin:0;font-size:12px;color:#666"><strong>${labels.notes} :</strong> ${contact.notes}</p></div>` : ""}
    </div>
    <div style="background:#f7f4f3;padding:16px 32px;text-align:center;border-top:1px solid #ded5d1">
      <p style="margin:0;font-size:11px;color:#bba8a1">LPG Deutschland — ${labels.title} 2026</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const payload: OrderPayload = await req.json();
  const { contact, orderLines } = payload;

  if (!contact.email || !contact.firstName || orderLines.length === 0) {
    return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const orderEmail = process.env.ORDER_EMAIL || "customer.de@lpgdeutschland.com";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Resend API-Key fehlt — RESEND_API_KEY in Vercel > Settings > Environment Variables prüfen" },
      { status: 500 }
    );
  }

  const html = buildHtml(payload);
  const subject = `Bestellung — ${contact.firstName} ${contact.lastName}${contact.company ? " — " + contact.company : ""}`;

  let resendRes: Response;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `LPG Deutschland <${orderEmail}>`,
        to: [orderEmail],
        cc: [contact.email],
        subject,
        html,
      }),
    });
  } catch (e) {
    return NextResponse.json({ error: `Netzwerkfehler: ${e}` }, { status: 502 });
  }

  if (!resendRes.ok) {
    const body = await resendRes.json().catch(() => ({}));
    const msg = (body as { message?: string }).message ?? resendRes.statusText;
    return NextResponse.json(
      { error: `Resend (${resendRes.status}): ${msg}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
