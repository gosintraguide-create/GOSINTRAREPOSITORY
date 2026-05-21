// ─── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch (_) {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    // If the ISO string has a non-midnight time component, format it
    if (d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0) {
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    // Fall back to the raw "HH:MM" part of the string if present
    const match = dateStr.match(/T(\d{2}:\d{2})/);
    if (match) {
      const [h, m] = match[1].split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
    }
    return "";
  } catch (_) {
    return "";
  }
}

const PICKUP_LABELS: Record<string, string> = {
  "sintra-train-station": "Sintra Train Station",
  "sintra-town-center": "Sintra Town Center",
  "pena-palace": "Pena Palace",
  "moorish-castle": "Moorish Castle",
  "sintra-palace": "Sintra National Palace",
  "other": "Will decide on the day",
};

function pickupLabel(value: string): string {
  return PICKUP_LABELS[value] || value;
}

// ─── Shared CSS / layout helpers ────────────────────────────────────────────────

const BASE_STYLE = `
  margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  background-color:#f0f2f4;color:#1a1f2e;
`;

function wrapper(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="${BASE_STYLE}">
  <div style="max-width:620px;margin:32px auto 48px;padding:0 16px;">
    ${inner}
  </div>
</body>
</html>`.trim();
}

function header(title: string, subtitle: string): string {
  return `
    <div style="background:linear-gradient(160deg,#0A4D5C 0%,#0d6175 100%);border-radius:16px 16px 0 0;padding:44px 36px 36px;text-align:center;">
      <p style="margin:0 0 20px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Go Sintra</p>
      <h1 style="margin:0 0 10px;color:#ffffff;font-size:30px;font-weight:800;line-height:1.2;">${title}</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;line-height:1.5;">${subtitle}</p>
      <div style="margin-top:24px;height:3px;background:linear-gradient(90deg,transparent,#D97843,transparent);border-radius:2px;"></div>
    </div>`;
}

function card(inner: string, extra = ""): string {
  return `<div style="background:#ffffff;border-radius:12px;padding:24px 28px;margin:12px 0;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #e8eaed;${extra}">${inner}</div>`;
}

function sectionLabel(text: string): string {
  return `<p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0A4D5C;">${text}</p>`;
}

function detailRow(label: string, value: string, last = false): string {
  return `
    <tr>
      <td style="padding:10px 0 ${last ? "0" : "10px"};border-bottom:${last ? "none" : "1px solid #f0f2f4"};color:#6b7280;font-size:14px;width:45%;vertical-align:top;">${label}</td>
      <td style="padding:10px 0 ${last ? "0" : "10px"};border-bottom:${last ? "none" : "1px solid #f0f2f4"};color:#1a1f2e;font-size:14px;font-weight:600;text-align:right;vertical-align:top;">${value}</td>
    </tr>`;
}

function totalRow(label: string, value: string): string {
  return `
    <tr>
      <td colspan="2" style="padding-top:16px;"><div style="height:1px;background:#D97843;opacity:0.4;margin-bottom:16px;"></div></td>
    </tr>
    <tr>
      <td style="color:#0A4D5C;font-size:15px;font-weight:700;">${label}</td>
      <td style="color:#0A4D5C;font-size:22px;font-weight:800;text-align:right;">${value}</td>
    </tr>`;
}

function stepItem(icon: string, title: string, body: string): string {
  return `
    <div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid #f0f2f4;">
      <div style="flex-shrink:0;width:38px;height:38px;border-radius:50%;background:#f0f7f9;display:flex;align-items:center;justify-content:center;font-size:18px;text-align:center;line-height:38px;">${icon}</div>
      <div>
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1a1f2e;">${title}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${body}</p>
      </div>
    </div>`;
}

function contactCard(): string {
  return card(`
    ${sectionLabel("Need help?")}
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;padding-right:12px;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">WhatsApp</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1f2e;">+351 932 967 279</p>
        </td>
        <td style="vertical-align:top;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Email</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1f2e;">hoponsintra@gmail.com</p>
        </td>
      </tr>
    </table>
  `, "border-left:4px solid #D97843;");
}

