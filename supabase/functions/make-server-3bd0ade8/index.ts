import {installCityPickups} from './city-pickups.ts';
import {installAdminOperations,adminChangeAudit} from './admin-operations.ts';
import {createStaffPasswordLogin} from './staff-login.ts';
import {installStaffCardSales} from './staff-card-sales.ts';
import {installMerchantPerks} from './merchant-perks.ts';
import {installCityCards} from './city-cards.ts';
import {cityBoardingError} from './city-card-product.ts';
import {installCustomerPickups} from './customer-pickups.ts';
import {createRidePurchaseGuard} from './ride-purchases.ts';
// v2 — adds /stripe-config endpoint
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";


import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";
import { handlePaymentWebhook } from "./payment-webhook.ts";
import { installDriverAccounts } from "./driver-accounts.ts";
import { createStaffGuard, resolveStaff } from "./staff-access.ts";
import { installPickupTransitions } from "./pickup-transitions.ts";
import { authorizeAdmin, createAdminGuard } from "./admin-auth.ts";
import { createAdminLogin } from "./admin-login.ts";
import { reconcileCheckoutHold } from "./checkout-holds.ts";
import { createBookingAccessGuard } from "./booking-access.ts";
import { readCheckinHistory } from "./checkin-history.ts";
import { priceTicket, priceTour, priceAddon, verifyTicketPayment } from "./ticket-payment.ts";
import { generateBookingConfirmationHTML, generateTourBookingConfirmationHTML, generateTourQuoteRequestHTML } from "./email_template.ts";
import { cleanupDatabase, removeLegacyBranding, cleanupOldAvailability } from "./cleanup.ts";

// Retry wrapper for KV store operations to handle transient connection errors
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Only retry on connection errors
      const isConnectionError = 
        errorMessage.includes('Connection reset') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT');
      
      if (!isConnectionError || attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${attempt} attempts:`, errorMessage);
        throw error;
      }
      
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
    }
  }
  
  throw lastError;
}

// Wrapped KV operations with retry logic
const kvWithRetry = {
  get: <T>(key: string): Promise<T> => 
    withRetry(() => kv.get(key), `KV get(${key})`),
  
  set: (key: string, value: any): Promise<void> => 
    withRetry(() => kv.set(key, value), `KV set(${key})`),
  
  del: (key: string): Promise<void> => 
    withRetry(() => kv.del(key), `KV del(${key})`),
  
  mget: <T>(keys: string[]): Promise<T[]> => 
    withRetry(() => kv.mget(keys), `KV mget([${keys.length} keys])`),
  
  mset: (keys: string[], values: any[]): Promise<void> => 
    withRetry(() => kv.mset(keys, values), `KV mset([${keys.length} keys])`),
  
  mdel: (keys: string[]): Promise<void> => 
    withRetry(() => kv.mdel(keys), `KV mdel([${keys.length} keys])`),
  
  getByPrefix: <T>(prefix: string): Promise<T[]> =>
    withRetry(() => kv.getByPrefix(prefix), `KV getByPrefix(${prefix})`),
};

// ===== AUTO-TRANSLATION (Anthropic Claude) =====

const TARGET_LANGUAGES: Record<string, string> = {
  pt: 'Portuguese', es: 'Spanish', fr: 'French',
  de: 'German',     nl: 'Dutch',   it: 'Italian',
};

async function callClaude(prompt: string, maxTokens = 4096): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping auto-translation');
    return null;
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch (err) {
    console.error('Anthropic API error:', err);
    return null;
  }
}

function extractJson(text: string): Record<string, any> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

async function translateTourContent(tour: any): Promise<Record<string, any> | null> {
  const fields: Record<string, any> = { title: tour.title, description: tour.description };
  if (tour.longDescription) fields.longDescription = tour.longDescription;
  if (tour.features?.length)  fields.features       = tour.features;
  if (tour.badge)             fields.badge           = tour.badge;
  if (tour.buttonText)        fields.buttonText      = tour.buttonText;
  if (tour.priceSubtext)      fields.priceSubtext    = tour.priceSubtext;

  const langList = Object.entries(TARGET_LANGUAGES).map(([k, v]) => `"${k}" (${v})`).join(', ');
  const prompt = `Translate the following private tour content into these languages: ${langList}.
Return a single valid JSON object whose keys are the language codes (pt, es, fr, de, nl, it). Each key maps to an object with the same fields as the input JSON below. Rules:
- Keep proper nouns (Sintra, Pena Palace, Quinta da Regaleira, Moorish Castle, etc.) in their conventional target-language form where one exists, otherwise leave unchanged.
- Use a warm, inviting tourism tone that matches the English original.
- "features" must remain an array of strings.
- Return ONLY the JSON — no markdown, no explanation.

Input:
${JSON.stringify(fields, null, 2)}`;

  const text = await callClaude(prompt, 4096);
  if (!text) return null;
  const result = extractJson(text);
  if (!result) { console.error('Translation: could not parse JSON from Claude response'); return null; }
  return result;
}

async function translateBlogArticle(article: any): Promise<Record<string, any> | null> {
  const en = article.translations?.en;
  if (!en?.title) return null; // nothing to translate

  const fields: Record<string, any> = { title: en.title };
  if (en.excerpt) fields.excerpt = en.excerpt;
  if (en.seo)     fields.seo     = { title: en.seo.title, description: en.seo.description };

  const langList = Object.entries(TARGET_LANGUAGES).map(([k, v]) => `"${k}" (${v})`).join(', ');
  const prompt = `Translate the following blog article metadata into: ${langList}.
Return a single valid JSON object with keys pt, es, fr, de, nl, it. Each maps to an object with the same fields. Keep proper nouns in their conventional form. Warm, readable tone. Return ONLY the JSON.

Input:
${JSON.stringify(fields, null, 2)}`;

  const text = await callClaude(prompt, 2048);
  if (!text) return null;
  return extractJson(text);
}

const app = new Hono();

// Middleware - Allow all origins for development
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow all localhost origins
      if (origin?.includes("localhost")) return origin;

      // Allow all Vercel preview and production URLs
      if (origin?.includes("vercel.app")) return origin;

      // Allow specific production domains
      const allowedDomains = [
        "https://go-sintra.vercel.app",
        "https://hoponsintra.com",
        "https://www.hoponsintra.com",
      ];

      if (allowedDomains.includes(origin || "")) return origin;

      // For development, allow all origins
      return origin || "*";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Booking-Token"],
  }),
);
app.use("*", logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

app.use("/make-server-3bd0ade8/*", createAdminGuard((token) => supabase.auth.getUser(token)));
app.use("/make-server-3bd0ade8/*",adminChangeAudit(supabase));
const getDriverProfiles = async () => (await kvWithRetry.get("drivers_list") as any[]) || [];
const resolveSellerStaff = (token?:string) => resolveStaff(token, {
 getUser: token => supabase.auth.getUser(token), getDrivers: getDriverProfiles,
 sessionActive: async (userId, sessionId) => {
  const {data,error}=await supabase.rpc('driver_session_active',{p_user_id:userId,p_session_id:sessionId});
  if(error)throw new Error('Session verification unavailable');return data===true;
 },
});
app.use("/make-server-3bd0ade8/*", createStaffGuard(resolveSellerStaff));


app.use("/make-server-3bd0ade8/*", createBookingAccessGuard(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", async (auth) => await authorizeAdmin(auth, token => supabase.auth.getUser(token)) === 200, async id => {
  const { data, error } = await supabase.rpc("allow_booking_login", { p_id: id });
  if (error) throw new Error("Booking sign-in temporarily unavailable");
  return data === true;
}));

app.use('/make-server-3bd0ade8/*',createRidePurchaseGuard({get:kv.get,set:kv.set,isAdmin:async auth=>await authorizeAdmin(auth,token=>supabase.auth.getUser(token))===200}));

app.get("/make-server-3bd0ade8/admin/session", (c) => c.json({ success: true }));
app.post("/make-server-3bd0ade8/admin/login", createAdminLogin({
  allowAttempt: async () => {
    const { data, error } = await supabase.rpc('allow_admin_login');
    if (error) throw error;
    return data === true;
  },
  signIn: async (email, password) => {
    // Never sign in on the shared service-role client: that changes its session.
    const authClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return await authClient.auth.signInWithPassword({ email, password });
  },
}));

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

app.post('/make-server-3bd0ade8/staff/login',createStaffPasswordLogin((path,body)=>app.request('/make-server-3bd0ade8'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})));
installMerchantPerks(app, supabase);
installStaffCardSales(app,{db:supabase,get:kv.get,staff:resolveSellerStaff,qr:generateQRCode,send:sendBookingEmail});
const cityCards = installCityCards(app, {db:supabase, stripe, get:kv.get, qr:generateQRCode,
  returnUrl:`${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-3bd0ade8/city-cards/checkout-return`});

installAdminOperations(app,{db:supabase,stripe,get:kv.get,send:sendBookingEmail,reconcile:cityCards.reconcile});

// Generate unique Go Sintra booking ID with sequential letter prefixes
async function getNextAvailablePrefix(): Promise<string> {
  const currentPrefixData = await kvWithRetry.get("booking_current_prefix");
  let currentPrefix = currentPrefixData || "AA";

  for (let num = 1000; num <= 9999; num++) {
    const testId = `${currentPrefix}-${num}`;
    const exists = await kvWithRetry.get(testId);
    if (!exists) {
      return currentPrefix;
    }
  }

  console.log(`📝 Prefix ${currentPrefix} exhausted, moving to next...`);
  const nextPrefix = getNextPrefix(currentPrefix);
  await kvWithRetry.set("booking_current_prefix", nextPrefix);
  console.log(`✅ New prefix: ${nextPrefix}`);
  return nextPrefix;
}

function getNextPrefix(current: string): string {
  const first = current.charCodeAt(0) - 65; 
  const second = current.charCodeAt(1) - 65; 

  let newSecond = second + 1;
  let newFirst = first;

  if (newSecond > 25) {
    newSecond = 0;
    newFirst = first + 1;
  }

  if (newFirst > 25) {
    console.warn("🚀 MILESTONE: Moving to 3-letter prefix system (AAA-####)");
    return "AAA";
  }

  const newPrefix = String.fromCharCode(65 + newFirst) + String.fromCharCode(65 + newSecond);
  return newPrefix;
}

async function generateBookingId(): Promise<string> {
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const prefix = await getNextAvailablePrefix();
      const number = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `${prefix}-${number}`;
      const existing = await kvWithRetry.get(bookingId);
      if (!existing) {
        console.log(`🎫 Generated booking ID: ${bookingId}`);
        return bookingId;
      }
    } catch (error) {
      console.error(`Error generating booking ID (attempt ${attempt + 1}):`, error);
    }
  }
  const timestamp = Date.now().toString().slice(-6);
  return `FB-${timestamp}`; 
}

// Initialize database on startup
async function initializeDatabase() {
  try {
    const dbInitialized = await kvWithRetry.get("db_initialized");
    if (dbInitialized) {
      console.log("✅ Database already initialized, skipping setup");
      return;
    }
    console.log("🔧 First-time database initialization...");
    await kvWithRetry.set("website_content", {
      initialized: true,
      lastUpdated: new Date().toISOString(),
    });
    await kvWithRetry.set("pricing_config", {
      dayPass: { adult: 25, child: 15, infant: 0 },
      guidedTour: { private: 150, small: 35 },
    });
    await kvWithRetry.set("db_initialized", {
      initialized: true,
      timestamp: new Date().toISOString(),
      version: "1.0",
    });
    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}
initializeDatabase();

async function commitDayPass(booking: any, paymentId: string | null = null) {
  const { data, error } = await supabase.rpc("commit_day_pass", { p_booking: booking, p_payment_id: paymentId });
  if (error) throw new Error(error.message);
  if (!data?.booking) throw new Error("Booking transaction did not complete");
  return data;
}

// Generate QR code
async function generateQRCode(bookingId: string, passengerIndex: number): Promise<string> {
  const qrData = `${bookingId}|${passengerIndex}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 300,
    margin: 2,
    color: { dark: "#0A4D5C", light: "#FFFFFF" },
  });
  return qrCodeDataUrl;
}

