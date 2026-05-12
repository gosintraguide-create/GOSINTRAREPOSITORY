import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";
import { generateBookingConfirmationHTML } from "./email_template.ts";
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

// Driver Management (Simplified for space, assuming standard kv getters)
app.get("/make-server-3bd0ade8/drivers", async (c) => {
  const driversData = await kv.get("drivers_list");
  return c.json({ success: true, drivers: driversData || [] });
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
    const tours = await kvWithRetry.get("private_tours");
    return c.json({ success: true, tours: tours || [] });
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
    const existing = (await kvWithRetry.get("private_tours") as any[]) || [];
    const idx = existing.findIndex((t: any) => t.id === tour.id);
    if (idx >= 0) {
      existing[idx] = tour;
    } else {
      existing.push(tour);
    }
    await kvWithRetry.set("private_tours", existing);
    return c.json({ success: true });
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
    await kvWithRetry.set("blog_articles", articles);
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

// ===== SITEMAP =====

app.get("/make-server-3bd0ade8/sitemap.xml", async (c) => {
  const BASE_URL = "https://www.hoponsintra.com";
  const today = new Date().toISOString().split("T")[0];

  // Static pages that never change
  const staticUrls = [
    { loc: `${BASE_URL}/`,               changefreq: "daily",   priority: "1.0", lastmod: today },
    { loc: `${BASE_URL}/hop-on-service`, changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/attractions`,    changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/private-tours`,  changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/blog`,           changefreq: "weekly",  priority: "0.9", lastmod: today },
    { loc: `${BASE_URL}/about`,          changefreq: "monthly", priority: "0.7", lastmod: today },
    { loc: `${BASE_URL}/route-map`,      changefreq: "monthly", priority: "0.7", lastmod: today },
  ];

  // Dynamic URLs collected from KV
  const dynamicUrls: { loc: string; changefreq: string; priority: string; lastmod: string }[] = [];

  // --- Attractions / Monuments ---
  try {
    const monuments = (await kvWithRetry.get("monuments") as any[]) || [];
    for (const m of monuments) {
      const slug = m.id || m.slug ||
        (m.name ? m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : null);
      if (slug) {
        dynamicUrls.push({
          loc: `${BASE_URL}/attractions/${slug}`,
          changefreq: "monthly",
          priority: "0.8",
          lastmod: m.updatedAt ? m.updatedAt.split("T")[0] : today,
        });
      }
    }
  } catch (_) { /* skip on error */ }

  // --- Blog articles ---
  try {
    const articles = (await kvWithRetry.get("blog_articles") as any[]) || [];
    for (const a of articles) {
      if (a.published === false || a.status === "draft") continue;
      const slug = a.slug || a.id;
      if (slug) {
        dynamicUrls.push({
          loc: `${BASE_URL}/blog/${slug}`,
          changefreq: "monthly",
          priority: "0.7",
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
