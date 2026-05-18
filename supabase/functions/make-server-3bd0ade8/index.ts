import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";


import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";
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
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("*", logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

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
  try {
    console.log(`🔧 Starting PDF generation for booking ${booking.id}`);
    const pdfDoc = await PDFDocument.create();
    
    const formattedDate = new Date(booking.selectedDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const shortDate = new Date(booking.selectedDate).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    const bookingIdShort = booking.id.split("_")[1] || booking.id;

    for (let i = 0; i < booking.passengers.length; i++) {
      const passenger = booking.passengers[i];
      const qrCode = qrCodes[i];
      const page = pdfDoc.addPage([595, 842]); 
      const { width, height } = page.getSize();

      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.957, 0.929) });
      page.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: rgb(0.039, 0.302, 0.361) });
      page.drawRectangle({ x: 0, y: height - 145, width, height: 5, color: rgb(0.851, 0.471, 0.263) });

      page.drawText("GO SINTRA", { x: width / 2 - 90, y: height - 55, size: 36, color: rgb(1, 1, 1) });
      page.drawText("DAY PASS", { x: width / 2 - 44, y: height - 85, size: 20, color: rgb(0.851, 0.471, 0.263) });

      if (booking.passengers.length > 1) {
        const badgeText = `${i + 1} / ${booking.passengers.length}`;
        const badgeWidth = badgeText.length * 7;
        page.drawText(badgeText, { x: width / 2 - badgeWidth / 2, y: height - 115, size: 14, color: rgb(0.941, 0.914, 0.894) });
      }

      let yPos = height - 200;
      page.drawText("SCAN TO BOARD", { x: width / 2 - 58, y: yPos, size: 16, color: rgb(0.039, 0.302, 0.361) });
      yPos -= 40;

      if (qrCode) {
        try {
          const qrBase64 = qrCode.replace(/^data:image\/png;base64,/, "");
          const qrImageBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));
          const qrImage = await pdfDoc.embedPng(qrImageBytes);
          const qrSize = 220;
          const qrX = (width - qrSize) / 2;

          page.drawRectangle({
            x: qrX - 12, y: yPos - qrSize - 12, width: qrSize + 24, height: qrSize + 24,
            color: rgb(1, 1, 1), borderColor: rgb(0.039, 0.302, 0.361), borderWidth: 4,
          });
          page.drawImage(qrImage, { x: qrX, y: yPos - qrSize, width: qrSize, height: qrSize });
          yPos -= qrSize + 30;
        } catch (err) {
          console.error(`Error adding QR code`, err);
        }
      }

      page.drawText("PASSENGER", { x: width / 2 - 27, y: yPos, size: 11, color: rgb(0.42, 0.447, 0.533) });
      yPos -= 25;
      const passengerName = (passenger.name || passenger.fullName || `Passenger ${i + 1}`).toUpperCase();
      const nameWidth = passengerName.length * 13;
      page.drawText(passengerName, { x: (width - nameWidth) / 2, y: yPos, size: 22, color: rgb(0.039, 0.302, 0.361) });
      yPos -= 50;

      const leftCol = 100;
      const rightCol = width / 2 + 50;

      page.drawText("DATE", { x: leftCol, y: yPos, size: 10, color: rgb(0.42, 0.447, 0.533) });
      page.drawText(shortDate, { x: leftCol, y: yPos - 20, size: 14, color: rgb(0.039, 0.302, 0.361) });

      page.drawText("TYPE", { x: rightCol, y: yPos, size: 10, color: rgb(0.42, 0.447, 0.533) });
      page.drawText(passenger.type || 'Adult', { x: rightCol, y: yPos - 20, size: 14, color: rgb(0.039, 0.302, 0.361) });
      yPos -= 70;

      page.drawText("VALID HOURS", { x: leftCol, y: yPos, size: 10, color: rgb(0.42, 0.447, 0.533) });
      page.drawText("9:00 AM - 8:00 PM", { x: leftCol, y: yPos - 20, size: 14, color: rgb(0.039, 0.302, 0.361) });

      page.drawText("BOOKING ID", { x: rightCol, y: yPos, size: 10, color: rgb(0.42, 0.447, 0.533) });
      page.drawText(bookingIdShort, { x: rightCol, y: yPos - 20, size: 14, color: rgb(0.039, 0.302, 0.361) });
      yPos -= 70;

      page.drawText("HOW TO USE", { x: width / 2 - 30, y: yPos, size: 11, color: rgb(0.42, 0.447, 0.533) });
      yPos -= 25;
      page.drawText("Show QR code to driver • Unlimited rides until 8 PM", { x: width / 2 - 159, y: yPos, size: 11, color: rgb(0.176, 0.204, 0.212) });
      yPos -= 20;
      page.drawText("Professional guides • Vehicles every 10-15 minutes", { x: width / 2 - 153, y: yPos, size: 11, color: rgb(0.176, 0.204, 0.212) });

      page.drawRectangle({ x: 0, y: 0, width, height: 100, color: rgb(0.039, 0.302, 0.361) });
      page.drawRectangle({ x: 0, y: 100, width, height: 5, color: rgb(0.851, 0.471, 0.263) });

      const footerTitle = "GO SINTRA";
      page.drawText(footerTitle, { x: width / 2 - (footerTitle.length * 4), y: 65, size: 14, color: rgb(1, 1, 1) });
      const footerSubtitle = "Premium Hop-On/Hop-Off Service";
      page.drawText(footerSubtitle, { x: width / 2 - (footerSubtitle.length * 2.75), y: 48, size: 10, color: rgb(0.851, 0.471, 0.263) });
      const contactLine = "info@hoponsintra.com  |  WhatsApp: +351 932 967 279";
      page.drawText(contactLine, { x: width / 2 - (contactLine.length * 2.5), y: 30, size: 9, color: rgb(1, 1, 1) });
      const hoursLine = "Operating Daily: 9:00 AM - 8:00 PM  |  Sintra, Portugal";
      page.drawText(hoursLine, { x: width / 2 - (hoursLine.length * 2.25), y: 15, size: 8, color: rgb(0.941, 0.914, 0.894) });
    }

    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return base64;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// Send Booking Email