// Generate PDF
async function generateBookingPDF(booking: any, qrCodes: string[]): Promise<string> {
  // Human-readable pickup location labels
  const PICKUP_LABELS: Record<string, string> = {
    "sintra-train-station": "Sintra Train Station",
    "sintra-town-center": "Sintra Town Center",
    "pena-palace": "Pena Palace",
    "moorish-castle": "Moorish Castle",
    "sintra-palace": "Sintra National Palace",
    "other": "Decide on the day",
  };

  try {
    console.log(`🔧 Starting PDF generation for booking ${booking.id}`);
    const pdfDoc = await PDFDocument.create();
    const ticketFont = await pdfDoc.embedFont('Helvetica');
    if(booking.product==='city-card-v1') {const created=new Date(booking.createdAt);pdfDoc.setCreationDate(created);pdfDoc.setModificationDate(created);}

    const shortDate = new Date(booking.selectedDate).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const bookingRef = (booking.id.split("_")[1] || booking.id).toUpperCase();
    const pickupLabel = booking.pickupLocation ? (PICKUP_LABELS[booking.pickupLocation] || booking.pickupLocation) : null;
    const timeSlot = booking.timeSlot || null;

    // ── Colours ────────────────────────────────────────────────────────────
    const teal      = rgb(0.039, 0.302, 0.361);   // #0A4D5C
    const orange    = rgb(0.851, 0.471, 0.263);   // #D97843
    const white     = rgb(1, 1, 1);
    const offWhite  = rgb(0.969, 0.969, 0.969);   // light rule
    const textDark  = rgb(0.102, 0.122, 0.18);    // #1a1f2e
    const textGray  = rgb(0.42, 0.447, 0.533);
    const tealLight = rgb(0.922, 0.953, 0.961);   // teal/10 for pickup bg

    for (let i = 0; i < booking.passengers.length; i++) {
      const passenger = booking.passengers[i];
      const cardColor = booking.product==='city-card-v1' ? (passenger.ageBand==='free' ? rgb(.4,.4,.4) : passenger.ageBand==='half' ? orange : teal) : teal;
      const qrCode = qrCodes[i];
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      // ── Background ───────────────────────────────────────────────────────
      page.drawRectangle({ x: 0, y: 0, width, height, color: white });

      // ── Header band ──────────────────────────────────────────────────────
      const headerH = 115;
      page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: cardColor });
      // Orange accent bar
      page.drawRectangle({ x: 0, y: height - headerH - 4, width, height: 4, color: orange });

      // "GO SINTRA" centred
      const brandText = booking.product === "city-card-v1" ? "HOP ON SINTRA" : "GO SINTRA";
      page.drawText(brandText, {
        x: width / 2 - brandText.length * 10.5,
        y: height - 52, size: 32, color: white,
      });
      // "HOP-ON DAY PASS" subtitle
      const subText = booking.product === "city-card-v1" ? "CITY CARD" : "HOP-ON DAY PASS";
      page.drawText(subText, {
        x: width / 2 - subText.length * 5.4,
        y: height - 82, size: 14, color: booking.product==='city-card-v1'?white:orange,
      });
      // Passenger counter badge (only when multiple passes)
      if (booking.passengers.length > 1) {
        const badge = `PASS ${i + 1} OF ${booking.passengers.length}`;
        page.drawText(badge, {
          x: width / 2 - badge.length * 3.5,
          y: height - 105, size: 9,
          color: rgb(0.941, 0.914, 0.894),
        });
      }

      // ── Passenger name ───────────────────────────────────────────────────
      const passengerName = (passenger.name || passenger.fullName || `Passenger ${i + 1}`).toUpperCase();
      page.drawText("PASSENGER", {
        x: width / 2 - "PASSENGER".length * 3.5,
        y: height - 148, size: 9, color: textGray,
      });
      // Scale font size so long names still fit
      const nameSize = Math.min(22, 485 / ticketFont.widthOfTextAtSize(passengerName,1));
      page.drawText(passengerName, {
        x: (width-ticketFont.widthOfTextAtSize(passengerName,nameSize))/2,
        y: height - 172, size: nameSize, color: teal,
      });

      // ── QR code ──────────────────────────────────────────────────────────
      const qrSize = 240;
      const qrX = (width - qrSize) / 2;
      const qrTop = height - 200; // top of QR area
      const qrBottom = qrTop - qrSize;

      // QR border card (white + teal border)
      page.drawRectangle({
        x: qrX - 14, y: qrBottom - 14,
        width: qrSize + 28, height: qrSize + 28,
        color: white,
        borderColor: teal, borderWidth: 3,
        borderOpacity: 0.25,
      });

      if (qrCode) {
        try {
          const qrBase64 = qrCode.replace(/^data:image\/png;base64,/, "");
          const qrImageBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));
          const qrImage = await pdfDoc.embedPng(qrImageBytes);
          page.drawImage(qrImage, { x: qrX, y: qrBottom, width: qrSize, height: qrSize });
        } catch (err) {
          if(booking.product==='city-card-v1')throw err;
          console.error(`Error adding QR code`, err);
        }
      }

      // "SCAN TO BOARD" label below QR
      const scanLabel = "SCAN TO BOARD";
      page.drawText(scanLabel, {
        x: width / 2 - scanLabel.length * 4,
        y: qrBottom - 26, size: 11, color: textGray,
      });

      // ── Pickup location card ──────────────────────────────────────────────
      let detailsY = qrBottom - 60;

      if (pickupLabel) {
        const cardX = 55;
        const cardW = width - 110;
        const cardH = 56;
        page.drawRectangle({ x: cardX, y: detailsY - cardH, width: cardW, height: cardH, color: tealLight });
        // Left orange accent stripe
        page.drawRectangle({ x: cardX, y: detailsY - cardH, width: 4, height: cardH, color: orange });

        page.drawText("FIRST BOARDING POINT", {
          x: cardX + 16, y: detailsY - 16, size: 8, color: textGray,
        });
        const plSize = pickupLabel.length > 22 ? 13 : 15;
        page.drawText(pickupLabel, {
          x: cardX + 16, y: detailsY - 36, size: plSize, color: teal,
        });
        if (timeSlot) {
          page.drawText(`First departure: ${timeSlot}`, {
            x: cardX + 16, y: detailsY - 52, size: 9, color: textGray,
          });
        }
        detailsY -= cardH + 22;
      }

      // ── Details row ──────────────────────────────────────────────────────
      const lx = 75;
      const rx = width / 2 + 45;

      page.drawText("DATE", { x: lx, y: detailsY, size: 9, color: textGray });
      page.drawText(shortDate, { x: lx, y: detailsY - 18, size: 13, color: textDark });

      page.drawText("TYPE", { x: rx, y: detailsY, size: 9, color: textGray });
      page.drawText(booking.product==='city-card-v1' ? ({full:'Full price (12+)',half:'Half price (7-11)',free:'Free (under 7)'}[passenger.ageBand]||'City Card') : passenger.type || "Adult", { x: rx, y: detailsY - 18, size: 13, color: textDark });
      detailsY -= 52;

      page.drawText("VALID HOURS", { x: lx, y: detailsY, size: 9, color: textGray });
      page.drawText(booking.transportHours ? `${booking.transportHours.opens} - ${booking.transportHours.closes} Lisbon` : "9:00 AM – 7:00 PM", { x: lx, y: detailsY - 18, size: 13, color: textDark });

      page.drawText("BOOKING REF", { x: rx, y: detailsY, size: 9, color: textGray });
      page.drawText(bookingRef, { x: rx, y: detailsY - 18, size: bookingRef.length>25?7:13, color: textDark });
      detailsY -= 52;

      // ── Divider ───────────────────────────────────────────────────────────
      page.drawRectangle({ x: 55, y: detailsY, width: width - 110, height: 1, color: offWhite });
      detailsY -= 22;

      // ── Instructions ─────────────────────────────────────────────────────
      const instr1 = booking.product==='city-card-v1' ? 'Unlimited routes during operating hours. Private/sunset tours excluded.' : "Show QR code to driver  •  Unlimited rides all day  •  9 AM – 7 PM";
      const instr2 = booking.product==='city-card-v1' ? (passenger.ageBand==='full' ? 'Partner perks valid throughout the visit date. No attraction admission.' : passenger.ageBand==='free' ? 'No tuk-tuks. Full-price companion required. No partner perks.' : 'Full-price companion required. No partner perks.') : "Professional local guides on every vehicle  •  Sintra, Portugal";
      page.drawText(instr1, { x: width / 2 - instr1.length * 2.5, y: detailsY, size: 9, color: textGray });
      page.drawText(instr2, { x: width / 2 - instr2.length * 2.5, y: detailsY - 16, size: 9, color: textGray });
      if(booking.product==='city-card-v1'&&timeSlot)page.drawText(`First departure slot: ${timeSlot}`,{x:75,y:detailsY-36,size:10,color:textDark});

      // ── Footer band ───────────────────────────────────────────────────────
      const footerH = 85;
      page.drawRectangle({ x: 0, y: 0, width, height: footerH, color: teal });
      page.drawRectangle({ x: 0, y: footerH, width, height: 3, color: orange });

      page.drawText(booking.product==='city-card-v1'?'HOP ON SINTRA':"GO SINTRA", {
        x: width / 2 - "GO SINTRA".length * 5,
        y: 57, size: 16, color: white,
      });
      page.drawText(booking.product==='city-card-v1'?'City Card - Unlimited Rides':"Hop-On / Hop-Off Day Pass Service", {
        x: width / 2 - "Hop-On / Hop-Off Day Pass Service".length * 3,
        y: 38, size: 10, color: orange,
      });
      page.drawText("hoponsintra@gmail.com  |  +351 932 967 279  |  Sintra, Portugal", {
        x: width / 2 - "hoponsintra@gmail.com  |  +351 932 967 279  |  Sintra, Portugal".length * 2.3,
        y: 18, size: 8, color: rgb(0.8, 0.88, 0.9),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const chunks:string[]=[];
    for(let offset=0;offset<pdfBytes.length;offset+=32768)chunks.push(String.fromCharCode(...pdfBytes.subarray(offset,offset+32768)));
    const base64 = btoa(chunks.join(''));
    return base64;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// Send Booking Email
async function sendBookingEmail(booking: any, qrCodes: string[], deliveryKey?: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const formattedDate = new Date(booking.selectedDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const passengersWithQR = booking.passengers.map((p: any, i: number) => ({ ...p, qrCode: qrCodes[i] }));
    let htmlContent = generateBookingConfirmationHTML({
      customerName: booking.contactInfo?.name || booking.fullName || 'Guest',
      bookingId: booking.id,
      selectedDate: booking.selectedDate,
      formattedDate,
      passengers: passengersWithQR,
      totalPrice: booking.totalPrice,
      dayPassCount: booking.passengers.length,
      guidedTour: booking.guidedTour,
      attractions: booking.selectedAttractions,
      pickupLocation: booking.pickupLocation,
      timeSlot: booking.timeSlot,
    });

    if(booking.product==='city-card-v1') {
      const escape=(value:any)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
      htmlContent=`<h1>Your Hop On Sintra City Cards</h1><p>Visit date: ${escape(booking.selectedDate)}. Transport: ${escape(booking.transportHours.opens)}–${escape(booking.transportHours.closes)}, Lisbon time.</p><ul>${booking.passengers.map((p:any)=>`<li>${escape(p.name)} — ${escape(p.ageBand)} price category${p.ageBand==='free'?' (under 7; no tuk-tuks)':''}</li>`).join('')}</ul><p>Your named cards and QR codes are attached as a PDF. All routes are included; private tours, sunset trips and attraction admission are excluded. Partner perks are included only with full-price cards, throughout the visit date.</p><p>Sign in to the app using this email address to see these same cards. You do not need to buy them again. Cancellation is free until 23:59 Lisbon time the day before your visit; cash and terminal refunds are handled by our team.</p>`;
    }
    const recipientEmail = booking.contactInfo?.email || booking.email;
    if (!recipientEmail) return { success: false, error: 'No email address provided' };

    let pdfBase64;
    try {
      pdfBase64 = await generateBookingPDF(booking, qrCodes);
    } catch (e) {
      console.error("PDF gen failed", e);
      return { success: false, error: "Ticket PDF generation failed", pdfAttached: false };
    }
    if (!pdfBase64) return { success: false, error: "Ticket PDF is empty", pdfAttached: false };

    const bookingIdShort = booking.id.split("_")[1] || booking.id;
    const emailPayload: any = {
      from: "Hop On Sintra <bookings@hoponsintra.com>",
      to: [recipientEmail],
      reply_to: "hoponsintra@gmail.com",
      subject: `🎉 Your Hop On Sintra Booking Confirmed - ${formattedDate}`,
      html: htmlContent,
    };

    if (pdfBase64) {
      emailPayload.attachments = [{ filename: `HopOnSintra_Tickets_${bookingIdShort}.pdf`, content: pdfBase64 }];
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      ...(deliveryKey ? {headers:{"Content-Type":"application/json",Authorization:`Bearer ${resendApiKey}`,"Idempotency-Key":deliveryKey}} : {}),
      body: JSON.stringify(emailPayload),
      signal: AbortSignal.timeout(8000),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log(`📧 Ticket email accepted by provider for booking ${booking.id}`);
    return { success: true, emailId: result.id, pdfAttached: !!pdfBase64 };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

// ── PUSH NOTIFICATION (ntfy.sh) ──────────────────────────────────────────────
// Sends an instant push notification to the owner's phone via ntfy.sh.
// Set the NTFY_TOPIC secret in Supabase → Project Settings → Edge Functions → Secrets.
// Choose a hard-to-guess topic name, e.g. "hoponsintra-alerts-a7x9q2"
// Install the ntfy app (iOS / Android) and subscribe to the same topic.
async function sendPushNotification(
  title: string,
  message: string,
  priority: "default" | "high" | "urgent" = "high",
  tags: string[] = [],
) {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) return { success: false, error: "Push service not configured" };
  try {
    // HTTP headers must be ASCII-only — strip emoji/non-ASCII from title
    const asciiTitle = title.replace(/[^\x20-\x7E]/g, "").trim();
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Title": asciiTitle,
        "Priority": priority,
        "Tags": tags.join(","),
        "Content-Type": "text/plain",
      },
      body: message,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`❌ ntfy push failed (${res.status}):`, await res.text().catch(() => ""));
      return { success: false, error: `Push provider rejected request (${res.status})` };
    }
    return { success: true };
  } catch (err) {
    console.error("ntfy push error:", err);
    return { success: false, error: "Push request failed" };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Send owner notification email on any purchase
async function sendOwnerNotification(subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("⚠️ RESEND_API_KEY not set — owner notification skipped");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "Hop On Sintra <bookings@hoponsintra.com>",
        to: ["hoponsintra@gmail.com"],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      console.log("📧 Owner notification sent:", subject);
      const result = await res.json();
      return { success: true, emailId: result.id };
    } else {
      const body = await res.text().catch(() => "(unreadable)");
      console.error(`❌ Owner notification rejected by Resend (${res.status}):`, body);
      return { success: false, error: `Email provider rejected request (${res.status})` };
    }
  } catch (err) {
    console.error("Owner notification failed:", err);
    return { success: false, error: "Owner email request failed" };
  }
}

// ========== ROUTES ==========

// Health check
app.get("/make-server-3bd0ade8/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Test push notification — fires a real ntfy push and returns the result
app.post("/make-server-3bd0ade8/test-push", async (c) => {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) {
    return c.json({ success: false, error: "NTFY_TOPIC secret is not set. Add it in Supabase → Project Settings → Edge Functions → Secrets." }, 500);
  }
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Title": "HopOn Sintra - test push",
        "Priority": "high",
        "Tags": "white_check_mark",
        "Content-Type": "text/plain",
      },
      body: "Push notifications are working! 🎉",
    });
    const responseText = await res.text().catch(() => "");
    if (res.ok) {
      return c.json({ success: true, topic: topic.slice(0, 4) + "****", ntfyStatus: res.status });
    } else {
      return c.json({ success: false, error: `ntfy returned ${res.status}: ${responseText}`, topic: topic.slice(0, 4) + "****" }, 500);
    }
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Create Booking
app.post("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    const body = (c.get("ridePurchaseBody") ?? await c.req.json());
    const { paymentIntentId, isTestBooking, skipEmail } = body;

    // Test purchases and suppressed customer emails are staff-only operations.
    if (isTestBooking || skipEmail) {
      const status = await authorizeAdmin(c.req.header("Authorization"), (token) => supabase.auth.getUser(token));
      if (status !== 200) return c.json({ success: false, error: "Administrator access required" }, status);
    }

    if (!isTestBooking) {
      const purchasesEnabled = await kvWithRetry.get("ticket_purchases_enabled");
      if (purchasesEnabled === false) {
        return c.json({ success: false, error: "Ticket purchases are currently disabled" }, 403);
      }
    }

    if (!isTestBooking && !body.manualBooking) {
      if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
      if (typeof paymentIntentId !== "string" || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return c.json({ success: false, error: "A completed payment is required" }, 400);
      try {
        const result = await finalizePaymentIntent(paymentIntentId, "client-checkout");
        return c.json({ success: true, booking: result.booking, emailSent: result.booking?.delivery?.customerEmail?.success === true });
      } catch (error) {
        return c.json({ success: false, error: String(error) }, 400);
      }
    }
    delete body.id;
    delete body.paymentIntentId;
    if (paymentIntentId) return c.json({ success: false, error: "Test bookings cannot claim payments" }, 400);

    const bookingId = await generateBookingId();
    const qrCodes: string[] = [];
    for (let i = 0; i < body.passengers.length; i++) {
      qrCodes.push(await generateQRCode(bookingId, i));
    }

    const booking = {
      id: bookingId,
      ...body,
      qrCodes,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      paymentStatus: body.paymentIntentId ? "paid" : "pending",
      paymentIntentId: body.paymentIntentId || null,
    };

    await commitDayPass(booking);

    // Track prefix
    try {
      const prefix = bookingId.split("-")[0];
      const usedPrefixes = (await kv.get("booking_used_prefixes")) || [];
      if (!usedPrefixes.includes(prefix)) {
        usedPrefixes.push(prefix);
        await kv.set("booking_used_prefixes", usedPrefixes);
      }
    } catch (e) {}

    // Auto-checkin if needed
    if (booking.manualBooking === true || booking.createdBy === "operations") {
      for (let i = 0; i < booking.passengers.length; i++) {
        const checkInKey = `checkin_${bookingId}_${i}_${booking.selectedDate}`;
        const checkInRecord = {
          bookingId, passengerIndex: i, timestamp: new Date().toISOString(),
          location: "Manual Booking", destination: "On Location", date: booking.selectedDate,
          autoCheckedIn: true,
        };
        await kv.set(checkInKey, checkInRecord);
      }
    }

    // Email
    let emailResult: any = { success: false, skipped: true };
    if (!skipEmail) {
      emailResult = await sendBookingEmail(booking, qrCodes);
    } else {
      emailResult.skipped = true;
    }

    // Notify owner of new day-pass purchase
    const passengerCount = booking.passengers?.length || 1;
    const customerName = booking.contactInfo?.name || booking.fullName || "Guest";
    const customerEmail = booking.contactInfo?.email || booking.email || "—";

    // Push notification (instant, to phone)
    const pushResult = await sendPushNotification(
      `🎟️ New booking — ${booking.selectedDate}`,
      `${passengerCount} day pass${passengerCount > 1 ? "es" : ""}\nCustomer: ${customerName}\nPickup: ${booking.pickupLocation ?? "—"} at ${booking.timeSlot ?? "—"}\nTotal: €${booking.totalPrice ?? "—"}`,
      "urgent",
      ["ticket", "moneybag"],
    );

    const ownerEmailResult = await sendOwnerNotification(
      `🎟️ New Booking: ${passengerCount} Day Pass${passengerCount > 1 ? "es" : ""} – ${booking.selectedDate}`,
      `<h2>New Day Pass Booking</h2>
<ul>
  <li><strong>Booking ID:</strong> ${booking.id}</li>
  <li><strong>Customer:</strong> ${customerName} (${customerEmail})</li>
  <li><strong>Date:</strong> ${booking.selectedDate}</li>
  <li><strong>Passengers:</strong> ${passengerCount}</li>
  <li><strong>Total:</strong> €${booking.totalPrice ?? "—"}</li>
  <li><strong>Pickup:</strong> ${booking.pickupLocation ?? "—"}</li>
  <li><strong>Time Slot:</strong> ${booking.timeSlot ?? "—"}</li>
</ul>`,
    );

    booking.delivery = { customerEmail: emailResult, ownerEmail: ownerEmailResult, ownerPush: pushResult, attemptedAt: new Date().toISOString() };
    await kv.set(bookingId, { ...await kv.get(bookingId), delivery: booking.delivery });
    return c.json({ success: true, booking, emailSent: emailResult.success === true });
  } catch (error) {
    console.error("Error creating booking:", error);
    return c.json({ success: false, error: "Failed to create booking" }, 500);
  }
});