function footer(): string {
  return `
    <div style="background:#0A4D5C;border-radius:0 0 16px 16px;padding:28px 36px;text-align:center;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#ffffff;">Go Sintra</p>
      <p style="margin:0 0 16px;font-size:12px;color:#D97843;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Private Tours &amp; Hop-On Service</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">hoponsintra@gmail.com &nbsp;·&nbsp; +351 932 967 279 &nbsp;·&nbsp; Sintra, Portugal</p>
    </div>`;
}


// ===== TOUR BOOKING CONFIRMATION =====

export function generateTourBookingConfirmationHTML(data: {
  customerName: string;
  bookingId: string;
  tourTitle: string;
  tourDate: string;
  numberOfPeople: number;
  totalPrice: number;
  specialRequests?: string;
}): string {
  const { customerName, bookingId, tourTitle, tourDate, numberOfPeople, totalPrice, specialRequests } = data;

  const formattedDate = formatDate(tourDate);
  const tourTime = formatTime(tourDate);
  const bookingRef = bookingId.replace(/^TB-/, "").slice(-8).toUpperCase();

  const detailsCard = card(`
    ${sectionLabel("Booking details")}
    <table style="width:100%;border-collapse:collapse;">
      ${detailRow("Reference", `#${bookingRef}`)}
      ${detailRow("Tour", tourTitle)}
      ${detailRow("Date", formattedDate)}
      ${tourTime ? detailRow("Start time", tourTime) : ""}
      ${detailRow("Guests", `${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}`)}
      ${specialRequests ? detailRow("Special requests", specialRequests) : ""}
      ${totalRow("Total paid", `€${totalPrice.toFixed(2)}`)}
    </table>
  `);

  const nextStepsCard = card(`
    ${sectionLabel("What happens next")}
    ${stepItem("📧", "Confirmation saved", "This email is your booking record — no need to print anything.")}
    ${stepItem("📱", "Guide contacts you", "Your dedicated guide will WhatsApp or call you 24 hours before the tour with the exact meeting point.")}
    ${stepItem("☀️", "Enjoy!", "Your guide is exclusively yours for the day — just turn up and let us take care of the rest.")}
  `);

  const body = `
    ${header("Your private tour<br>is confirmed! 🎉", `We can't wait to show you Sintra, ${customerName}.`)}
    <div style="background:#ffffff;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;padding:0 8px;">
      ${detailsCard}
      ${nextStepsCard}
      ${contactCard()}
    </div>
    ${footer()}
  `;

  return wrapper(body);
}


// ===== TOUR QUOTE REQUEST ACKNOWLEDGEMENT =====

export function generateTourQuoteRequestHTML(data: {
  customerName: string;
  requestId: string;
  tourTitle: string;
  tourDate: string;
  numberOfPeople: number;
  specialRequests?: string;
}): string {
  const { customerName, requestId, tourTitle, tourDate, numberOfPeople, specialRequests } = data;

  const formattedDate = formatDate(tourDate);
  const refId = requestId.replace(/^QR-/, "").slice(-8).toUpperCase();

  const detailsCard = card(`
    ${sectionLabel("Your request")}
    <table style="width:100%;border-collapse:collapse;">
      ${detailRow("Reference", `#${refId}`)}
      ${detailRow("Tour", tourTitle)}
      ${detailRow("Preferred date", formattedDate)}
      ${detailRow("Group size", `${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}`, !specialRequests)}
      ${specialRequests ? detailRow("Special requests", specialRequests, true) : ""}
    </table>
  `);

  const nextStepsCard = card(`
    ${sectionLabel("What happens next")}
    ${stepItem("🔍", "We review your request", "Our team will put together a personalised quote tailored to your group and preferences.")}
    ${stepItem("📩", "Quote within 24 hours", "We'll email you a detailed proposal — no payment until you're happy to confirm.")}
    ${stepItem("✅", "Confirm when ready", "Reply to the quote email or WhatsApp us to lock in your tour. That's it!")}
  `);

  const body = `
    ${header("Quote request received ✉️", `Thanks ${customerName} — we'll be in touch within 24 hours.`)}
    <div style="background:#ffffff;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;padding:0 8px;">
      ${detailsCard}
      ${nextStepsCard}
      ${contactCard()}
    </div>
    ${footer()}
  `;

  return wrapper(body);
}


// ===== HOP-ON DAY PASS CONFIRMATION =====

export function generateBookingConfirmationHTML(data: {
  customerName: string;
  bookingId: string;
  formattedDate: string;
  totalPrice: number;
  dayPassCount: number;
  pickupLocation?: string;
  timeSlot?: string;
  [key: string]: any;
}): string {
  const { customerName, bookingId, formattedDate, totalPrice, dayPassCount, pickupLocation, timeSlot } = data;

  const bookingRef = (bookingId.split("_")[1] || bookingId).toUpperCase();
  const pickup = pickupLocation ? pickupLabel(pickupLocation) : null;

  // Prominent pickup card — most important info for the customer
  const pickupCard = pickup ? `
    <div style="background:linear-gradient(135deg,#0A4D5C 0%,#0d6175 100%);border-radius:12px;padding:22px 24px;margin:12px 0;color:#ffffff;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.65);">📍 Your first boarding point</p>
      <p style="margin:0 0 4px;font-size:22px;font-weight:800;">${pickup}</p>
      ${timeSlot ? `<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">First departure at <strong>${timeSlot}</strong> — just show your QR code to board</p>` : `<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">Show your QR code to board at any stop from 9:00 AM</p>`}
    </div>
  ` : "";

  const qrCard = card(`
    ${sectionLabel("📎 Your passes (PDF attached)")}
    <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
      We've attached a PDF with <strong>${dayPassCount} ${dayPassCount === 1 ? "pass" : "passes"}</strong>.
      Save it to your phone and show the QR code when boarding any of our vehicles — one QR per person.
    </p>
  `, "border-left:4px solid #D97843;");

  const detailsCard = card(`
    ${sectionLabel("Pass details")}
    <table style="width:100%;border-collapse:collapse;">
      ${detailRow("Booking ref", `#${bookingRef}`)}
      ${detailRow("Name", customerName)}
      ${detailRow("Valid for", formattedDate)}
      ${detailRow("Service hours", "9:00 AM – 7:00 PM")}
      ${detailRow("Passes", `${dayPassCount} ${dayPassCount === 1 ? "person" : "people"}`)}
      ${totalRow("Total paid", `€${totalPrice.toFixed(2)}`)}
    </table>
  `);

  const howItWorksCard = card(`
    ${sectionLabel("How it works")}
    ${stepItem("🎟️", "Show your QR code", "When you board any of our vehicles, open the PDF and show your personal QR code to the driver.")}
    ${stepItem("🔄", "Hop on, hop off", "Unlimited rides all day across all stops — leave and re-join the route as many times as you like.")}
    ${stepItem("🕐", "Consistent service all day", "Vehicles run continuously from 9 AM to 7 PM. No need to book a seat — just show up at any stop.")}
    ${stepItem("🎙️", "Professional guides", "Every vehicle has a certified local guide sharing stories and history along the way.")}
  `);

  const manageButton = `
    <div style="text-align:center;padding:20px 0;">
      <a href="https://www.hoponsintra.com/manage-booking?id=${bookingId}"
         style="display:inline-block;background:#D97843;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">
        View / Manage My Pass →
      </a>
    </div>
  `;

  const body = `
    ${header("Your day pass is ready! 🎉", `Excited to have you on board, ${customerName}.`)}
    <div style="background:#ffffff;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;padding:8px 8px 0;">
      ${qrCard}
      ${pickupCard}
      ${detailsCard}
      ${howItWorksCard}
      ${contactCard()}
      ${manageButton}
    </div>
    ${footer()}
  `;

  return wrapper(body);
}