async function sendBookingEmail(booking: any, qrCodes: string[]) {
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
    const htmlContent = generateBookingConfirmationHTML({
      customerName: booking.contactInfo?.name || booking.fullName || 'Guest',
      bookingId: booking.id,
      selectedDate: booking.selectedDate,
      formattedDate,
      passengers: passengersWithQR,
      totalPrice: booking.totalPrice,
      dayPassCount: booking.passengers.length,
      guidedTour: booking.guidedTour,
      attractions: booking.selectedAttractions,
    });

    const recipientEmail = booking.contactInfo?.email || booking.email;
    if (!recipientEmail) return { success: false, error: 'No email address provided' };

    let pdfBase64;
    try {
      pdfBase64 = await generateBookingPDF(booking, qrCodes);
    } catch (e) { console.error("PDF gen failed", e); }

    const bookingIdShort = booking.id.split("_")[1] || booking.id;
    const emailPayload: any = {
      from: "Hop On Sintra <bookings@hoponsintra.com>",
      to: [recipientEmail],
      reply_to: "info@hoponsintra.com",
      subject: `🎉 Your Hop On Sintra Booking Confirmed - ${formattedDate}`,
      html: htmlContent,
    };

    if (pdfBase64) {
      emailPayload.attachments = [{ filename: `HopOnSintra_Tickets_${bookingIdShort}.pdf`, content: pdfBase64 }];
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log(`📧 Email sent to ${recipientEmail}`);
    return { success: true, emailId: result.id, pdfAttached: !!pdfBase64 };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

// ========== ROUTES ==========

// Health check
app.get("/make-server-3bd0ade8/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Create Booking
app.post("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIntentId, isTestBooking, skipEmail } = body;

    // Payment verification
    if (stripe && paymentIntentId && !isTestBooking) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
          return c.json({ success: false, error: "Payment verification failed." }, 400);
        }
      } catch (error) {
        return c.json({ success: false, error: "Payment verification error" }, 400);
      }
    }

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

    await kv.set(bookingId, booking);

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
    let emailResult = { success: true, skipped: false };
    if (!skipEmail) {
      emailResult = await sendBookingEmail(booking, qrCodes);
    } else {
      emailResult.skipped = true;
    }

    return c.json({ success: true, booking, emailSent: emailResult.success });
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
    
    if (existingCheckIn) {
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

// Verify QR
app.post("/make-server-3bd0ade8/verify-qr", async (c) => {
  try {
    const { qrData } = await c.req.json();
    const [bookingId, passengerIndexStr] = qrData.split("|");
    const passengerIndex = parseInt(passengerIndexStr);

    const booking = await kv.get(bookingId);
    if (!booking) return c.json({ success: false, message: "Booking not found" });

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
        customerName: booking.contactInfo.name,
        passType: `${booking.passengers.length} Day Pass`,
        numPasses: booking.passengers.length,
        passDate: booking.selectedDate,
        passengerIndex,
        alreadyCheckedIn: !!existingCheckIn,
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

// 2. Create Request (Customer)
app.post("/make-server-3bd0ade8/pickup-requests", async (c) => {
  try {
    const body = await c.req.json();
    const { groupSize, pickupLocation, destination, customerName, customerPhone } = body;

    const requestId = `PICKUP_${Date.now()}`;
    const pickupRequest = {
      id: requestId,
      groupSize: parseInt(groupSize),
      pickupLocation, destination, customerName, customerPhone,
      status: "pending",
      requestTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 5 * 60000).toISOString(),
      vehiclesNeeded: Math.ceil(parseInt(groupSize) / 6),
    };

    await kv.set(requestId, pickupRequest);

    // Maintain active list
    const activeRequests = (await kv.get("active_pickup_requests")) || [];
    activeRequests.push(requestId);
    await kv.set("active_pickup_requests", activeRequests);

    console.log(`🚗 Pickup created: ${requestId}`);
    return c.json({ success: true, request: pickupRequest });
  } catch (error) {
    return c.json({ success: false, error: "Failed to create pickup" }, 500);
  }
});

// 3. Update Status (Cancel/Complete)
app.post("/make-server-3bd0ade8/pickup-requests/:id/cancel", async (c) => {
  try {
    const requestId = c.req.param("id");
    // FIX: Look up ID directly
    const request = await kv.get(requestId); 

    if (!request) return c.json({ success: false, error: "Request not found" }, 404);

    request.status = "cancelled";
    await kv.set(requestId, request);
    return c.json({ success: true, request });
  } catch (error) {
    return c.json({ success: false, error: "Failed to cancel" }, 500);
  }
});

app.post("/make-server-3bd0ade8/pickup-requests/:id/complete", async (c) => {
  try {
    const requestId = c.req.param("id");
    // FIX: Look up ID directly
    const request = await kv.get(requestId);

    if (!request) return c.json({ success: false, error: "Request not found" }, 404);

    request.status = "completed";
    request.completedTime = new Date().toISOString();
    await kv.set(requestId, request);
    return c.json({ success: true, request });
  } catch (error) {
    return c.json({ success: false, error: "Failed to complete" }, 500);
  }
});

// 4. Assign Driver
app.post("/make-server-3bd0ade8/pickup-requests/:id/assign", async (c) => {
  try {
    const requestId = c.req.param("id");
    const body = await c.req.json();
    const { driverId, driverName } = body;

    // FIX: Look up ID directly
    const request = await kv.get(requestId);

    if (!request) return c.json({ success: false, error: "Request not found" }, 404);

    request.status = "accepted";
    request.acceptedBy = driverId;
    request.acceptedByName = driverName;
    request.acceptedAt = new Date().toISOString();
    await kv.set(requestId, request);

    console.log(`✅ Pickup ${requestId} accepted by ${driverName}`);
    return c.json({ success: true, request });
  } catch (error) {
    return c.json({ success: false, error: "Failed to accept" }, 500);
  }
});

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
        visitDate: booking.visitDate || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Login verification error:", error);
    return c.json({ success: false, error: "Verification failed" }, 500);
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
    existing.push(newBooking);
    await kvWithRetry.set("tour_bookings", existing);
    return c.json({ success: true, booking: newBooking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-bookings/:id/cancel", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = (await kvWithRetry.get("tour_bookings") as any[]) || [];
    const idx = existing.findIndex((b: any) => b.bookingId === id);
    if (idx === -1) return c.json({ success: false, error: "Not found" }, 404);
    existing[idx] = { ...existing[idx], status: "cancelled", cancelledAt: new Date().toISOString() };
    await kvWithRetry.set("tour_bookings", existing);
    return c.json({ success: true, booking: existing[idx] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /tour-bookings/create — called after Stripe payment succeeds
app.post("/make-server-3bd0ade8/tour-bookings/create", async (c) => {
  try {
    const body = await c.req.json();
    const { tourId, tourDate, customerInfo, paymentIntentId } = body;

    // Verify the payment actually succeeded before saving the booking
    if (stripe && paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded") {
        return c.json({ success: false, error: "Payment not completed" }, 400);
      }
    }

    const existing = (await kvWithRetry.get("tour_bookings") as any[]) || [];

    // Prevent duplicate bookings for the same payment intent
    if (paymentIntentId && existing.some((b: any) => b.paymentIntentId === paymentIntentId)) {
      const duplicate = existing.find((b: any) => b.paymentIntentId === paymentIntentId);
      return c.json({ success: true, booking: duplicate });
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
    existing.push(newBooking);
    await kvWithRetry.set("tour_bookings", existing);

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

    return c.json({ success: true, booking: newBooking });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
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

// GET /drivers — list all drivers (admin use)
app.get("/make-server-3bd0ade8/drivers", async (c) => {
  const driversData = await kvWithRetry.get("drivers_list");
  const drivers = ((driversData as any[]) || []).map((d: any) => {
    const { password: _, ...safe } = d;
    return safe;
  });
  return c.json({ success: true, drivers });
});

// POST /drivers/create — admin: add a new driver account
app.post("/make-server-3bd0ade8/drivers/create", async (c) => {
  try {
    const body = await c.req.json();
    const { name, username, password, phoneNumber, vehicleType, licenseNumber, status } = body;

    if (!name || !username || !password) {
      return c.json({ success: false, error: "Name, username, and password are required" }, 400);
    }

    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];

    if (drivers.some((d: any) => d.username === username)) {
      return c.json({ success: false, error: "Username already taken" }, 409);
    }

    const newDriver = {
      id: `driver_${Date.now()}`,
      name,
      username,
      password,
      phoneNumber: phoneNumber || "",
      vehicleType: vehicleType || "",
      licenseNumber: licenseNumber || "",
      status: status || "offline",
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalQRScans: 0,
      createdAt: new Date().toISOString(),
    };

    drivers.push(newDriver);
    await kvWithRetry.set("drivers_list", drivers);

    const { password: _pw, ...safeDriver } = newDriver;
    return c.json({ success: true, driver: safeDriver });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT /drivers/:id — admin: update driver profile
app.put("/make-server-3bd0ade8/drivers/:id", async (c) => {
  try {
    const driverId = c.req.param("id");
    const body = await c.req.json();

    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];
    const idx = drivers.findIndex((d: any) => d.id === driverId);
    if (idx === -1) return c.json({ success: false, error: "Driver not found" }, 404);

    // If username changed, ensure it's not taken by another driver
    if (body.username && body.username !== drivers[idx].username) {
      if (drivers.some((d: any, i: number) => i !== idx && d.username === body.username)) {
        return c.json({ success: false, error: "Username already taken" }, 409);
      }
    }

    drivers[idx] = {
      ...drivers[idx],
      ...body,
      id: driverId, // prevent id change
      updatedAt: new Date().toISOString(),
    };

    await kvWithRetry.set("drivers_list", drivers);

    const { password: _pw, ...safeDriver } = drivers[idx];
    return c.json({ success: true, driver: safeDriver });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE /drivers/:id — admin: remove a driver account
app.delete("/make-server-3bd0ade8/drivers/:id", async (c) => {
  try {
    const driverId = c.req.param("id");
    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];
    const filtered = drivers.filter((d: any) => d.id !== driverId);

    if (filtered.length === drivers.length) {
      return c.json({ success: false, error: "Driver not found" }, 404);
    }

    await kvWithRetry.set("drivers_list", filtered);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /drivers/login
app.post("/make-server-3bd0ade8/drivers/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ success: false, error: "Username and password required" }, 400);
    }

    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];
    const driverIdx = drivers.findIndex(
      (d: any) => (d.username === username || d.email === username) && d.password === password
    );

    if (driverIdx === -1) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    // Mark driver online
    drivers[driverIdx] = {
      ...drivers[driverIdx],
      status: "online",
      lastLoginAt: new Date().toISOString(),
    };
    await kvWithRetry.set("drivers_list", drivers);

    // Return driver without password
    const { password: _pw, ...driverInfo } = drivers[driverIdx];
    const token = `drv_${driverInfo.id}_${Date.now()}`;

    return c.json({ success: true, driver: driverInfo, token });
  } catch (error) {
    console.error("Driver login error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /drivers/logout
app.post("/make-server-3bd0ade8/drivers/logout", async (c) => {
  try {
    const { driverId } = await c.req.json();
    const drivers = (await kvWithRetry.get("drivers_list") as any[]) || [];
    const idx = drivers.findIndex((d: any) => d.id === driverId);

    if (idx !== -1) {
      drivers[idx] = {
        ...drivers[idx],
        status: "offline",
        lastLogoutAt: new Date().toISOString(),
      };
      await kvWithRetry.set("drivers_list", drivers);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
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

    // Decrement per-slot availability for the date
    const TIME_SLOTS_LIST = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    const storedAvail = await kvWithRetry.get(`availability_${selectedDate}`);
    let slotMap: Record<string, number>;

    if (storedAvail && typeof storedAvail === "object" &&
        TIME_SLOTS_LIST.some(s => s in (storedAvail as any))) {
      // Already a per-slot map — use it directly
      slotMap = { ...(storedAvail as Record<string, number>) };
    } else {
      // First sale of the day — initialise each slot to 50
      slotMap = {};
      TIME_SLOTS_LIST.forEach(s => { slotMap[s] = 50; });
    }

    if (timeSlot && slotMap[timeSlot] !== undefined) {
      slotMap[timeSlot] = Math.max(0, slotMap[timeSlot] - qty);
    }
    await kvWithRetry.set(`availability_${selectedDate}`, slotMap);

    // Send confirmation email to customer
    const tempPassword = `${(firstName || "guest").toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
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
Email: ${customerEmail}<br>
Password: ${tempPassword}</p>
<p>Enjoy your Sintra experience! 🏰</p>`,
          }),
        });
      } catch (emailErr) {
        console.error("Driver sale email failed:", emailErr);
      }
    }

    return c.json({
      success: true,
      booking: sale,
      customerInfo: { email: customerEmail, temporaryPassword: tempPassword },
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
    const stored = await kvWithRetry.get(`availability_${date}`);
    return c.json({
      success: true,
      availability: stored || { date, totalSeats: 100, bookedSeats: 0, availableSeats: 100 },
    });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/availability/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const body = await c.req.json();
    await kvWithRetry.set(`availability_${date}`, { ...body, date });
    return c.json({ success: true });
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

app.post("/make-server-3bd0ade8/create-payment-intent", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { amount, currency = "eur", metadata } = await c.req.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });
    return c.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-3bd0ade8/tour-bookings/create-payment-intent", async (c) => {
  if (!stripe) return c.json({ success: false, error: "Payment processing not configured" }, 503);
  try {
    const { amount, currency = "eur", metadata } = await c.req.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });
    return c.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
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

  // API keys — prefer Supabase secret, fall back to embedded key
  const OWM_KEY = Deno.env.get("OPENWEATHER_API_KEY") || "a0f8f13623406a57d14632870784a548";
  const TT_KEY  = Deno.env.get("TOMTOM_API_KEY")      || "Rngab0Ztt57iFON47bgFei5BIEBnzoze";

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
      // <17 min = clear, 17–23 min = light, 24–30 min = medium, >30 min = heavy
      const level =
        travelMinutes < 17 ? "clear"  :
        travelMinutes < 24 ? "light"  :
        travelMinutes < 31 ? "medium" : "heavy";
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