// Check-in (Updated to allow destination change)
app.post("/make-server-3bd0ade8/checkin", async (c) => {
  try {
    const { bookingId, passengerIndex, location, destination } = await c.req.json();
    const booking = await kv.get(bookingId);

    if (!booking) return c.json({ success: false, message: "Booking not found" }, 404);

    const boardingError=cityBoardingError(booking,passengerIndex ?? 0);
    if(boardingError) return c.json({success:false,message:boardingError},409);

    const checkInKey = `checkin_${bookingId}_${passengerIndex || 0}_${booking.selectedDate}`;
    const existingCheckIn = await kv.get(checkInKey);
    
    const checkInRecord = {
      bookingId,
      passengerIndex: passengerIndex || 0,
      timestamp: existingCheckIn ? existingCheckIn.timestamp : new Date().toISOString(),
      location: location || "Vehicle Pickup",
      destination: destination || "Unknown",
      date: booking.selectedDate,
      updatedAt: existingCheckIn ? new Date().toISOString() : undefined,
    };

    await kv.set(checkInKey, checkInRecord);

    const checkInsKey = `checkins_${bookingId}_${passengerIndex || 0}`;
    const checkIns = (await kv.get(checkInsKey)) || [];
    
    if (existingCheckIn && checkIns.length > 0) {
      checkIns[checkIns.length - 1] = checkInRecord;
    } else {
      checkIns.push(checkInRecord);
    }
    await kv.set(checkInsKey, checkIns);

    // Track stats
    const today = new Date().toISOString().split('T')[0];
    const destKey = `destination_${today}_${destination}`;
    const destCount = (await kv.get(destKey)) || 0;
    await kv.set(destKey, destCount + 1);

    const destLogKey = `destination_log_${today}`;
    const destLog = (await kv.get(destLogKey)) || [];
    destLog.push({
      destination, timestamp: new Date().toISOString(), bookingId,
      passengerIndex: passengerIndex || 0, customerName: booking.contactInfo.name,
      isUpdate: !!existingCheckIn,
    });
    await kv.set(destLogKey, destLog);

    return c.json({
      success: true,
      checkIn: checkInRecord,
      message: existingCheckIn ? `Destination updated to ${destination}` : "Passenger checked in successfully",
      isUpdate: !!existingCheckIn,
    });
  } catch (error) {
    return c.json({ success: false, message: "Failed to check in" }, 500);
  }
});

// Admin check-in history used by booking lists and attendance summaries.
app.get("/make-server-3bd0ade8/checkins/:bookingId/:passengerIndex", async (c) => {
  const result = await readCheckinHistory(c.req.param("bookingId"), c.req.param("passengerIndex"), kv.get);
  return c.json(result.body, result.status);
});

// Verify QR
app.post("/make-server-3bd0ade8/verify-qr", async (c) => {
  try {
    const { qrData } = await c.req.json();
    const [bookingId, passengerIndexStr] = qrData.split("|");
    const passengerIndex = Number(passengerIndexStr);

    const booking = await kv.get(bookingId);
    if (!booking) return c.json({ success: false, message: "Booking not found" });

    const boardingError=cityBoardingError(booking,passengerIndex);
    if(boardingError) return c.json({success:false,message:boardingError},409);

    const bookingDate = new Date(booking.selectedDate);
    bookingDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const isExpired = bookingDate < today;

    const checkInKey = `checkin_${bookingId}_${passengerIndex}_${booking.selectedDate}`;
    const existingCheckIn = await kv.get(checkInKey);

    return c.json({
      success: true,
      booking: {
        bookingId: booking.id,
        customerName: booking.product==='city-card-v1'?booking.passengers[passengerIndex].name:booking.contactInfo.name,
        passType: booking.product==='city-card-v1'?`City Card · ${booking.passengers[passengerIndex].ageBand==='free'?'UNDER 7 · NO TUK TUK':booking.passengers[passengerIndex].ageBand==='half'?'7–11 years':'12+ years'}`:`${booking.passengers.length} Day Pass`,
        numPasses: booking.passengers.length,
        passDate: booking.selectedDate,
        passengerIndex,
        alreadyCheckedIn: booking.product==='city-card-v1'?false:!!existingCheckIn,
        isExpired,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: "Failed to verify QR" }, 500);
  }
});

// ================== PICKUP REQUESTS (UNIFIED) ==================

// 1. Get All (Admin Panel)
app.get("/make-server-3bd0ade8/pickup-requests", async (c) => {
  try {
    // FIX: Look for UPPERCASE keys which are used during creation
    const requestsArray = await kv.getByPrefix("PICKUP_");
    const requests = (requestsArray || []).sort(
      (a: any, b: any) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime(),
    );
    return c.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching pickups:", error);
    return c.json({ success: false, error: "Failed to fetch pickups" }, 500);
  }
});

installCustomerPickups(app,{
 secret:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'', get:kv.get,list:()=>kv.getByPrefix('PICKUP_'),
 payment:async id=>{if(!stripe)throw new Error('Payment verification unavailable');return stripe.paymentIntents.retrieve(id,{expand:['latest_charge']});},
 create:async(id,input,booking)=>{const {data,error}=await supabase.rpc('create_customer_pickup',{p_booking_id:id,p_request:input,p_identity:booking});if(error)throw new Error('Pickup unavailable');return data;},
 notify:async request=>{
  const escape=(v:any)=>String(v??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
  await Promise.allSettled([
   sendPushNotification('Pickup request',request.groupSize+' passengers: '+request.pickupLocation+' → '+request.destination,'urgent',['car']),
   sendOwnerNotification('Pickup request', '<h2>New pickup request</h2><p>'+escape(request.id)+'</p><p>'+escape(request.customerName)+' — '+escape(request.customerPhone)+'</p><p>'+escape(request.pickupLocation)+' → '+escape(request.destination)+'</p><p>Passengers: '+request.groupSize+'</p>'),
  ]);
 },
});

installCityPickups(app,supabase,async request=>{await sendPushNotification('City Card pickup',request.groupSize+' passengers: '+request.pickupLocation+' → '+request.destination+(request.nonTukTuk?' — NO TUK-TUK':''),'urgent',['car']);});
installPickupTransitions(app,supabase);

// Verify Booking Code
app.post("/make-server-3bd0ade8/verify-booking", async (c) => {
  try {
    const { bookingCode } = await c.req.json();
    let booking = await kv.get(bookingCode);
    if (!booking) booking = await kv.get(`booking_${bookingCode}`); // Check old format too

    if (!booking) return c.json({ success: false, message: "Invalid code" }, 404);

    return c.json({
      success: true,
      booking: {
        id: booking.id,
        customerName: booking.contactInfo?.name || "",
        customerPhone: booking.contactInfo?.phone || "",
        customerEmail: booking.contactInfo?.email || "",
        passes: booking.passengers?.length || 1,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: "Verification failed" }, 500);
  }
});

// Verify Booking with Last Name for Login
app.post("/make-server-3bd0ade8/verify-booking-login", async (c) => {
  try {
    const { bookingId, lastName } = await c.req.json();
    
    if (!bookingId || !lastName) {
      return c.json({ success: false, error: "Booking ID and last name are required" }, 400);
    }

    let booking = await kv.get(bookingId);
    if (!booking) booking = await kv.get(`booking_${bookingId}`); // Check old format too

    if (!booking) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    // Extract last name from booking
    const bookingName = booking.contactInfo?.name || "";
    const bookingLastName = bookingName.split(" ").slice(-1)[0].toLowerCase();
    const inputLastName = lastName.trim().toLowerCase();

    // Verify last name matches
    if (bookingLastName !== inputLastName) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    // Return booking details for session
    return c.json({
      success: true,
      booking: {
        bookingId: booking.id,
        customerName: bookingName,
        customerEmail: booking.contactInfo?.email || "",
        customerPhone: booking.contactInfo?.phone || "",
        passes: booking.passengers?.length || 1,
        visitDate: booking.selectedDate || booking.visitDate,
      },
    });
  } catch (error) {
    console.error("Login verification error:", error);
    return c.json({ success: false, error: "Verification failed" }, 500);
  }
});

// POST /bookings/lookup — find booking by bookingId + lastName, return full booking (ManageBookingPage)
app.post("/make-server-3bd0ade8/bookings/lookup", async (c) => {
  try {
    const { bookingId, lastName } = await c.req.json();

    if (!bookingId || !lastName) {
      return c.json({ success: false, error: "Booking ID and last name are required" }, 400);
    }

    let booking = await kv.get(bookingId);
    if (!booking) booking = await kv.get(`booking_${bookingId}`);

    if (!booking) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    // Verify last name
    const bookingName = (booking as any).contactInfo?.name || "";
    const bookingLastName = bookingName.split(" ").slice(-1)[0].toLowerCase();
    const inputLastName = lastName.trim().toLowerCase();

    if (bookingLastName !== inputLastName) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    return c.json({ success: true, booking });
  } catch (error) {
    console.error("Booking lookup error:", error);
    return c.json({ success: false, error: "Lookup failed" }, 500);
  }
});

// PATCH /bookings/:id/status — manually set status (confirmed | completed | cancelled)
app.patch("/make-server-3bd0ade8/bookings/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const allowed = ["confirmed", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return c.json({ success: false, error: `Invalid status. Must be one of: ${allowed.join(", ")}` }, 400);
    }
    let booking: any = await kv.get(id);
    if (!booking) booking = await kv.get(`booking_${id}`);
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    const result = await supabase.rpc('set_day_pass_status', {p_id:id,p_status:status});
    if (result.error) return c.json({success:false,error:result.error.message},409);
    return c.json({ success: true, booking:result.data });
  } catch (err) {
    console.error("Error updating booking status:", err);
    return c.json({ success: false, error: "Failed to update status" }, 500);
  }
});

// GET /bookings/:id/full — return full booking by ID (SunsetSpecialPurchasePage)
app.get("/make-server-3bd0ade8/bookings/:id/full", async (c) => {
  try {
    const id = c.req.param("id");
    let booking = await kv.get(id);
    if (!booking) booking = await kv.get(`booking_${id}`);

    if (!booking) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    return c.json({ success: true, booking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /bookings/:id/pdf — generate and return PDF as application/pdf
app.get("/make-server-3bd0ade8/bookings/:id/pdf", async (c) => {
  try {
    const id = c.req.param("id");
    let booking = await kv.get(id);
    if (!booking) booking = await kv.get(`booking_${id}`);

    if (!booking) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    const qrCodes: string[] = (booking as any).qrCodes || [];
    const pdfBase64 = await generateBookingPDF(booking, qrCodes);

    // Decode base64 → Uint8Array
    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="booking-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Attaches a sunset-special add-on to an existing booking. Shared by the normal
// POST /bookings/:id/add-sunset-special route and the redirect-return recovery path
// (finalizeAddonPaymentIntent).
async function attachSunsetSpecial(
  bookingId: string,
  data: { sunsetDate?: string; quantity?: number; amount?: number; paymentIntentId?: string },
) {
  const { data: result, error } = await supabase.rpc("commit_sunset_booking", { p_booking_id: bookingId, p_addon: data });
  if (error) throw new Error(error.message);
  return result;
}

// POST /bookings/:id/add-sunset-special — add sunset special to an existing booking
app.post("/make-server-3bd0ade8/bookings/:id/add-sunset-special", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { paymentIntentId } = body;
    if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
    if (typeof paymentIntentId !== "string" || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return c.json({ success: false, error: "A completed payment is required" }, 400);
    const { booking } = await finalizeAddonPaymentIntent(paymentIntentId, id);
    return c.json({ success: true, booking });
  } catch (error) {
    console.error("Add sunset special error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Verifies a payment intent succeeded with Stripe, then attaches the sunset-special
// add-on from the pending data stashed at payment-intent-creation time. Used when
// the client returns from a redirect-based payment method (PayPal, etc).
async function finalizeAddonPaymentIntent(paymentIntentId: string, expectedBookingId?: string) {
  const paymentIntent = await stripe!.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment intent status is "${paymentIntent.status}", not "succeeded"`);
  }

  const pending = await kv.get(`pending_addon_pi_${paymentIntentId}`) as any;
  if (!pending) {
    throw new Error("No pending add-on data found for this payment intent");
  }

  verifyTicketPayment(paymentIntent, pending, "addon");
  if (expectedBookingId && pending.bookingId !== expectedBookingId) throw new Error("Payment belongs to a different booking");
  if (pending.completedAt) {
    const booking = await kv.get(pending.bookingId);
    if (!booking) throw new Error("Completed booking not found");
    return { alreadyExisted: true, booking };
  }
  const { alreadyExisted, booking } = await attachSunsetSpecial(pending.bookingId, {
    sunsetDate: pending.sunsetDate,
    quantity: pending.quantity,
    amount: pending.amount,
    paymentIntentId,
  });
  await kv.set(`pending_addon_pi_${paymentIntentId}`, { ...pending, completedAt: new Date().toISOString() });
  return { alreadyExisted, booking };
}

// POST /finalize-addon-payment — called by the client right after returning from a
// redirect-based payment method for a sunset-special add-on purchase.
app.post("/make-server-3bd0ade8/finalize-addon-payment", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { paymentIntentId } = await c.req.json();
    if (!paymentIntentId) return c.json({ success: false, error: "paymentIntentId required" }, 400);
    const result = await finalizeAddonPaymentIntent(paymentIntentId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 400);
  }
});

// List all bookings
app.get("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    const usedPrefixes: string[] = (await kvWithRetry.get("booking_used_prefixes")) || [];
    const currentPrefix: string = (await kvWithRetry.get("booking_current_prefix")) || "AA";
    if (!usedPrefixes.includes(currentPrefix)) usedPrefixes.push(currentPrefix);

    const allBookings: any[] = [];
    for (const prefix of usedPrefixes) {
      const entries = await kvWithRetry.getByPrefix(`${prefix}-`);
      const bookings = (entries as any[]).filter((b: any) => b && b.id && b.selectedDate);
      allBookings.push(...bookings);
    }

    return c.json({ success: true, bookings: allBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json({ success: false, error: String(error), bookings: [] }, 500);
  }
});

// ===== TOUR BOOKINGS (private tour calendar) =====

app.get("/make-server-3bd0ade8/tour-bookings", async (c) => {
  try {
    const bookings = (await kvWithRetry.get("tour_bookings") as any[]) || [];
    const { startDate, endDate } = c.req.query();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const filtered = bookings.filter((b: any) => {
        const d = new Date(b.tourDate);
        return d >= start && d <= end;
      });
      return c.json({ success: true, bookings: filtered });
    }
    return c.json({ success: true, bookings });
  } catch (error) {
    return c.json({ success: false, error: String(error), bookings: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-bookings/create-manual", async (c) => {
  try {
    const body = await c.req.json();
    const existing = (await kvWithRetry.get("tour_bookings") as any[]) || [];
    const newBooking = {
      ...body,
      bookingId: `TB-${Date.now()}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.rpc("commit_tour_booking", { p_booking: newBooking });
    if (error) throw new Error(error.message);
    return c.json({ success: true, booking: newBooking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-bookings/:id/cancel", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: booking, error } = await supabase.rpc("cancel_tour_booking", { p_id: id });
    if (error) throw new Error(error.message);
    return c.json({ success: true, booking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Creates a tour booking and sends the customer/owner notifications. Shared by the
// normal POST /tour-bookings/create route and the redirect-return recovery path
// (finalizeTourPaymentIntent), which can't resubmit this from the client because a
// redirect-based payment reloads the page and wipes the booking dialog's state.
async function createTourBooking(body: any) {
  const { tourId, tourDate, customerInfo, paymentIntentId } = body;

  const existing = (await kvWithRetry.get("tour_bookings") as any[]) || [];

  // Prevent duplicate bookings for the same payment intent
  if (paymentIntentId && existing.some((b: any) => b.paymentIntentId === paymentIntentId)) {
    const duplicate = existing.find((b: any) => b.paymentIntentId === paymentIntentId);
    return { alreadyExisted: true, booking: duplicate };
  }

  const newBooking = {
    id: `TB-${Date.now()}`,
    tourId,
    tourDate,
    customerInfo,
    paymentIntentId: paymentIntentId || null,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  const { data: committed, error: commitError } = await supabase.rpc("commit_tour_booking", { p_booking: newBooking });
  if (commitError) throw new Error(commitError.message);
  if (committed.alreadyExisted) return committed;

  // Send confirmation email to customer
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey && customerInfo?.email) {
    try {
      const html = generateTourBookingConfirmationHTML({
        customerName: customerInfo.name || "Guest",
        bookingId: newBooking.id,
        tourTitle: body.tourTitle || tourId,
        tourDate: tourDate,
        numberOfPeople: customerInfo.numberOfPeople || 1,
        totalPrice: body.amount || 0,
        specialRequests: customerInfo.specialRequests,
      });
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: "Go Sintra <bookings@hoponsintra.com>",
          to: [customerInfo.email],
          subject: `✅ Your Private Tour is Confirmed – ${body.tourTitle || tourId}`,
          html,
        }),
      });
    } catch (emailError) {
      console.error("Tour booking email failed:", emailError);
      // Don't fail the booking if email fails
    }
  }

  // Notify owner of new private tour booking — push + email
  await sendPushNotification(
    `New private tour booking - ${body.tourTitle || tourId}`,
    `${customerInfo?.numberOfPeople ?? 1} people on ${tourDate}\nCustomer: ${customerInfo?.name ?? "—"} (${customerInfo?.email ?? "—"})\nTotal: €${body.amount ?? "—"}`,
    "urgent",
    ["castle", "moneybag"],
  );
  await sendOwnerNotification(
    `🏰 New Private Tour Booking – ${body.tourTitle || tourId}`,
    `<h2>New Private Tour Booking</h2>
<ul>
  <li><strong>Booking ID:</strong> ${newBooking.id}</li>
  <li><strong>Tour:</strong> ${body.tourTitle || tourId}</li>
  <li><strong>Date:</strong> ${tourDate}</li>
  <li><strong>Customer:</strong> ${customerInfo?.name ?? "—"} (${customerInfo?.email ?? "—"})</li>
  <li><strong>People:</strong> ${customerInfo?.numberOfPeople ?? 1}</li>
  <li><strong>Total:</strong> €${body.amount ?? "—"}</li>
  ${customerInfo?.specialRequests ? `<li><strong>Special Requests:</strong> ${customerInfo.specialRequests}</li>` : ""}
</ul>`,
  );

  return { alreadyExisted: false, booking: newBooking };
}

// POST /tour-bookings/create — called after Stripe payment succeeds
app.post("/make-server-3bd0ade8/tour-bookings/create", async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIntentId } = body;

    if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
    if (typeof paymentIntentId !== "string" || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return c.json({ success: false, error: "A completed payment is required" }, 400);
    const { booking } = await finalizeTourPaymentIntent(paymentIntentId);
    return c.json({ success: true, booking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Verifies a payment intent succeeded with Stripe, then finalizes a tour booking
// from the pending data stashed at payment-intent-creation time. Used when the
// client returns from a redirect-based payment method (PayPal, etc) — the reload
// that follows wipes the booking dialog's state before it can call
// POST /tour-bookings/create itself.
async function finalizeTourPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe!.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment intent status is "${paymentIntent.status}", not "succeeded"`);
  }

  const pending = await kv.get(`pending_tour_pi_${paymentIntentId}`) as any;
  if (!pending) {
    throw new Error("No pending tour booking data found for this payment intent");
  }

  verifyTicketPayment(paymentIntent, pending, "tour");
  const { alreadyExisted, booking } = await createTourBooking({ ...pending, paymentIntentId });
  await kv.set(`pending_tour_pi_${paymentIntentId}`, { ...pending, completedAt: new Date().toISOString() });
  return { alreadyExisted, booking };
}

// POST /finalize-tour-payment — called by the client right after returning from a
// redirect-based payment method for a private tour booking.
app.post("/make-server-3bd0ade8/finalize-tour-payment", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { paymentIntentId } = await c.req.json();
    if (!paymentIntentId) return c.json({ success: false, error: "paymentIntentId required" }, 400);
    const result = await finalizeTourPaymentIntent(paymentIntentId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 400);
  }
});

// GET /tour-availability/:tourId — returns per-date availability for the booking calendar
app.get("/make-server-3bd0ade8/tour-availability/:tourId", async (c) => {
  const tourId = c.req.param("tourId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  try {
    // Get tour to know maxGroupSize
    const tours = (await kvWithRetry.get("private_tours") as any[]) || [];
    const tour = (tours as any[]).find((t: any) => t.id === tourId);
    const maxCapacity: number = tour?.maxGroupSize || 10;

    // Get all confirmed bookings for this tour
    const allBookings = (await kvWithRetry.get("tour_bookings") as any[]) || [];
    const tourBookings = (allBookings as any[]).filter(
      (b: any) => b.tourId === tourId && b.status !== "cancelled"
    );

    // Build availability map — only include dates that have at least one booking
    // (frontend treats missing dates as fully available)
    const availability: Record<string, { available: number; isFull: boolean }> = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];

        const bookedPeople = tourBookings
          .filter((b: any) => b.tourDate && b.tourDate.startsWith(dateStr))
          .reduce((sum: number, b: any) => sum + (b.customerInfo?.numberOfPeople || 1), 0);

        if (bookedPeople > 0) {
          availability[dateStr] = {
            available: Math.max(0, maxCapacity - bookedPeople),
            isFull: bookedPeople >= maxCapacity,
          };
        }
      }
    }

    return c.json({ success: true, availability });
  } catch (error) {
    return c.json({ success: false, error: String(error), availability: {} }, 500);
  }
});

// POST /tour-quote-requests/create — quote request from TourBookingDialog
app.post("/make-server-3bd0ade8/tour-quote-requests/create", async (c) => {
  try {
    const body = await c.req.json();
    const existing = (await kvWithRetry.get("tour_requests") as any[]) || [];
    const newRequest = {
      id: `TQR-${Date.now()}`,
      ...body,
      type: "quote",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    existing.push(newRequest);
    await kvWithRetry.set("tour_requests", existing);

    // Send acknowledgement email to customer
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const customerEmail = body.customerInfo?.email;
    if (resendApiKey && customerEmail) {
      try {
        const html = generateTourQuoteRequestHTML({
          customerName: body.customerInfo?.name || "Guest",
          requestId: newRequest.id,
          tourTitle: body.tourTitle || body.tourId || "Private Tour",
          tourDate: body.tourDate || "",
          numberOfPeople: body.customerInfo?.numberOfPeople || 1,
          specialRequests: body.customerInfo?.specialRequests,
        });
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "Go Sintra <bookings@hoponsintra.com>",
            to: [customerEmail],
            subject: `✉️ Quote Request Received – ${body.tourTitle || "Private Tour"}`,
            html,
          }),
        });
      } catch (emailError) {
        console.error("Tour quote email failed:", emailError);
      }
    }

    return c.json({ success: true, request: newRequest });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== TOUR REQUESTS =====

app.get("/make-server-3bd0ade8/tour-requests", async (c) => {
  try {
    const requests = await kvWithRetry.get("tour_requests");
    return c.json({ success: true, requests: requests || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error), requests: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-requests", async (c) => {
  try {
    const body = await c.req.json();
    const existing = (await kvWithRetry.get("tour_requests") as any[]) || [];
    const newRequest = { ...body, id: `tour_req_${Date.now()}`, createdAt: new Date().toISOString(), status: "pending" };
    existing.push(newRequest);
    await kvWithRetry.set("tour_requests", existing);
    return c.json({ success: true, request: newRequest });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-requests/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const existing = (await kvWithRetry.get("tour_requests") as any[]) || [];
    const idx = existing.findIndex((r: any) => r.id === id);
    if (idx === -1) return c.json({ success: false, error: "Not found" }, 404);
    existing[idx] = { ...existing[idx], status, updatedAt: new Date().toISOString() };
    await kvWithRetry.set("tour_requests", existing);
    return c.json({ success: true, request: existing[idx] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-requests/:id/notes", async (c) => {
  try {
    const id = c.req.param("id");
    const { notes } = await c.req.json();
    const existing = (await kvWithRetry.get("tour_requests") as any[]) || [];
    const idx = existing.findIndex((r: any) => r.id === id);
    if (idx === -1) return c.json({ success: false, error: "Not found" }, 404);
    existing[idx] = { ...existing[idx], notes, updatedAt: new Date().toISOString() };
    await kvWithRetry.set("tour_requests", existing);
    return c.json({ success: true, request: existing[idx] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== DRIVER MANAGEMENT =====

installDriverAccounts(app, {
 supabase, getDrivers:getDriverProfiles,
 authClient:()=>createClient(Deno.env.get('SUPABASE_URL') ?? '',Deno.env.get('SUPABASE_ANON_KEY') ?? '',{
  auth:{persistSession:false,autoRefreshToken:false},
 }),
});

// GET /drivers/:id/metrics — daily sales/revenue/QR-scan breakdown for a date range
app.get("/make-server-3bd0ade8/drivers/:id/metrics", async (c) => {
  try {
    const driverId = c.req.param("id");
    const { startDate, endDate } = c.req.query();

    const sales    = (await kvWithRetry.get(`driver_sales_${driverId}`)    as any[]) || [];
    const activity = (await kvWithRetry.get(`driver_activity_${driverId}`) as any[]) || [];

    const start = startDate ? new Date(startDate) : null;
    const end   = endDate   ? new Date(endDate)   : null;

    const metricsMap: Record<string, { date: string; ticketsSold: number; revenue: number; qrScans: number }> = {};

    for (const sale of sales) {
      const saleDate = (sale.createdAt || sale.date || "").split("T")[0];
      if (!saleDate) continue;
      const d = new Date(saleDate);
      if (start && d < start) continue;
      if (end   && d > end)   continue;
      if (!metricsMap[saleDate]) metricsMap[saleDate] = { date: saleDate, ticketsSold: 0, revenue: 0, qrScans: 0 };
      metricsMap[saleDate].ticketsSold += sale.numberOfPeople || 0;
      metricsMap[saleDate].revenue     += sale.amount          || 0;
    }

    for (const item of activity) {
      if (item.type !== "qr_scan") continue;
      const itemDate = (item.timestamp || "").split("T")[0];
      if (!itemDate) continue;
      const d = new Date(itemDate);
      if (start && d < start) continue;
      if (end   && d > end)   continue;
      if (!metricsMap[itemDate]) metricsMap[itemDate] = { date: itemDate, ticketsSold: 0, revenue: 0, qrScans: 0 };
      metricsMap[itemDate].qrScans += 1;
    }

    const metrics = Object.values(metricsMap).sort((a, b) => a.date.localeCompare(b.date));
    return c.json({ success: true, metrics });
  } catch (error) {
    return c.json({ success: false, error: String(error), metrics: [] }, 500);
  }
});

// GET /drivers/:id/activity — recent activity feed for a driver
app.get("/make-server-3bd0ade8/drivers/:id/activity", async (c) => {
  try {
    const driverId = c.req.param("id");
    const limit = parseInt(c.req.query("limit") || "20");

    const activity = (await kvWithRetry.get(`driver_activity_${driverId}`) as any[]) || [];
    const sorted = [...activity]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return c.json({ success: true, activity: sorted });
  } catch (error) {
    return c.json({ success: false, error: String(error), activity: [] }, 500);
  }
});

// ===== CARD SYSTEM: CARD PRODUCTS / MERCHANTS / DEALS =====

// GET /card-products — list all card products (admin use)
app.get("/make-server-3bd0ade8/card-products", async (c) => {
  try {
    const { data, error } = await supabase
      .from("card_products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return c.json({ success: true, cardProducts: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /card-products — admin: create a new card product
app.post("/make-server-3bd0ade8/card-products", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, priceCents, validFromTime, validUntilTime, isActive } = body;

    if (!name || priceCents === undefined || priceCents === null) {
      return c.json({ success: false, error: "Name and price are required" }, 400);
    }

    const { data, error } = await supabase
      .from("card_products")
      .insert({
        name,
        description: description || null,
        price_cents: priceCents,
        valid_from_time: validFromTime || "08:30",
        valid_until_time: validUntilTime || "19:00",
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    return c.json({ success: true, cardProduct: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT /card-products/:id — admin: update a card product
app.put("/make-server-3bd0ade8/card-products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, description, priceCents, validFromTime, validUntilTime, isActive } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (priceCents !== undefined) updates.price_cents = priceCents;
    if (validFromTime !== undefined) updates.valid_from_time = validFromTime;
    if (validUntilTime !== undefined) updates.valid_until_time = validUntilTime;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from("card_products")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ success: false, error: "Card product not found" }, 404);

    return c.json({ success: true, cardProduct: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /merchants — list all merchants (admin use)
app.get("/make-server-3bd0ade8/merchants", async (c) => {
  try {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return c.json({ success: true, merchants: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /merchants — admin: create a new merchant
app.post("/make-server-3bd0ade8/merchants", async (c) => {
  try {
    const body = await c.req.json();
    const { name, category, location, lat, lng, isActive } = body;

    if (!name) {
      return c.json({ success: false, error: "Name is required" }, 400);
    }

    const { data, error } = await supabase
      .from("merchants")
      .insert({
        name,
        category: category || null,
        location: location || null,
        lat: lat ?? null,
        lng: lng ?? null,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    return c.json({ success: true, merchant: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT /merchants/:id — admin: update a merchant
app.put("/make-server-3bd0ade8/merchants/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, category, location, lat, lng, isActive } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from("merchants")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ success: false, error: "Merchant not found" }, 404);

    return c.json({ success: true, merchant: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE /merchants/:id — admin: remove a merchant (cascades to its deals/staff)
app.delete("/make-server-3bd0ade8/merchants/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await supabase.from("merchants").update({is_active:false}).eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /deals — list deals, optionally filtered by merchant
app.get("/make-server-3bd0ade8/deals", async (c) => {
  try {
    const merchantId = c.req.query("merchantId");
    let query = supabase.from("deals").select("*").order("created_at", { ascending: true });
    if (merchantId) query = query.eq("merchant_id", merchantId);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ success: true, deals: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /deals — admin: create a new deal
app.post("/make-server-3bd0ade8/deals", async (c) => {
  try {
    const body = await c.req.json();
    const { merchantId, title, terms, isSingleUse, isActive } = body;

    if (!merchantId || !title) {
      return c.json({ success: false, error: "Merchant and title are required" }, 400);
    }

    const { data, error } = await supabase
      .from("deals")
      .insert({
        merchant_id: merchantId,
        title,
        terms: terms || null,
        is_single_use: isSingleUse ?? true,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    return c.json({ success: true, deal: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT /deals/:id — admin: update a deal
app.put("/make-server-3bd0ade8/deals/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { merchantId, title, terms, isSingleUse, isActive } = body;

    const updates: Record<string, unknown> = {};
    if (merchantId !== undefined) updates.merchant_id = merchantId;
    if (title !== undefined) updates.title = title;
    if (terms !== undefined) updates.terms = terms;
    if (isSingleUse !== undefined) updates.is_single_use = isSingleUse;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ success: false, error: "Deal not found" }, 404);

    return c.json({ success: true, deal: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE /deals/:id — admin: remove a deal
app.delete("/make-server-3bd0ade8/deals/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await supabase.from("deals").update({is_active:false}).eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /pickup-requests/pending — only pending pickup requests (driver polling endpoint)
app.get("/make-server-3bd0ade8/pickup-requests/pending", async (c) => {
  try {
    const all = await kv.getByPrefix("PICKUP_");
    const pending = ((all || []) as any[])
      .filter((r: any) => r.status === "pending")
      .sort((a: any, b: any) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime());
    return c.json({ success: true, requests: pending });
  } catch (error) {
    console.error("Error fetching pending pickups:", error);
    return c.json({ success: false, error: "Failed to fetch pending pickups", requests: [] }, 500);
  }
});

// POST /driver-sales/create — sell tickets, decrement per-slot availability, log driver activity
app.post("/make-server-3bd0ade8/driver-sales/create", async (c) => {
  try {
    const body = await c.req.json();
    const {
      driverId, numberOfPeople, firstName, lastName,
      customerEmail, paymentMethod, amount, timeSlot,
      pickupLocation, selectedDate,
    } = body;

    const qty = parseInt(numberOfPeople) || 1;
    const bookingId = `DS-${Date.now()}`;
    const now = new Date().toISOString();

    const sale = {
      id: bookingId,
      driverId,
      numberOfPeople: qty,
      firstName,
      lastName,
      customerEmail,
      paymentMethod,
      amount,
      timeSlot,
      pickupLocation,
      selectedDate,
      date: selectedDate,
      createdAt: now,
      type: "driver_sale",
    };

    await commitDayPass({ ...sale, status: "confirmed", paymentStatus: "paid",
      contactInfo: { name: [firstName,lastName].filter(Boolean).join(" "), email: customerEmail },
      passengers: Array.from({ length: qty }, (_, i) => ({ name: "Passenger " + (i+1), type: "Adult" })) });

    // Append to driver sales history
    const driverSales = (await kvWithRetry.get(`driver_sales_${driverId}`) as any[]) || [];
    driverSales.push(sale);
    await kvWithRetry.set(`driver_sales_${driverId}`, driverSales);

    // Append to driver activity log
    const driverActivity = (await kvWithRetry.get(`driver_activity_${driverId}`) as any[]) || [];
    driverActivity.push({
      type: "sale",
      timestamp: now,
      quantity: qty,
      amount,
      bookingId,
      customerName: `${firstName} ${lastName}`,
    });
    await kvWithRetry.set(`driver_activity_${driverId}`, driverActivity);

    // Send confirmation email to customer
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && customerEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "Hop On Sintra <bookings@hoponsintra.com>",
            to: [customerEmail],
            subject: "Your Hop On Sintra Tickets 🎟️",
            html: `<h2>Your tickets are confirmed!</h2>
<p>Hello ${firstName},</p>
<p>Your driver has registered <strong>${qty} ticket${qty > 1 ? "s" : ""}</strong> for you.</p>
<ul>
  <li><strong>Date:</strong> ${selectedDate}</li>
  <li><strong>Start Time:</strong> ${timeSlot}</li>
  <li><strong>Amount Paid:</strong> €${amount} (${paymentMethod})</li>
  <li><strong>Booking ID:</strong> ${bookingId}</li>
</ul>
<p><strong>Customer Portal Login (to request pickup assistance):</strong><br>
Booking ID: ${bookingId}<br>
Last name: ${lastName}</p>
<p>Enjoy your Sintra experience! 🏰</p>`,
          }),
        });
      } catch (emailErr) {
        console.error("Driver sale email failed:", emailErr);
      }
    }

    // Notify owner of new driver sale
    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];
    const driver = drivers.find((d: any) => d.id === driverId);
    await sendOwnerNotification(
      `🚌 Driver Sale: ${qty} Ticket${qty > 1 ? "s" : ""} – ${selectedDate}`,
      `<h2>New Driver Sale</h2>
<ul>
  <li><strong>Booking ID:</strong> ${bookingId}</li>
  <li><strong>Driver:</strong> ${driver?.name ?? driverId}</li>
  <li><strong>Customer:</strong> ${firstName} ${lastName}${customerEmail ? ` (${customerEmail})` : ""}</li>
  <li><strong>Date:</strong> ${selectedDate}</li>
  <li><strong>Tickets:</strong> ${qty}</li>
  <li><strong>Amount:</strong> €${amount} (${paymentMethod})</li>
  <li><strong>Time Slot:</strong> ${timeSlot ?? "—"}</li>
  <li><strong>Pickup:</strong> ${pickupLocation ?? "—"}</li>
</ul>`,
    );

    return c.json({
      success: true,
      booking: sale,
      customerInfo: { email: customerEmail, bookingId, lastName },
    });
  } catch (error) {
    console.error("Driver sale error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== CONTENT MANAGEMENT =====

// Legacy website content (used by contentManager.ts)
app.get("/make-server-3bd0ade8/content", async (c) => {
  try {
    const content = await kvWithRetry.get("website_content");
    return c.json({ success: true, content: content || null });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/content", async (c) => {
  try {
    const body = await c.req.json();
    await kvWithRetry.set("website_content", { ...body, lastUpdated: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Comprehensive content (used by comprehensiveContent.ts — powers all visible site content)
app.get("/make-server-3bd0ade8/comprehensive-content", async (c) => {
  try {
    const content = await kvWithRetry.get("comprehensive_content");
    return c.json({ success: true, content: content || null });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/comprehensive-content", async (c) => {
  try {
    const body = await c.req.json();
    await kvWithRetry.set("comprehensive_content", body);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Pricing configuration
app.get("/make-server-3bd0ade8/pricing", async (c) => {
  try {
    const pricing = await kvWithRetry.get("pricing_config");
    return c.json({ success: true, pricing: pricing || null });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/pricing", async (c) => {
  try {
    const body = await c.req.json();
    await kvWithRetry.set("pricing_config", body);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Ticket purchases master toggle
app.get("/make-server-3bd0ade8/settings/ticket-purchases-enabled", async (c) => {
  try {
    const enabled = await kvWithRetry.get("ticket_purchases_enabled");
    return c.json({ success: true, enabled: enabled !== false });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/settings/ticket-purchases-enabled", async (c) => {
  try {
    const { enabled } = await c.req.json();
    await kvWithRetry.set("ticket_purchases_enabled", enabled !== false);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== IMAGE MANAGEMENT (Supabase Storage) =====

const IMAGE_BUCKET = "make-3bd0ade8-images";

async function ensureImageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: any) => b.name === IMAGE_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(IMAGE_BUCKET, { public: true });
  }
}

app.get("/make-server-3bd0ade8/images", async (c) => {
  try {
    await ensureImageBucket();
    const { data: files, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;

    const images = (files || [])
      .filter((f: any) => f.name !== ".emptyFolderPlaceholder")
      .map((f: any) => ({
        name: f.name,
        url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(f.name).data.publicUrl,
        uploadedAt: f.created_at || new Date().toISOString(),
        size: f.metadata?.size || 0,
      }));

    return c.json({ success: true, images });
  } catch (error) {
    console.error("Error listing images:", error);
    return c.json({ success: false, error: String(error), images: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/images/upload", async (c) => {
  try {
    await ensureImageBucket();
    const { fileName, fileData, fileType } = await c.req.json();

    // Decode base64 data URL to bytes
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Make filename unique to avoid collisions
    const timestamp = Date.now();
    const ext = fileName.split(".").pop() || "jpg";
    const baseName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9\-_]/g, "-")
      .slice(0, 60);
    const uniqueName = `${baseName}-${timestamp}.${ext}`;

    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(uniqueName, bytes, { contentType: fileType, upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(uniqueName);

    return c.json({ success: true, url: publicUrl, name: uniqueName });
  } catch (error) {
    console.error("Error uploading image:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-3bd0ade8/images/:name", async (c) => {
  try {
    const name = decodeURIComponent(c.req.param("name"));
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([name]);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== PRIVATE TOURS =====

app.get("/make-server-3bd0ade8/private-tours", async (c) => {
  try {
    const lang = c.req.query('lang');
    const raw = ((await kvWithRetry.get("private_tours")) as any[]) || [];

    const tours = raw.map((tour: any) => {
      const { translations, ...base } = tour;
      if (lang && lang !== 'en' && translations?.[lang]) {
        const t = translations[lang];
        return {
          ...base,
          translatedLanguages: Object.keys(translations),
          title:           t.title           ?? base.title,
          description:     t.description     ?? base.description,
          longDescription: t.longDescription ?? base.longDescription,
          features:        t.features?.length ? t.features : base.features,
          badge:           t.badge           ?? base.badge,
          buttonText:      t.buttonText      ?? base.buttonText,
          priceSubtext:    t.priceSubtext    ?? base.priceSubtext,
        };
      }
      // Default (English / admin): strip blob, expose which langs are ready
      return { ...base, translatedLanguages: translations ? Object.keys(translations) : [] };
    });

    return c.json({ success: true, tours });
  } catch (error) {
    return c.json({ success: false, error: String(error), tours: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/private-tours/reorder", async (c) => {
  try {
    const { tours } = await c.req.json();
    await kvWithRetry.set("private_tours", tours);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/private-tours", async (c) => {
  try {
    const { tour } = await c.req.json();
    const existing = ((await kvWithRetry.get("private_tours")) as any[]) || [];

    // Auto-translate the tour content via Claude
    const translations = await translateTourContent(tour);
    const tourToSave = {
      ...tour,
      ...(translations && {
        translations,
        translationsUpdatedAt: new Date().toISOString(),
      }),
    };

    const idx = existing.findIndex((t: any) => t.id === tour.id);
    if (idx >= 0) existing[idx] = tourToSave;
    else          existing.push(tourToSave);

    await kvWithRetry.set("private_tours", existing);
    return c.json({ success: true, translated: !!translations });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-3bd0ade8/private-tours/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = (await kvWithRetry.get("private_tours") as any[]) || [];
    await kvWithRetry.set("private_tours", existing.filter((t: any) => t.id !== id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== MONUMENTS =====

app.get("/make-server-3bd0ade8/monuments", async (c) => {
  try {
    const monuments = await kvWithRetry.get("monuments");
    return c.json({ success: true, monuments: monuments || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error), monuments: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/monuments", async (c) => {
  try {
    const { monuments } = await c.req.json();
    await kvWithRetry.set("monuments", monuments);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== BLOG =====

app.get("/make-server-3bd0ade8/blog-articles", async (c) => {
  try {
    const articles = await kvWithRetry.get("blog_articles");
    return c.json({ success: true, articles: articles || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error), articles: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/blog-articles", async (c) => {
  try {
    const { articles } = await c.req.json();

    // Auto-translate any article that has English content but is missing other language translations
    const articlesToSave = await Promise.all(
      (articles as any[]).map(async (article: any) => {
        const en = article.translations?.en;
        if (!en?.title) return article; // no English content yet

        const missing = Object.keys(TARGET_LANGUAGES).filter(
          (lang) => !article.translations?.[lang]?.title
        );
        if (missing.length === 0) return article; // all translations present

        const newTranslations = await translateBlogArticle(article);
        if (!newTranslations) return article;

        return {
          ...article,
          translations: { ...article.translations, ...newTranslations },
          translationsUpdatedAt: new Date().toISOString(),
        };
      })
    );

    await kvWithRetry.set("blog_articles", articlesToSave);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-3bd0ade8/blog-categories", async (c) => {
  try {
    const categories = await kvWithRetry.get("blog_categories");
    return c.json({ success: true, categories: categories || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error), categories: [] }, 500);
  }
});

app.post("/make-server-3bd0ade8/blog-categories", async (c) => {
  try {
    const { categories } = await c.req.json();
    await kvWithRetry.set("blog_categories", categories);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== AVAILABILITY =====

app.get("/make-server-3bd0ade8/availability", async (c) => {
  try {
    const all = await kvWithRetry.getByPrefix("availability_");
    return c.json({ success: true, availability: all || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-3bd0ade8/availability/:date", async (c) => {
  try {
    const date = c.req.param("date");
    await cityCards.cleanup();
    const day = await cityCards.inventory(date);
    return c.json({
      success: true,
      // Preserve the website's slot picker, with holds and the daily ceiling applied.
      availability: {date,totalSeats:day.capacity,bookedSeats:day.booked,reservedSeats:day.reserved,availableSeats:day.remaining,
        ...Object.fromEntries(Object.entries(day.slots).map(([slot,detail]:[string,any])=>[slot,detail.remaining]))},
      day,
    });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/availability/:date", async (c) => {
  try {
    // Compatibility for an already-open admin tab using the previous slot editor.
    const date=c.req.param('date'), body=await c.req.json(), day=await cityCards.inventory(date);
    const slots:Record<string,number>={};
    for(const [slot,detail] of Object.entries(day.slots) as [string,any][]) {
      if(!Number.isInteger(body[slot])||body[slot]<0||body[slot]>100000) return c.json({success:false,error:'Enter a valid allocation for every slot'},400);
      slots[slot]=body[slot]+detail.booked;
    }
    const {error}=await supabase.rpc('set_day_pass_day',{p_date:date,p_capacity:day.capacity,p_opens:day.opens,p_closes:day.closes,p_slots:slots});
    if(error) return c.json({success:false,error:error.message},409);
    return c.json({success:true});
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== SUNSET SPECIAL AVAILABILITY =====

app.get("/make-server-3bd0ade8/sunset-special/availability/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const maxSeats = parseInt(c.req.query("maxSeats") || "8");
    const bookings = (await kvWithRetry.get(`sunset_bookings_${date}`) as any[]) || [];
    const bookedSeats = bookings.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);
    const availableSeats = Math.max(0, maxSeats - bookedSeats);
    return c.json({ success: true, date, availableSeats, bookedSeats, maxSeats, available: availableSeats > 0 });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== PAYMENTS =====

// GET /stripe-config — returns the publishable key so the frontend can initialise Stripe.js
app.get("/make-server-3bd0ade8/stripe-config", (c) => {
  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
  if (!publishableKey) {
    return c.json({ success: false, error: "Stripe publishable key not configured" }, 503);
  }
  return c.json({ success: true, publishableKey });
});

async function reconcileExpiredCheckouts() {
  await cityCards.cleanup();
  const { data, error } = await supabase.from("checkout_holds").select("payment_id,kind")
    .eq("state", "active").not("payment_id", "like", "city_%").lt("expires_at", new Date().toISOString()).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(20);
  if (error) throw new Error("Checkout reservations unavailable");
  await Promise.all((data || []).map(async hold => {
    try {
      const { error: touchError } = await supabase.from("checkout_holds").update({ last_checked_at: new Date().toISOString() }).eq("payment_id", hold.payment_id);
      if (touchError) throw touchError;
      await reconcileCheckoutHold(hold, {
        retrieve: id => stripe!.paymentIntents.retrieve(id),
        cancel: id => stripe!.paymentIntents.cancel(id),
        release: async id => { const { error } = await supabase.rpc("release_checkout", { p_payment: id }); if (error) throw error; },
        finalize: (id, kind) => kind === "tour" ? finalizeTourPaymentIntent(id) : kind === "addon" ? finalizeAddonPaymentIntent(id) : finalizePaymentIntent(id, "expired-hold-recovery"),
      });
    } catch (error) { console.error("Checkout hold retained for review", hold.payment_id, error); }
  }));
}

async function reserveCheckout(paymentId: string, kind: string, purchase: any) {
  const { data, error } = await supabase.rpc("reserve_checkout", { p_payment: paymentId, p_kind: kind, p_purchase: purchase });
  if (error) {
    // The client secret has not been returned yet; never offer payment without seats.
    try { await stripe!.paymentIntents.cancel(paymentId); } catch (cancelError) { console.error("Unused payment cancellation failed", paymentId, cancelError); }
    throw new Error(error.message);
  }
  return data;
}

app.post("/make-server-3bd0ade8/create-payment-intent", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    let { amount, currency = "eur", metadata, pendingBookingData, pendingSunsetSpecialData } = (c.get("ridePurchaseBody") ?? await c.req.json());
    if (pendingBookingData && pendingSunsetSpecialData) return c.json({ success: false, error: "Choose one purchase type" }, 400);
    if (pendingBookingData) {
      try {
        pendingBookingData = priceTicket(pendingBookingData, await kvWithRetry.get("pricing_config"));
        if (currency !== "eur" || typeof amount !== "number" || Math.round(amount * 100) !== pendingBookingData.paymentQuote.amountCents) return c.json({ success: false, error: "Ticket prices changed. Refresh checkout and try again." }, 400);
        amount = pendingBookingData.totalPrice;
        currency = "eur";
        metadata = { ...metadata, purchaseKind: "ticket" };
      } catch (error) {
        return c.json({ success: false, error: String(error) }, 400);
      }
    }

    if (!pendingBookingData && !pendingSunsetSpecialData) return c.json({ success: false, error: "Purchase details required" }, 400);
    if (pendingSunsetSpecialData) {
      try {
        const booking = await kv.get(pendingSunsetSpecialData.bookingId) as any;
        const content = await kvWithRetry.get("comprehensive_content") as any;
        pendingSunsetSpecialData = priceAddon(pendingSunsetSpecialData, booking, content?.homepage?.sunsetSpecial?.price);
        if (currency !== "eur" || typeof amount !== "number" || Math.round(amount * 100) !== pendingSunsetSpecialData.paymentQuote.amountCents) return c.json({ success: false, error: "Prices changed. Refresh checkout." }, 400);
        amount = pendingSunsetSpecialData.amount;
        metadata = { ...metadata, purchaseKind: "addon" };
      } catch (error) { return c.json({ success: false, error: String(error) }, 400); }
    }

    // Only new day-pass purchases (identified by pendingBookingData) are gated by
    // the admin toggle — sunset-special add-ons are for customers who already have
    // a valid booking and shouldn't be blocked by disabling new ticket sales.
    if (pendingBookingData) {
      const purchasesEnabled = await kvWithRetry.get("ticket_purchases_enabled");
      if (purchasesEnabled === false) {
        return c.json({ success: false, error: "Ticket purchases are currently disabled" }, 403);
      }
    }

    await reconcileExpiredCheckouts();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });

    const holdExpiresAt = await reserveCheckout(paymentIntent.id, pendingBookingData ? "ticket" : "addon", pendingBookingData || pendingSunsetSpecialData);
    return c.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, holdExpiresAt });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-bookings/create-payment-intent", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    let { amount, currency = "eur", metadata, pendingTourBookingData } = await c.req.json();
    try {
      const tours = await kvWithRetry.get("private_tours") as any[];
      pendingTourBookingData = priceTour(pendingTourBookingData, tours?.find((tour: any) => tour.id === pendingTourBookingData?.tourId));
      if (currency !== "eur" || typeof amount !== "number" || Math.round(amount * 100) !== pendingTourBookingData.paymentQuote.amountCents) return c.json({ success: false, error: "Tour prices changed. Refresh checkout." }, 400);
      amount = pendingTourBookingData.amount;
      metadata = { ...metadata, purchaseKind: "tour" };
    } catch (error) { return c.json({ success: false, error: String(error) }, 400); }
    await reconcileExpiredCheckouts();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });

    const holdExpiresAt = await reserveCheckout(paymentIntent.id, "tour", pendingTourBookingData);
    return c.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, holdExpiresAt });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/verify-payment", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { paymentIntentId } = await c.req.json();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return c.json({ success: true, status: paymentIntent.status, paid: paymentIntent.status === "succeeded" });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Creates a booking from data stashed at payment-intent-creation time. Used by the
// webhook safety net and by the admin recovery endpoint below.
async function createBookingFromPendingPI(piId: string, pending: any, source: string) {
  const bookingId = await generateBookingId();
  const passengerList: any[] = pending.passengers || [];
  const qrCodes: string[] = [];
  for (let i = 0; i < passengerList.length; i++) {
    qrCodes.push(await generateQRCode(bookingId, i));
  }

  const booking = {
    id: bookingId,
    ...pending,
    qrCodes,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    paymentStatus: "paid",
    paymentIntentId: piId,
    source,
  };

  const committed = await commitDayPass(booking, piId);
  if (committed.alreadyExisted) return { bookingId: committed.booking.id, booking: committed.booking };

  try {
    const prefix = bookingId.split("-")[0];
    const usedPrefixes = ((await kv.get("booking_used_prefixes")) as string[]) || [];
    if (!usedPrefixes.includes(prefix)) {
      usedPrefixes.push(prefix);
      await kv.set("booking_used_prefixes", usedPrefixes);
    }
  } catch {}

  booking.delivery = { customerEmail: await sendBookingEmail(booking, qrCodes), attemptedAt: new Date().toISOString() };

  const passengerCount = booking.passengers?.length || 1;
  const customerName = booking.contactInfo?.name || booking.fullName || "Guest";
  const customerEmail = booking.contactInfo?.email || booking.email || "—";
  try {
    booking.delivery.ownerPush = await sendPushNotification(
      `🎟️ New booking (${source}) — ${booking.selectedDate}`,
      `${passengerCount} day pass${passengerCount > 1 ? "es" : ""}\nCustomer: ${customerName}\nPickup: ${booking.pickupLocation ?? "—"} at ${booking.timeSlot ?? "—"}\nTotal: €${booking.totalPrice ?? "—"}`,
      "urgent",
      ["ticket", "moneybag"],
    );
  } catch {}
  try {
    booking.delivery.ownerEmail = await sendOwnerNotification(
      `🎟️ New Booking (${source}): ${passengerCount} Day Pass${passengerCount > 1 ? "es" : ""} – ${booking.selectedDate}`,
      `<h2>New Day Pass Booking — via ${source}</h2>
<ul>
  <li><strong>Booking ID:</strong> ${booking.id}</li>
  <li><strong>Customer:</strong> ${customerName} (${customerEmail})</li>
  <li><strong>Date:</strong> ${booking.selectedDate}</li>
  <li><strong>Passengers:</strong> ${passengerCount}</li>
  <li><strong>Total:</strong> €${booking.totalPrice ?? "—"}</li>
  <li><strong>Pickup:</strong> ${booking.pickupLocation ?? "—"}</li>
  <li><strong>Time Slot:</strong> ${booking.timeSlot ?? "—"}</li>
</ul>`,
    );
  } catch {}

  await kv.set(bookingId, { ...await kv.get(bookingId), delivery: booking.delivery });
  return { bookingId, booking, qrCodes };
}

// GET /admin/pending-payments — lists payment intents that were charged but never
// turned into a booking/add-on (i.e. the client dropped AND the recovery path never
// fired/failed). Covers all three redirect-recoverable flows: day-pass tickets,
// private tour bookings, and sunset-special add-ons.
app.get("/make-server-3bd0ade8/admin/pending-payments", async (c) => {
  try {
    const prefixes: Array<{ prefix: string; kind: string }> = [
      { prefix: "pending_pi_", kind: "ticket" },
      { prefix: "pending_tour_pi_", kind: "tour" },
      { prefix: "pending_addon_pi_", kind: "addon" },
    ];

    const pending: any[] = [];
    for (const { prefix, kind } of prefixes) {
      const { data, error } = await supabase
        .from("kv_store_3bd0ade8")
        .select("key, value")
        .like("key", `${prefix}%`);
      if (error) throw error;
      for (const row of data || []) {
        if (row.value?.completedAt) continue;
        pending.push({
          kind,
          paymentIntentId: row.key.replace(prefix, ""),
          ...row.value,
        });
      }
    }

    return c.json({ success: true, pending });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Verifies a payment intent succeeded with Stripe, then finalizes the booking from
// the pending data stashed at payment-intent-creation time. Idempotent — safe to
// call more than once for the same PI (e.g. admin recovery + client redirect-return
// both calling in for the same payment).
async function finalizePaymentIntent(paymentIntentId: string, source: string) {
  const claimed = await kv.get(`pi_claimed_${paymentIntentId}`) as any;
  if (claimed?.bookingId) {
    const existingBooking = await kv.get(claimed.bookingId);
    return { alreadyExisted: true, bookingId: claimed.bookingId, booking: existingBooking };
  }

  const paymentIntent = await stripe!.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment intent status is "${paymentIntent.status}", not "succeeded"`);
  }

  const pending = await kv.get(`pending_pi_${paymentIntentId}`) as any;
  if (!pending) {
    throw new Error("No pending booking data found for this payment intent");
  }

  verifyTicketPayment(paymentIntent, pending);
  const { bookingId, booking } = await createBookingFromPendingPI(paymentIntentId, pending, source);
  return { alreadyExisted: false, bookingId, booking };
}

// POST /admin/recover-payment — manually finalizes a booking/add-on for a payment
// intent that Stripe confirms succeeded but that never got completed. Accepts an
// optional "kind" ("ticket" | "tour" | "addon"); if omitted it's auto-detected from
// whichever pending_* record exists for this payment intent.
app.post("/make-server-3bd0ade8/admin/recover-payment", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Stripe not configured" }, 503);
  try {
    const { paymentIntentId, kind } = await c.req.json();
    if (!paymentIntentId) return c.json({ success: false, error: "paymentIntentId required" }, 400);

    let resolvedKind = kind;
    if (!resolvedKind) {
      if (await kv.get(`pending_pi_${paymentIntentId}`)) resolvedKind = "ticket";
      else if (await kv.get(`pending_tour_pi_${paymentIntentId}`)) resolvedKind = "tour";
      else if (await kv.get(`pending_addon_pi_${paymentIntentId}`)) resolvedKind = "addon";
    }

    if (resolvedKind === "tour") {
      const result = await finalizeTourPaymentIntent(paymentIntentId);
      return c.json({ success: true, kind: "tour", ...result });
    }
    if (resolvedKind === "addon") {
      const result = await finalizeAddonPaymentIntent(paymentIntentId);
      return c.json({ success: true, kind: "addon", ...result });
    }
    const result = await finalizePaymentIntent(paymentIntentId, "admin-recovery");
    return c.json({ success: true, kind: "ticket", ...result });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 400);
  }
});

// POST /finalize-payment — called by the client right after returning from a
// redirect-based payment method (PayPal, etc). Those redirects reload the page and
// wipe in-memory booking state, so the client can't finish the normal POST /bookings
// flow; this uses the pending data stashed server-side when the payment intent was
// created instead. Same idempotency guard as the webhook, so it's safe even if the
// webhook also fires for the same payment.
app.post("/make-server-3bd0ade8/finalize-payment", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { paymentIntentId } = await c.req.json();
    if (!paymentIntentId) return c.json({ success: false, error: "paymentIntentId required" }, 400);
    const result = await finalizePaymentIntent(paymentIntentId, "client-redirect-return");
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 400);
  }
});

// POST /stripe-webhook — safety net: creates booking if client dropped after payment
app.post("/make-server-3bd0ade8/stripe-webhook", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Stripe not configured" }, 503);
  return await handlePaymentWebhook(c.req.raw, {
    secret: Deno.env.get("STRIPE_WEBHOOK_SECRET"),
    verify: (body, signature, secret) =>
      stripe.webhooks.constructEventAsync(body, signature, secret),
    process: async (event) => {
      if (await cityCards.webhook(event)) return;
      if (event.type !== "payment_intent.succeeded") return;
      const payment = event.data.object as { id?: unknown } | null;
      if (!payment || typeof payment.id !== "string" || !payment.id.startsWith("pi_")) {
        throw new Error("Invalid payment intent in verified webhook");
      }
      const piId = payment.id;

      // Do not swallow database errors: acknowledging them loses Stripe retries.
      const claimed = await kv.get(`pi_claimed_${piId}`) as any;
      if (claimed?.bookingId) return;

      const pending = await kv.get(`pending_pi_${piId}`) as any;
      if (pending) {
        // Reuse the recovery path, which independently retrieves the payment
        // from Stripe and verifies that it actually succeeded.
        await finalizePaymentIntent(piId, "stripe-webhook");
      } else if (await kv.get(`pending_tour_pi_${piId}`)) {
        await finalizeTourPaymentIntent(piId);
      } else if (await kv.get(`pending_addon_pi_${piId}`)) {
        await finalizeAddonPaymentIntent(piId);
      }
    },
    onProcessingError: (error) => console.error("Webhook fulfillment failed:", error),
  });
});

// ===== INFO BAR (time / weather / traffic) =====

app.get("/make-server-3bd0ade8/info-bar", async (c) => {
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // Return cached value if fresh AND it has complete data (don't serve a
  // cache that was built before the API keys were active)
  try {
    const cached = await kvWithRetry.get("info_bar_cache") as any;
    if (
      cached &&
      cached.weather !== null &&
      Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS
    ) {
      return c.json(cached);
    }
  } catch (_) { /* ignore cache read errors */ }

  // API keys — Supabase secrets only, no embedded fallback
  const OWM_KEY = Deno.env.get("OPENWEATHER_API_KEY");
  const TT_KEY  = Deno.env.get("TOMTOM_API_KEY");

  // --- Weather (OpenWeatherMap) ---
  let weather: { temp: number; description: string; icon: string } | null = null;
  try {
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=38.7979&lon=-9.3879&appid=${OWM_KEY}&units=metric`
    );
    const d = await r.json();
    console.log("[info-bar] OWM response:", JSON.stringify(d).slice(0, 200));
    if (d.main && d.weather?.[0]) {
      weather = {
        temp: Math.round(d.main.temp),
        description: d.weather[0].description,
        icon: d.weather[0].icon,
      };
    } else {
      console.error("[info-bar] OWM unexpected shape — cod:", d.cod, "msg:", d.message);
    }
  } catch (e) {
    console.error("[info-bar] Weather fetch failed:", e);
  }

  // --- Traffic (TomTom Routing API — Sintra Train Station → Pena Palace) ---
  // Compares current travel time with free-flow time to classify congestion.
  // Origin: Sintra Train Station (38.8011,-9.3873)
  // Destination: Pena Palace (38.7879,-9.3902)
  let traffic: { level: string; delaySeconds: number; travelTimeSeconds: number } | null = null;
  try {
    if (!TT_KEY) throw new Error("Traffic service is not configured");
    const origin = "38.8011,-9.3873";
    const dest   = "38.7879,-9.3902";
    const r = await fetch(
      `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${dest}/json?key=${TT_KEY}&traffic=true&travelMode=car&computeTravelTimeFor=all`
    );
    const d = await r.json();
    const summary = d?.routes?.[0]?.summary;
    if (summary) {
      const travelTime = summary.travelTimeInSeconds ?? 0;
      const travelMinutes = travelTime / 60;
      // Thresholds based on absolute travel time (Train Station → Pena Palace ticket office)
      // <23 min = clear, 23–29 min = light, 30–36 min = medium, >36 min = heavy
      const level =
        travelMinutes < 23 ? "clear"  :
        travelMinutes < 30 ? "light"  :
        travelMinutes < 37 ? "medium" : "heavy";
      traffic = { level, travelTimeSeconds: travelTime };
    }
  } catch (e) {
    console.error("Traffic fetch failed:", e);
  }

  const result = { success: true, weather, traffic, cachedAt: new Date().toISOString() };

  // Cache result (ignore write errors)
  try { await kvWithRetry.set("info_bar_cache", result); } catch (_) {}

  return c.json(result);
});

// ===== SITEMAP =====

app.get("/make-server-3bd0ade8/sitemap.xml", async (c) => {
  const BASE_URL = "https://www.hoponsintra.com";
  const today = new Date().toISOString().split("T")[0];

  // Static pages that never change
  const staticUrls = [
    { loc: `${BASE_URL}/`,               changefreq: "daily",   priority: "1.0", lastmod: today },
    { loc: `${BASE_URL}/hop-on-hop-off-sintra`, changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/attractions`,    changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/private-tours`,  changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/travel-guide`,   changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/about`,          changefreq: "monthly", priority: "0.7", lastmod: today },
    { loc: `${BASE_URL}/route-map`,      changefreq: "monthly", priority: "0.7", lastmod: today },
    // Public-facing standalone tools — robots.txt explicitly allows these for indexing
    { loc: `${BASE_URL}/sintra-day-planner.html`, changefreq: "monthly", priority: "0.8", lastmod: today },
    { loc: `${BASE_URL}/cinema-no-mato.html`,     changefreq: "weekly",  priority: "0.8", lastmod: today },
  ];

  // Dynamic URLs collected from KV
  const dynamicUrls: { loc: string; changefreq: string; priority: string; lastmod: string }[] = [];

  // --- Attractions (driven by JSON locale files in the codebase) ---
  const attractionSlugs = [
    "pena-palace",
    "quinta-regaleira",
    "moorish-castle",
    "monserrate-palace",
    "sintra-palace",
    "convento-capuchos",
    "cabo-da-roca",
    "villa-sassetti",
    "biester-chalet",
    "queluz-palace",
    "mafra-convent",
  ];
  for (const slug of attractionSlugs) {
    dynamicUrls.push({
      loc: `${BASE_URL}/attractions/${slug}`,
      changefreq: "monthly",
      priority: "0.8",
      lastmod: today,
    });
  }

  // --- Blog articles ---
  try {
    const articles = (await kvWithRetry.get("blog_articles") as any[]) || [];
    for (const a of articles) {
      // Support both field names: isPublished (frontend) and published (legacy)
      const isPublished = a.isPublished !== false && a.published !== false && a.status !== "draft";
      if (!isPublished) continue;
      const slug = a.slug || a.id;
      if (slug) {
        dynamicUrls.push({
          loc: `${BASE_URL}/travel-guide/${slug}`,
          changefreq: "monthly",
          priority: "0.8",
          lastmod: a.updatedAt ? a.updatedAt.split("T")[0]
                 : a.publishedAt ? a.publishedAt.split("T")[0]
                 : today,
        });
      }
    }
  } catch (_) { /* skip on error */ }

  // --- Private tours ---
  try {
    const tours = (await kvWithRetry.get("private_tours") as any[]) || [];
    for (const t of tours) {
      if (!t.published) continue;
      dynamicUrls.push({
        loc: `${BASE_URL}/private-tours/${t.id}`,
        changefreq: "monthly",
        priority: "0.7",
        lastmod: t.updatedAt ? t.updatedAt.split("T")[0] : today,
      });
    }
  } catch (_) { /* skip on error */ }

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allUrls.map(u =>
      `  <url>\n` +
      `    <loc>${u.loc}</loc>\n` +
      `    <lastmod>${u.lastmod}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      `  </url>`
    ).join("\n") +
    `\n</urlset>`;

  return c.body(xml, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

Deno.serve(app.fetch);






