import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";
import { generateBookingConfirmationHTML } from "./email_template.tsx";

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
        // Add your custom domain here when ready
        // 'https://your-custom-domain.com',
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
// Format: AA-1234, AB-1234, AC-1234... ZZ-9999
// When AA exhausts (9,000 IDs), moves to AB, then AC, etc.
// Total capacity: 676 letter combos × 9,000 numbers = 6,084,000 IDs!

async function getNextAvailablePrefix(): Promise<string> {
  // Get current prefix from storage (defaults to "AA")
  const currentPrefixData = await kv.get(
    "booking_current_prefix",
  );
  let currentPrefix = currentPrefixData || "AA";

  // Check if current prefix still has available numbers
  for (let num = 1000; num <= 9999; num++) {
    const testId = `${currentPrefix}-${num}`;
    const exists = await kv.get(testId);
    if (!exists) {
      // Found available ID in current prefix
      return currentPrefix;
    }
  }

  // Current prefix is exhausted, move to next
  console.log(
    `📝 Prefix ${currentPrefix} exhausted, moving to next...`,
  );

  const nextPrefix = getNextPrefix(currentPrefix);

  // Save new prefix
  await kv.set("booking_current_prefix", nextPrefix);

  console.log(`✅ New prefix: ${nextPrefix}`);
  return nextPrefix;
}

function getNextPrefix(current: string): string {
  // Convert letters to numbers (A=0, B=1, ... Z=25)
  const first = current.charCodeAt(0) - 65; // First letter
  const second = current.charCodeAt(1) - 65; // Second letter

  // Increment second letter
  let newSecond = second + 1;
  let newFirst = first;

  // If second letter exceeds Z, roll over and increment first letter
  if (newSecond > 25) {
    newSecond = 0;
    newFirst = first + 1;
  }

  // If first letter exceeds Z, we need 3 letters (AAA)
  if (newFirst > 25) {
    // This means we've used all 676 two-letter combinations (6M+ bookings!)
    // Upgrade to 3-letter system: AAA-1234
    console.warn(
      "🚀 MILESTONE: Moving to 3-letter prefix system (AAA-####)",
    );
    return "AAA";
  }

  // Convert back to letters
  const newPrefix =
    String.fromCharCode(65 + newFirst) +
    String.fromCharCode(65 + newSecond);
  return newPrefix;
}

async function generateBookingId(): Promise<string> {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Get the current active prefix (e.g., "AA", "AB", "AC"...)
      const prefix = await getNextAvailablePrefix();

      // Generate random 4-digit number (1000-9999)
      const number = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `${prefix}-${number}`;

      // Check if this specific ID exists
      const existing = await kv.get(bookingId);
      if (!existing) {
        console.log(`🎫 Generated booking ID: ${bookingId}`);
        return bookingId;
      }

      // If exists, try again (rare in early prefixes)
    } catch (error) {
      console.error(
        `Error generating booking ID (attempt ${attempt + 1}):`,
        error,
      );
    }
  }

  // Fallback (extremely rare - only if something is broken)
  console.error(
    "❌ CRITICAL: Could not generate booking ID after 50 attempts",
  );
  const timestamp = Date.now().toString().slice(-6);
  return `FB-${timestamp}`; // FB = Fallback
}

// Initialize database on startup (only runs once per database)
async function initializeDatabase() {
  try {
    // Check if database has already been initialized
    const dbInitialized = await kv.get("db_initialized");

    if (dbInitialized) {
      console.log(
        "✅ Database already initialized, skipping setup",
      );
      return;
    }

    console.log("🔧 First-time database initialization...");

    // Initialize default content
    await kv.set("website_content", {
      initialized: true,
      lastUpdated: new Date().toISOString(),
    });
    console.log("✅ Default content initialized");

    // Initialize default pricing
    await kv.set("pricing_config", {
      dayPass: {
        adult: 25,
        child: 15,
        infant: 0,
      },
      guidedTour: {
        private: 150,
        small: 35,
      },
    });
    console.log("✅ Default pricing initialized");

    // Mark database as initialized
    await kv.set("db_initialized", {
      initialized: true,
      timestamp: new Date().toISOString(),
      version: "1.0",
    });

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}

// Call initialization (will only run once per database)
initializeDatabase();

// Generate QR code function
async function generateQRCode(
  bookingId: string,
  passengerIndex: number,
): Promise<string> {
  const qrData = `${bookingId}|${passengerIndex}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 300,
    margin: 2,
    color: {
      dark: "#0A4D5C",
      light: "#FFFFFF",
    },
  });
  console.log(
    `✅ Generated QR code for ${bookingId} passenger ${passengerIndex} - Length: ${qrCodeDataUrl.length}`,
  );
  return qrCodeDataUrl;
}

// Generate PDF with booking confirmation and QR codes
async function generateBookingPDF(
  booking: any,
  qrCodes: string[],
): Promise<string> {
  try {
    console.log(
      `🔧 Starting PDF generation for booking ${booking.id}`,
    );
    console.log(
      `📊 PDF will include ${qrCodes.length} QR codes`,
    );

    const pdfDoc = await PDFDocument.create();
    console.log(`✅ pdf-lib instance created successfully`);

    const formattedDate = new Date(
      booking.selectedDate,
    ).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const shortDate = new Date(
      booking.selectedDate,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const bookingIdShort =
      booking.id.split("_")[1] || booking.id;

    // Generate one full-page ticket per passenger
    for (let i = 0; i < booking.passengers.length; i++) {
      const passenger = booking.passengers[i];
      const qrCode = qrCodes[i];

      // Create a new page for this passenger
      const page = pdfDoc.addPage([595, 842]); // A4 size in points
      const { width, height } = page.getSize();

      // === BACKGROUND - Cream color ===
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 0.957, 0.929), // #FFF4ED
      });

      // === TOP HEADER - Teal gradient ===
      page.drawRectangle({
        x: 0,
        y: height - 140,
        width: width,
        height: 140,
        color: rgb(0.039, 0.302, 0.361), // #0A4D5C
      });

      // Terracotta bottom accent
      page.drawRectangle({
        x: 0,
        y: height - 145,
        width: width,
        height: 5,
        color: rgb(0.851, 0.471, 0.263), // #D97843
      });

      // Logo/Title - Large (GO SINTRA = 9 chars * 20 ≈ 180)
      page.drawText("GO SINTRA", {
        x: width / 2 - 90,
        y: height - 55,
        size: 36,
        color: rgb(1, 1, 1),
      });

      // DAY PASS = 8 chars * 11 ≈ 88
      page.drawText("DAY PASS", {
        x: width / 2 - 44,
        y: height - 85,
        size: 20,
        color: rgb(0.851, 0.471, 0.263),
      });

      // Ticket counter badge
      if (booking.passengers.length > 1) {
        const badgeText = `${i + 1} / ${booking.passengers.length}`;
        const badgeWidth = badgeText.length * 7;
        page.drawText(badgeText, {
          x: width / 2 - badgeWidth / 2,
          y: height - 115,
          size: 14,
          color: rgb(0.941, 0.914, 0.894),
        });
      }

      // === QR CODE - LARGE AND CENTERED ===
      let yPos = height - 200;

      // SCAN TO BOARD = 13 chars * 9 ≈ 117
      page.drawText("SCAN TO BOARD", {
        x: width / 2 - 58,
        y: yPos,
        size: 16,
        color: rgb(0.039, 0.302, 0.361),
      });

      yPos -= 40;

      if (qrCode) {
        try {
          const qrBase64 = qrCode.replace(/^data:image\/png;base64,/, "");
          const qrImageBytes = Uint8Array.from(atob(qrBase64), (c) =>
            c.charCodeAt(0)
          );
          const qrImage = await pdfDoc.embedPng(qrImageBytes);

          const qrSize = 220;
          const qrX = (width - qrSize) / 2;

          // White background with teal border
          page.drawRectangle({
            x: qrX - 12,
            y: yPos - qrSize - 12,
            width: qrSize + 24,
            height: qrSize + 24,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.039, 0.302, 0.361),
            borderWidth: 4,
          });

          page.drawImage(qrImage, {
            x: qrX,
            y: yPos - qrSize,
            width: qrSize,
            height: qrSize,
          });

          yPos -= qrSize + 30;

          console.log(`✅ Added QR code for passenger ${i + 1}: ${passenger.name}`);
        } catch (err) {
          console.error(`Error adding QR code for passenger ${i + 1}:`, err);
        }
      }

      // === PASSENGER NAME - LARGE ===
      // PASSENGER = 9 chars * 6 ≈ 54
      page.drawText("PASSENGER", {
        x: width / 2 - 27,
        y: yPos,
        size: 11,
        color: rgb(0.42, 0.447, 0.533),
      });

      yPos -= 25;
      const passengerName = (passenger.name || passenger.fullName || `Passenger ${i + 1}`).toUpperCase();
      const nameWidth = passengerName.length * 13; // size 22 approximation
      page.drawText(passengerName, {
        x: (width - nameWidth) / 2,
        y: yPos,
        size: 22,
        color: rgb(0.039, 0.302, 0.361),
      });

      yPos -= 50;

      // === DETAILS SECTION ===
      const leftCol = 100;
      const rightCol = width / 2 + 50;

      // Date
      page.drawText("DATE", {
        x: leftCol,
        y: yPos,
        size: 10,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(shortDate, {
        x: leftCol,
        y: yPos - 20,
        size: 14,
        color: rgb(0.039, 0.302, 0.361),
      });

      // Type
      page.drawText("TYPE", {
        x: rightCol,
        y: yPos,
        size: 10,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(passenger.type || 'Adult', {
        x: rightCol,
        y: yPos - 20,
        size: 14,
        color: rgb(0.039, 0.302, 0.361),
      });

      yPos -= 70;

      // Valid Hours
      page.drawText("VALID HOURS", {
        x: leftCol,
        y: yPos,
        size: 10,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText("9:00 AM - 8:00 PM", {
        x: leftCol,
        y: yPos - 20,
        size: 14,
        color: rgb(0.039, 0.302, 0.361),
      });

      // Booking ID
      page.drawText("BOOKING ID", {
        x: rightCol,
        y: yPos,
        size: 10,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(bookingIdShort, {
        x: rightCol,
        y: yPos - 20,
        size: 14,
        color: rgb(0.039, 0.302, 0.361),
      });

      yPos -= 70;

      // === INSTRUCTIONS ===
      // HOW TO USE = 10 chars * 6 ≈ 60
      page.drawText("HOW TO USE", {
        x: width / 2 - 30,
        y: yPos,
        size: 11,
        color: rgb(0.42, 0.447, 0.533),
      });

      yPos -= 25;

      // Line 1 = 53 chars * 6 ≈ 318
      const instruction1 = "Show QR code to driver • Unlimited rides until 8 PM";
      page.drawText(instruction1, {
        x: width / 2 - 159,
        y: yPos,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      yPos -= 20;

      // Line 2 = 53 chars * 6 ≈ 318
      const instruction2 = "Professional guides • Vehicles every 10-15 minutes";
      page.drawText(instruction2, {
        x: width / 2 - 153,
        y: yPos,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      // === BOTTOM FOOTER - Teal ===
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 100,
        color: rgb(0.039, 0.302, 0.361),
      });

      // Terracotta top accent
      page.drawRectangle({
        x: 0,
        y: 100,
        width: width,
        height: 5,
        color: rgb(0.851, 0.471, 0.263),
      });

      // GO SINTRA - size 14, ~8 per char = 72
      const footerTitle = "GO SINTRA";
      page.drawText(footerTitle, {
        x: width / 2 - (footerTitle.length * 4),
        y: 65,
        size: 14,
        color: rgb(1, 1, 1),
      });

      // Premium Hop-On/Hop-Off Service - size 10, ~5.5 per char = 170
      const footerSubtitle = "Premium Hop-On/Hop-Off Service";
      page.drawText(footerSubtitle, {
        x: width / 2 - (footerSubtitle.length * 2.75),
        y: 48,
        size: 10,
        color: rgb(0.851, 0.471, 0.263),
      });

      // Email & WhatsApp line - size 9, ~5 per char = 245
      const contactLine = "info@gosintra.com  |  WhatsApp: +351 932 967 279";
      page.drawText(contactLine, {
        x: width / 2 - (contactLine.length * 2.5),
        y: 30,
        size: 9,
        color: rgb(1, 1, 1),
      });

      // Operating hours line - size 8, ~4.5 per char = 252
      const hoursLine = "Operating Daily: 9:00 AM - 8:00 PM  |  Sintra, Portugal";
      page.drawText(hoursLine, {
        x: width / 2 - (hoursLine.length * 2.25),
        y: 15,
        size: 8,
        color: rgb(0.941, 0.914, 0.894),
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));

    console.log(
      `✅ Generated PDF with ${booking.passengers.length} tickets - Size: ${base64.length} bytes`,
    );
    console.log(
      `📄 PDF base64 preview (first 100 chars): ${base64.substring(0, 100)}`,
    );

    return base64;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// Send booking confirmation email with QR codes
async function sendBookingEmail(
  booking: any,
  qrCodes: string[],
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.log(
      "RESEND_API_KEY not configured, skipping email send",
    );
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const formattedDate = new Date(
      booking.selectedDate,
    ).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Verify all passengers have QR codes
    const passengersWithQR = booking.passengers.map(
      (p: any, i: number) => ({
        ...p,
        qrCode: qrCodes[i],
      }),
    );

    console.log(
      `✅ Email payload includes ${passengersWithQR.length} passengers with QR codes:`,
      passengersWithQR.map((p: any, i: number) => ({
        name: p.name || p.fullName || `Passenger ${i + 1}`,
        type: p.type || 'Adult',
        hasQRCode: !!p.qrCode,
        qrCodeLength: p.qrCode?.length || 0,
      })),
    );

    // Build HTML email
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
    
    if (!recipientEmail) {
      console.error('❌ No email address found in booking');
      return {
        success: false,
        error: 'No email address provided',
      };
    }
    
    console.log(
      `📧 Preparing email with ${qrCodes.length} QR codes for ${recipientEmail}`,
    );
    console.log(
      `QR Code sample (first 100 chars): ${qrCodes[0]?.substring(0, 100)}...`,
    );

    // Generate PDF with tickets
    let pdfBase64;
    try {
      console.log(
        `🔄 Attempting to generate PDF for booking ${booking.id}...`,
      );
      pdfBase64 = await generateBookingPDF(booking, qrCodes);

      if (!pdfBase64 || pdfBase64.length === 0) {
        throw new Error("PDF generation returned empty result");
      }

      console.log(
        `✅ PDF generated successfully for booking ${booking.id}`,
      );
      console.log(
        `📊 PDF size: ${pdfBase64.length} characters (base64)`,
      );
      console.log(
        `📊 PDF size in bytes: ${Math.round(pdfBase64.length * 0.75)} bytes (estimated)`,
      );
      console.log(
        `📄 PDF preview (first 50 chars): ${pdfBase64.substring(0, 50)}...`,
      );
    } catch (pdfError) {
      console.error("❌ PDF generation failed:", pdfError);
      console.error(
        "PDF error name:",
        pdfError instanceof Error ? pdfError.name : "Unknown",
      );
      console.error(
        "PDF error message:",
        pdfError instanceof Error
          ? pdfError.message
          : String(pdfError),
      );
      console.error(
        "PDF error stack:",
        pdfError instanceof Error
          ? pdfError.stack
          : "No stack trace",
      );
      pdfBase64 = undefined; // Explicitly set to undefined
      // Continue with email even if PDF fails
    }

    const bookingIdShort =
      booking.id.split("_")[1] || booking.id;

    // Send email via Resend with PDF attachment
    // NOTE: Using onboarding@resend.dev for free tier (no domain verification needed)
    // To use your own domain (e.g., bookings@gosintra.com), verify it at https://resend.com/domains
    const emailPayload: any = {
      from: "Go Sintra <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `🎉 Your Go Sintra Booking Confirmed - ${formattedDate}`,
      html: htmlContent,
    };

    // Add PDF attachment if generated successfully
    if (pdfBase64) {
      emailPayload.attachments = [
        {
          filename: `GoSintra_Tickets_${bookingIdShort}.pdf`,
          content: pdfBase64,
        },
      ];
      console.log(`📎 PDF attachment added to email payload`);
      console.log(
        `📎 Attachment filename: GoSintra_Tickets_${bookingIdShort}.pdf`,
      );
      console.log(
        `📎 Attachment size: ${pdfBase64.length} characters (base64)`,
      );
      console.log(
        `📧 Email payload with attachment ready - Total attachments: 1`,
      );
    } else {
      console.warn(
        `⚠️  No PDF attachment - PDF generation failed or returned empty`,
      );
      console.warn(
        `⚠️  Email will be sent WITHOUT PDF attachment`,
      );
    }

    console.log(
      `📤 Sending email to ${recipientEmail}...`,
    );
    console.log(
      `📤 Email has ${emailPayload.attachments ? emailPayload.attachments.length : 0} attachment(s)`,
    );

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);

      // Check if it's the testing-only limitation
      if (
        result.message &&
        result.message.includes("only send testing emails")
      ) {
        console.error("⚠️  DOMAIN VERIFICATION REQUIRED");
        console.error(
          "Current setup only allows test emails to:",
          result.message.match(/\(([^)]+)\)/)?.[1],
        );
        console.error(
          "To send to customers, verify your domain at: https://resend.com/domains",
        );
        return {
          success: false,
          error:
            "Domain verification required. See server logs for details.",
          requiresDomainVerification: true,
        };
      }

      return {
        success: false,
        error: result.message || "Failed to send email",
      };
    }

    console.log("Email sent successfully:", result);
    console.log(
      `📧 Booking confirmation email sent to ${recipientEmail} from onboarding@resend.dev`,
    );
    if (pdfBase64) {
      console.log(
        `✅ Email included PDF attachment: GoSintra_Tickets_${bookingIdShort}.pdf`,
      );
    } else {
      console.log(
        `⚠️  Email sent WITHOUT PDF attachment (PDF generation failed)`,
      );
    }
    return {
      success: true,
      emailId: result.id,
      pdfAttached: !!pdfBase64,
    };
  } catch (error) {
    console.error("Error sending booking email:", error);
    return { success: false, error: String(error) };
  }
}

// Email template is now in ./email_template.tsx

// Health check
app.get("/make-server-3bd0ade8/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Simple database check - test if we can query the table
app.get("/make-server-3bd0ade8/db-check", async (c) => {
  try {
    console.log("🔍 Testing database connection...");

    // Try to count rows
    const { count, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Database check failed:", error);
      return c.json(
        {
          success: false,
          error: error.message,
          hint: "The kv_store_3bd0ade8 table may not exist or you don't have permission to access it",
          supabaseUrl: Deno.env.get("SUPABASE_URL"),
          hasServiceRole: !!Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY",
          ),
        },
        500,
      );
    }

    console.log(
      `✅ Database check passed: ${count} rows found`,
    );

    return c.json({
      success: true,
      message: "Database connection successful",
      rowCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Database check error:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      500,
    );
  }
});

// Database diagnostics - check for duplicate keys
app.get("/make-server-3bd0ade8/db-diagnostics", async (c) => {
  try {
    console.log("🔍 Running database diagnostics...");

    // Query all rows directly from Supabase to check for duplicates
    const { data, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("key")
      .order("key");

    if (error) {
      console.error("Database query error:", error);
      return c.json(
        {
          success: false,
          error: `Database query failed: ${error.message}`,
          details: error,
          hint: "Make sure the kv_store_3bd0ade8 table exists in your Supabase database",
        },
        500,
      );
    }

    // Count occurrences of each key
    const keyCount: Record<string, number> = {};
    const duplicates: string[] = [];

    if (data) {
      data.forEach((row: any) => {
        const key = row.key;
        keyCount[key] = (keyCount[key] || 0) + 1;
        if (keyCount[key] === 2) {
          duplicates.push(key);
        }
      });
    }

    const totalKeys = Object.keys(keyCount).length;
    const totalRows = data?.length || 0;
    const hasDuplicates = duplicates.length > 0;

    console.log(
      `✅ Database diagnostics complete: ${totalKeys} unique keys, ${totalRows} total rows`,
    );

    if (hasDuplicates) {
      console.warn(
        `⚠️ Found ${duplicates.length} duplicate keys:`,
        duplicates,
      );
    }

    return c.json({
      success: true,
      diagnostics: {
        totalKeys,
        totalRows,
        hasDuplicates,
        duplicates: hasDuplicates ? duplicates : [],
        keyCount: hasDuplicates
          ? Object.fromEntries(
              Object.entries(keyCount).filter(
                ([_, count]) => count > 1,
              ),
            )
          : {},
        note: "The 'duplicate' warning in Supabase is normal - it means upsert is updating existing keys rather than inserting duplicates. This is the expected behavior.",
        explanation: {
          whatIsUpsert:
            "Upsert = UPDATE if key exists, INSERT if it doesn't",
          whyWarning:
            "Supabase logs 'duplicate' when it updates instead of inserts",
          isThisBad:
            "No! This is the correct and expected behavior for a key-value store",
          whenToWorry:
            "Only if you see actual duplicate rows (totalRows > totalKeys)",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error running diagnostics:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Diagnostics failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      500,
    );
  }
});

// Clean up any actual duplicate rows (if they somehow exist)
app.post("/make-server-3bd0ade8/db-cleanup", async (c) => {
  try {
    console.log("🧹 Starting database cleanup...");

    // Get all rows with their created_at or similar timestamp
    const { data, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("key, value")
      .order("key");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return c.json({
        success: true,
        message: "Database is empty, nothing to clean",
      });
    }

    // Group by key and keep only the latest value for each
    const uniqueData: Record<string, any> = {};
    data.forEach((row: any) => {
      uniqueData[row.key] = row.value;
    });

    // Delete all rows
    const { error: deleteError } = await supabase
      .from("kv_store_3bd0ade8")
      .delete()
      .neq("key", "__never_matches__"); // Delete all rows

    if (deleteError) {
      throw deleteError;
    }

    console.log(
      `🗑️ Deleted all rows, re-inserting ${Object.keys(uniqueData).length} unique records...`,
    );

    // Re-insert unique records using kv.set (which uses upsert)
    let insertCount = 0;
    for (const [key, value] of Object.entries(uniqueData)) {
      await kv.set(key, value);
      insertCount++;
    }

    console.log(
      `✅ Database cleanup complete: ${insertCount} records restored`,
    );

    return c.json({
      success: true,
      message: "Database cleaned successfully",
      recordsRestored: insertCount,
      note: "All duplicate rows removed, unique records preserved",
    });
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Cleanup failed",
      },
      500,
    );
  }
});

// Get website content
app.get("/make-server-3bd0ade8/content", async (c) => {
  try {
    console.log("📖 Fetching content from database...");
    const content = await kv.get("website_content");

    if (content) {
      console.log("✅ Content found in database");
      console.log("Content keys:", Object.keys(content));
    } else {
      console.log("ℹ️ No content found in database");
    }

    return c.json({ success: true, content });
  } catch (error) {
    console.error("❌ Error fetching content:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    return c.json(
      { success: false, error: "Failed to fetch content" },
      500,
    );
  }
});

// Save website content
app.post("/make-server-3bd0ade8/content", async (c) => {
  try {
    const body = await c.req.json();
    console.log("📝 Saving content to database...");
    console.log("Content keys:", Object.keys(body));

    const contentToSave = {
      ...body,
      lastUpdated: new Date().toISOString(),
    };

    await kv.set("website_content", contentToSave);
    console.log("✅ Content saved successfully to database");

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving content:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save content",
      },
      500,
    );
  }
});

// Get comprehensive website content
app.get(
  "/make-server-3bd0ade8/comprehensive-content",
  async (c) => {
    try {
      console.log(
        "📖 Fetching comprehensive content from database...",
      );
      const content = await kv.get("comprehensive_content");

      if (content) {
        console.log(
          "✅ Comprehensive content found in database",
        );
        console.log(
          "Comprehensive content keys:",
          Object.keys(content),
        );
      } else {
        console.log(
          "ℹ️ No comprehensive content found in database",
        );
      }

      return c.json({ success: true, content });
    } catch (error) {
      console.error(
        "❌ Error fetching comprehensive content:",
        error,
      );
      console.error(
        "Error details:",
        error instanceof Error ? error.message : String(error),
      );
      return c.json(
        {
          success: false,
          error: "Failed to fetch comprehensive content",
        },
        500,
      );
    }
  },
);

// Save comprehensive website content
app.post(
  "/make-server-3bd0ade8/comprehensive-content",
  async (c) => {
    try {
      const body = await c.req.json();
      console.log(
        "📝 Saving comprehensive content to database...",
      );
      console.log(
        "Comprehensive content keys:",
        Object.keys(body),
      );

      const contentToSave = {
        ...body,
        lastUpdated: new Date().toISOString(),
      };

      await kv.set("comprehensive_content", contentToSave);
      console.log(
        "✅ Comprehensive content saved successfully to database",
      );

      return c.json({ success: true });
    } catch (error) {
      console.error(
        "❌ Error saving comprehensive content:",
        error,
      );
      console.error(
        "Error details:",
        error instanceof Error ? error.message : String(error),
      );
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to save comprehensive content",
        },
        500,
      );
    }
  },
);

// Get pricing configuration
app.get("/make-server-3bd0ade8/pricing", async (c) => {
  try {
    console.log("💰 Fetching pricing from database...");
    const pricing = await kv.get("pricing_config");

    if (pricing) {
      console.log("✅ Pricing found in database");
    } else {
      console.log(
        "ℹ️ No pricing found in database, will use defaults",
      );
    }

    return c.json({ success: true, pricing });
  } catch (error) {
    console.error("❌ Error fetching pricing:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    return c.json(
      { success: false, error: "Failed to fetch pricing" },
      500,
    );
  }
});

// Save pricing configuration
app.post("/make-server-3bd0ade8/pricing", async (c) => {
  try {
    const body = await c.req.json();
    console.log("💰 Saving pricing to database...");
    console.log("Pricing data:", JSON.stringify(body, null, 2));

    await kv.set("pricing_config", body);
    console.log("✅ Pricing saved successfully to database");

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving pricing:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save pricing",
      },
      500,
    );
  }
});

// Get availability for a specific date
app.get(
  "/make-server-3bd0ade8/availability/:date",
  async (c) => {
    try {
      const date = c.req.param("date");
      const availability = await kv.get(`availability_${date}`);

      // Return default availability if none set (50 seats per time slot)
      if (!availability) {
        const defaultSlots: any = {};
        const timeSlots = [
          "9:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
        ];
        timeSlots.forEach((slot) => {
          defaultSlots[slot] = 50;
        });

        return c.json({
          success: true,
          availability: defaultSlots,
        });
      }

      return c.json({ success: true, availability });
    } catch (error) {
      console.error("Error fetching availability:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch availability",
        },
        500,
      );
    }
  },
);

// Set availability for a specific date
app.post(
  "/make-server-3bd0ade8/availability/:date",
  async (c) => {
    try {
      const date = c.req.param("date");
      const body = await c.req.json();
      console.log(`💾 Saving availability for ${date}:`, body);
      await kv.set(`availability_${date}`, body);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error saving availability:", error);
      return c.json(
        {
          success: false,
          error: "Failed to save availability",
        },
        500,
      );
    }
  },
);

// Get all availability (for admin)
app.get("/make-server-3bd0ade8/availability", async (c) => {
  try {
    // Query database directly to get both keys and values
    const { data, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("key, value")
      .like("key", "availability_%");

    if (error) {
      throw error;
    }

    const availability: any = {};

    if (data) {
      data.forEach((entry: any) => {
        if (
          entry &&
          entry.key &&
          typeof entry.key === "string"
        ) {
          const date = entry.key.replace("availability_", "");
          availability[date] = entry.value;
        }
      });
    }

    console.log(
      `📊 Retrieved availability for ${Object.keys(availability).length} dates`,
    );
    return c.json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching all availability:", error);
    return c.json(
      { success: false, error: "Failed to fetch availability" },
      500,
    );
  }
});

// Get Stripe Publishable Key
app.get("/make-server-3bd0ade8/stripe-config", async (c) => {
  try {
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    
    if (!publishableKey) {
      console.error("Stripe publishable key not configured");
      return c.json(
        {
          success: false,
          error: "Payment configuration not available",
        },
        500,
      );
    }

    return c.json({
      success: true,
      publishableKey,
    });
  } catch (error) {
    console.error("Error fetching Stripe config:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get payment configuration",
      },
      500,
    );
  }
});

// Create Stripe Payment Intent
app.post(
  "/make-server-3bd0ade8/create-payment-intent",
  async (c) => {
    try {
      if (!stripe) {
        console.error(
          "Stripe not initialized - STRIPE_SECRET_KEY not configured",
        );
        return c.json(
          {
            success: false,
            error:
              "Payment processing not configured. Please contact support.",
          },
          500,
        );
      }

      const body = await c.req.json();
      const { amount, currency = "eur", metadata = {} } = body;

      if (!amount || amount <= 0) {
        return c.json(
          {
            success: false,
            error: "Invalid amount",
          },
          400,
        );
      }

      console.log(
        `💳 Creating Stripe Payment Intent for €${amount}`,
      );

      // Create a PaymentIntent with the order amount and currency
      // Supports card, Apple Pay, Google Pay, and other payment methods
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Improves UX for wallets
        },
        metadata: {
          ...metadata,
          service: "Go Sintra Day Pass",
        },
      });

      console.log(
        `✅ Payment Intent created: ${paymentIntent.id}`,
      );

      return c.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to create payment intent",
        },
        500,
      );
    }
  },
);

// Verify Payment Intent
app.post("/make-server-3bd0ade8/verify-payment", async (c) => {
  try {
    if (!stripe) {
      return c.json(
        {
          success: false,
          error: "Payment processing not configured",
        },
        500,
      );
    }

    const body = await c.req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return c.json(
        {
          success: false,
          error: "Payment Intent ID required",
        },
        400,
      );
    }

    console.log(
      `🔍 Verifying payment intent: ${paymentIntentId}`,
    );

    const paymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      console.log(
        `✅ Payment verified successfully: ${paymentIntentId}`,
      );
      return c.json({
        success: true,
        verified: true,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      });
    } else {
      console.log(
        `⚠️  Payment not completed: ${paymentIntent.status}`,
      );
      return c.json(
        {
          success: false,
          verified: false,
          status: paymentIntent.status,
          error: "Payment not completed",
        },
        400,
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify payment",
      },
      500,
    );
  }
});

// Get all bookings (admin)
app.get("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    // Get all bookings (handles all formats)
    const oldBookings = await kv.getByPrefix("booking_"); // Very old format
    const gsBookings = await kv.getByPrefix("GS-"); // Old GS-#### format

    // Get new AA-#### format bookings (only active prefixes for efficiency)
    const letterBookings = [];
    const usedPrefixes =
      (await kv.get("booking_used_prefixes")) || [];

    // If no used prefixes tracked yet, check common ones
    if (usedPrefixes.length === 0) {
      // Check first few prefixes that likely have bookings
      const commonPrefixes = ["AA", "AB", "AC", "AD", "AE"];
      for (const prefix of commonPrefixes) {
        const prefixBookings = await kv.getByPrefix(
          `${prefix}-`,
        );
        if (prefixBookings.length > 0) {
          letterBookings.push(...prefixBookings);
        }
      }
    } else {
      // Query only prefixes we know have bookings
      for (const prefix of usedPrefixes) {
        const prefixBookings = await kv.getByPrefix(
          `${prefix}-`,
        );
        letterBookings.push(...prefixBookings);
      }
    }

    const allBookings = [
      ...oldBookings,
      ...gsBookings,
      ...letterBookings,
    ];

    // Filter out any null or invalid bookings
    // Note: getByPrefix already returns values directly, not {key, value} objects
    const validBookings = allBookings
      .filter(
        (booking) =>
          booking && booking.id && booking.selectedDate,
      );

    console.log(
      `📊 Retrieved ${validBookings.length} valid bookings`,
    );

    return c.json({
      success: true,
      bookings: validBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json(
      { success: false, error: "Failed to fetch bookings" },
      500,
    );
  }
});

// Get booking by ID and email (customer portal login)
app.post("/make-server-3bd0ade8/bookings/lookup", async (c) => {
  try {
    const body = await c.req.json();
    const { bookingId, email } = body;

    if (!bookingId || !email) {
      return c.json(
        {
          success: false,
          error: "Booking ID and email are required",
        },
        400,
      );
    }

    console.log(
      `🔍 Looking up booking: ${bookingId} for ${email}`,
    );

    // Try to get booking directly (handles AA-####, AB-####, etc.)
    let booking = await kv.get(bookingId);

    // Backwards compatibility: try old formats
    if (!booking) {
      // Try GS-#### format (old system)
      if (!bookingId.includes("-")) {
        booking = await kv.get(`GS-${bookingId}`);
      }

      // Try booking_* format (very old system)
      if (!booking) {
        booking = await kv.get(`booking_${bookingId}`);
      }
    }

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return c.json(
        {
          success: false,
          error:
            "Booking not found. Please check your booking ID.",
        },
        404,
      );
    }

    // Verify email matches (case insensitive)
    const bookingEmail =
      booking.contactInfo?.email?.toLowerCase();
    const inputEmail = email.toLowerCase().trim();

    if (bookingEmail !== inputEmail) {
      console.log(`❌ Email mismatch for booking ${bookingId}`);
      return c.json(
        {
          success: false,
          error:
            "Email does not match our records. Please check and try again.",
        },
        401,
      );
    }

    console.log(`✅ Booking found and verified: ${bookingId}`);

    // Return booking data (without sensitive info)
    return c.json({
      success: true,
      booking: {
        ...booking,
        // Don't send payment intent ID to customer
        paymentIntentId: undefined,
      },
    });
  } catch (error) {
    console.error("Error looking up booking:", error);
    return c.json(
      {
        success: false,
        error: "Failed to look up booking",
      },
      500,
    );
  }
});

// Get booking by ID only (for sunset special verification)
app.get("/make-server-3bd0ade8/bookings/:bookingId", async (c) => {
  try {
    const bookingId = c.req.param("bookingId");

    if (!bookingId) {
      return c.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        400,
      );
    }

    console.log(
      `🔍 Verifying booking exists: ${bookingId}`,
    );

    // Try to get booking directly (handles AA-####, AB-####, etc.)
    let booking = await kv.get(bookingId);

    // Backwards compatibility: try old formats
    if (!booking) {
      // Try GS-#### format (old system)
      if (!bookingId.includes("-")) {
        booking = await kv.get(`GS-${bookingId}`);
      }

      // Try booking_* format (very old system)
      if (!booking) {
        booking = await kv.get(`booking_${bookingId}`);
      }
    }

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return c.json(
        {
          success: false,
          error: "Booking not found",
        },
        404,
      );
    }

    console.log(`✅ Booking verified: ${bookingId}`);

    // Return minimal booking data (just confirmation that it exists)
    return c.json({
      success: true,
      booking: {
        id: booking.id,
        selectedDate: booking.selectedDate,
        exists: true,
      },
    });
  } catch (error) {
    console.error("Error verifying booking:", error);
    return c.json(
      {
        success: false,
        error: "Failed to verify booking",
      },
      500,
    );
  }
});

// Get full booking details (for sunset special purchase page)
app.get("/make-server-3bd0ade8/bookings/:bookingId/full", async (c) => {
  try {
    const bookingId = c.req.param("bookingId");

    if (!bookingId) {
      return c.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        400,
      );
    }

    console.log(
      `🔍 Fetching full booking details: ${bookingId}`,
    );

    // Try to get booking directly (handles AA-####, AB-####, etc.)
    let booking = await kv.get(bookingId);

    // Backwards compatibility: try old formats
    if (!booking) {
      // Try GS-#### format (old system)
      if (!bookingId.includes("-")) {
        booking = await kv.get(`GS-${bookingId}`);
      }

      // Try booking_* format (very old system)
      if (!booking) {
        booking = await kv.get(`booking_${bookingId}`);
      }
    }

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return c.json(
        {
          success: false,
          error: "Booking not found",
        },
        404,
      );
    }

    console.log(`✅ Full booking data retrieved: ${bookingId}`);

    // Return full booking data (excluding sensitive payment info)
    return c.json({
      success: true,
      booking: {
        ...booking,
        paymentIntentId: undefined, // Don't expose payment intent
      },
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch booking",
      },
      500,
    );
  }
});

// Create a new booking
app.post("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIntentId, isTestBooking, skipEmail } = body;

    // Verify payment if Stripe is configured (skip for test bookings)
    if (stripe && paymentIntentId && !isTestBooking) {
      console.log(
        `🔐 Verifying payment before creating booking: ${paymentIntentId}`,
      );

      try {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
          console.error(
            `❌ Payment not successful: ${paymentIntent.status}`,
          );
          return c.json(
            {
              success: false,
              error:
                "Payment verification failed. Please try again.",
            },
            400,
          );
        }

        console.log(
          `✅ Payment verified: €${paymentIntent.amount / 100}`,
        );
      } catch (error) {
        console.error("Payment verification error:", error);
        return c.json(
          {
            success: false,
            error: "Payment verification failed",
          },
          400,
        );
      }
    } else if (isTestBooking) {
      console.log(
        `🧪 Creating test booking - skipping payment verification`,
      );
    }

    // Generate unique booking ID (format: AA-1234, AB-1234, etc.)
    const bookingId = await generateBookingId();

    // Check availability for the selected time slot
    const date = body.selectedDate;
    const timeSlot = body.timeSlot;
    const totalPassengers = body.passengers.length;

    // Get current availability for this date
    const currentAvailability = await kv.get(
      `availability_${date}`,
    );

    // If no availability set, use defaults (50 per slot)
    const availabilitySlots = currentAvailability || {
      "9:00": 50,
      "10:00": 50,
      "11:00": 50,
      "12:00": 50,
      "13:00": 50,
      "14:00": 50,
      "15:00": 50,
      "16:00": 50,
    };

    // Check if enough seats available
    const availableSeats = availabilitySlots[timeSlot] ?? 50;
    if (availableSeats < totalPassengers) {
      console.log(
        `❌ Not enough seats: Requested ${totalPassengers}, Available ${availableSeats}`,
      );
      return c.json(
        {
          success: false,
          error: `Not enough seats available. Only ${availableSeats} seats left for this time slot.`,
        },
        400,
      );
    }

    // Generate QR codes for all passengers
    const qrCodes: string[] = [];
    for (let i = 0; i < body.passengers.length; i++) {
      const qrCode = await generateQRCode(bookingId, i);
      qrCodes.push(qrCode);
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

    console.log(
      `💾 Saving booking ${bookingId} with ${qrCodes.length} QR codes`,
    );
    console.log(`📊 Booking data summary:`, {
      id: booking.id,
      passengers: booking.passengers.length,
      qrCodesCount: booking.qrCodes.length,
      hasQRCodes: booking.qrCodes.every((qr: string) =>
        qr.startsWith("data:image"),
      ),
    });

    await kv.set(bookingId, booking);

    // Track this prefix as used (for efficient admin queries)
    const prefix = bookingId.split("-")[0];
    if (
      prefix &&
      prefix.length === 2 &&
      /^[A-Z]{2}$/.test(prefix)
    ) {
      const usedPrefixes =
        (await kv.get("booking_used_prefixes")) || [];
      if (!usedPrefixes.includes(prefix)) {
        usedPrefixes.push(prefix);
        await kv.set("booking_used_prefixes", usedPrefixes);
        console.log(`📝 Tracking new prefix: ${prefix}`);
      }
    }

    // Update availability - decrement seats for the specific time slot
    availabilitySlots[timeSlot] =
      availableSeats - totalPassengers;
    await kv.set(`availability_${date}`, availabilitySlots);
    console.log(
      `✅ Updated availability for ${date} at ${timeSlot}: ${availableSeats} -> ${availabilitySlots[timeSlot]}`,
    );

    // Send confirmation email with QR codes (unless skipEmail is true)
    let emailResult = { success: true, skipped: false };
    
    if (skipEmail) {
      console.log('📧 Skipping email send (skipEmail flag set)');
      emailResult = { success: true, skipped: true };
    } else {
      emailResult = await sendBookingEmail(
        booking,
        qrCodes,
      );

      if (!emailResult.success) {
        console.error(
          "Failed to send email, but booking was created:",
          emailResult.error,
        );
      }
    }

    return c.json({
      success: true,
      booking,
      emailSent: emailResult.success && !emailResult.skipped,
      emailSkipped: emailResult.skipped,
      emailError: emailResult.success ? undefined : emailResult.error,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return c.json(
      { success: false, error: "Failed to create booking" },
      500,
    );
  }
});

// Get booking by ID
app.get("/make-server-3bd0ade8/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const booking = await kv.get(id);

    if (!booking) {
      return c.json(
        { success: false, error: "Booking not found" },
        404,
      );
    }

    return c.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return c.json(
      { success: false, error: "Failed to fetch booking" },
      500,
    );
  }
});

// Verify QR code
app.post("/make-server-3bd0ade8/verify-qr", async (c) => {
  try {
    const { qrData } = await c.req.json();

    // QR codes are in format: booking_id|passenger_index
    const [bookingId, passengerIndexStr] = qrData.split("|");
    const passengerIndex = parseInt(passengerIndexStr);

    if (!bookingId) {
      return c.json({
        success: false,
        message: "Invalid QR code format",
      });
    }

    const booking = await kv.get(bookingId);

    if (!booking) {
      return c.json({
        success: false,
        message: "Booking not found - Invalid QR code",
      });
    }

    // Check if booking date is today
    const bookingDate = new Date(booking.selectedDate);
    const today = new Date();
    bookingDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const isExpired = bookingDate < today;

    // Check if already checked in today
    const checkInKey = `checkin_${bookingId}_${passengerIndex}_${booking.selectedDate}`;
    const existingCheckIn = await kv.get(checkInKey);
    const alreadyCheckedIn = !!existingCheckIn;

    // Get all check-ins for this passenger
    const checkInsKey = `checkins_${bookingId}_${passengerIndex}`;
    const checkIns = (await kv.get(checkInsKey)) || [];

    const passenger = booking.passengers[passengerIndex];

    return c.json({
      success: true,
      booking: {
        bookingId: booking.id,
        customerName: booking.contactInfo.name,
        customerEmail: booking.contactInfo.email,
        passType: `${booking.passengers.length} Day ${booking.passengers.length === 1 ? "Pass" : "Passes"}`,
        numPasses: booking.passengers.length,
        passDate: booking.selectedDate,
        totalPrice: booking.totalPrice,
        guidedTour: booking.guidedTour || false,
        passengerName: passenger?.name || "Unknown",
        passengerType: passenger?.type || "adult",
        passengerIndex,
        checkIns: checkIns,
        alreadyCheckedIn,
        isExpired,
      },
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return c.json(
      { success: false, message: "Failed to verify QR code" },
      500,
    );
  }
});

// Add sunset special to existing booking
app.post("/make-server-3bd0ade8/bookings/:bookingId/add-sunset-special", async (c) => {
  try {
    const bookingId = c.req.param("bookingId");
    const body = await c.req.json();
    const { paymentIntentId, sunsetSpecialPrice, participants } = body;

    console.log(
      `🌅 Adding sunset special to booking ${bookingId}`,
    );

    // Verify payment if Stripe is configured
    if (stripe && paymentIntentId) {
      console.log(
        `🔐 Verifying payment for sunset special: ${paymentIntentId}`,
      );

      try {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
          console.error(
            `❌ Payment not successful: ${paymentIntent.status}`,
          );
          return c.json(
            {
              success: false,
              error:
                "Payment verification failed. Please try again.",
            },
            400,
          );
        }

        console.log(
          `✅ Payment verified: €${paymentIntent.amount / 100}`,
        );
      } catch (error) {
        console.error("Payment verification error:", error);
        return c.json(
          {
            success: false,
            error: "Payment verification failed",
          },
          400,
        );
      }
    }

    // Get the existing booking
    let booking = await kv.get(bookingId);

    // Backwards compatibility: try old formats
    if (!booking) {
      // Try GS-#### format (old system)
      if (!bookingId.includes("-")) {
        booking = await kv.get(`GS-${bookingId}`);
      }

      // Try booking_* format (very old system)
      if (!booking) {
        booking = await kv.get(`booking_${bookingId}`);
      }
    }

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return c.json(
        {
          success: false,
          error: "Booking not found",
        },
        404,
      );
    }

    // Update booking with sunset special
    booking.sunsetSpecial = {
      added: true,
      addedAt: new Date().toISOString(),
      price: sunsetSpecialPrice,
      participants: participants,
      paymentIntentId: paymentIntentId,
    };

    // Update total price
    booking.totalPrice = (booking.totalPrice || 0) + sunsetSpecialPrice;

    // Save updated booking
    await kv.set(booking.id, booking);

    console.log(
      `✅ Sunset special added to booking ${booking.id}`,
    );

    // TODO: Send confirmation email about the sunset special add-on
    // For now, we'll just return success

    return c.json({
      success: true,
      booking: {
        ...booking,
        paymentIntentId: undefined, // Don't expose payment intent
      },
      message: "Sunset special added successfully",
    });
  } catch (error) {
    console.error("Error adding sunset special:", error);
    return c.json(
      {
        success: false,
        error: "Failed to add sunset special to booking",
      },
      500,
    );
  }
});

// Check in passenger
app.post("/make-server-3bd0ade8/checkin", async (c) => {
  try {
    const { bookingId, passengerIndex, location, destination } =
      await c.req.json();

    const booking = await kv.get(bookingId);

    if (!booking) {
      return c.json(
        {
          success: false,
          message: "Booking not found",
        },
        404,
      );
    }

    // Create check-in record for today
    const checkInKey = `checkin_${bookingId}_${passengerIndex || 0}_${booking.selectedDate}`;
    const checkInRecord = {
      bookingId,
      passengerIndex: passengerIndex || 0,
      timestamp: new Date().toISOString(),
      location: location || "Vehicle Pickup",
      destination: destination || "Unknown",
      date: booking.selectedDate,
    };

    await kv.set(checkInKey, checkInRecord);

    // Add to check-ins history
    const checkInsKey = `checkins_${bookingId}_${passengerIndex || 0}`;
    const checkIns = (await kv.get(checkInsKey)) || [];
    checkIns.push(checkInRecord);
    await kv.set(checkInsKey, checkIns);

    // Track destination count for today
    const today = new Date().toISOString().split('T')[0];
    const destKey = `destination_${today}_${destination}`;
    const destCount = (await kv.get(destKey)) || 0;
    await kv.set(destKey, destCount + 1);

    // Add to destination log
    const destLogKey = `destination_log_${today}`;
    const destLog = (await kv.get(destLogKey)) || [];
    destLog.push({
      destination,
      timestamp: new Date().toISOString(),
      bookingId,
      passengerIndex: passengerIndex || 0,
      customerName: booking.contactInfo.name
    });
    await kv.set(destLogKey, destLog);

    console.log(
      `✅ Passenger checked in: ${booking.contactInfo.name} - ${checkInRecord.timestamp} - ${destination}`,
    );

    return c.json({
      success: true,
      checkIn: checkInRecord,
      message: "Passenger checked in successfully",
    });
  } catch (error) {
    console.error("Error checking in passenger:", error);
    return c.json(
      {
        success: false,
        message: "Failed to check in passenger",
      },
      500,
    );
  }
});

// Get check-ins for a specific passenger
app.get(
  "/make-server-3bd0ade8/checkins/:bookingId/:passengerIndex",
  async (c) => {
    try {
      const bookingId = c.req.param("bookingId");
      const passengerIndex = c.req.param("passengerIndex");

      const checkInsKey = `checkins_${bookingId}_${passengerIndex}`;
      const checkIns = (await kv.get(checkInsKey)) || [];

      return c.json({
        success: true,
        checkIns: checkIns,
      });
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch check-ins",
        },
        500,
      );
    }
  },
);

// Get destination statistics for today
app.get("/make-server-3bd0ade8/destinations/stats", async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const includeDetails = c.req.query('details') === 'true';
    
    // List of common destinations
    const destinations = [
      "Palácio da Pena",
      "Castelo dos Mouros",
      "Palácio Nacional de Sintra",
      "Quinta da Regaleira",
      "Palácio de Monserrate",
      "Cabo da Roca",
      "Centro Histórico",
      "Other"
    ];

    const stats = [];
    
    if (includeDetails) {
      // Get detailed passenger information per destination
      const destLogKey = `destination_log_${today}`;
      const destLog = (await kv.get(destLogKey)) || [];
      
      // Group by destination
      const grouped: Record<string, any[]> = {};
      for (const entry of destLog) {
        if (!grouped[entry.destination]) {
          grouped[entry.destination] = [];
        }
        grouped[entry.destination].push({
          customerName: entry.customerName,
          bookingId: entry.bookingId,
          passengerIndex: entry.passengerIndex,
          timestamp: entry.timestamp,
        });
      }
      
      // Build stats with passenger details
      for (const dest of destinations) {
        const passengers = grouped[dest] || [];
        if (passengers.length > 0) {
          stats.push({ 
            destination: dest, 
            count: passengers.length,
            passengers: passengers.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          });
        }
      }
    } else {
      // Just counts (faster)
      for (const dest of destinations) {
        const destKey = `destination_${today}_${dest}`;
        const count = (await kv.get(destKey)) || 0;
        if (count > 0) {
          stats.push({ destination: dest, count });
        }
      }
    }

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    return c.json({
      success: true,
      date: today,
      stats,
    });
  } catch (error) {
    console.error("Error fetching destination stats:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch destination stats",
      },
      500,
    );
  }
});

// Download booking PDF
app.get("/make-server-3bd0ade8/bookings/:id/pdf", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`📄 Generating PDF for booking: ${id}`);

    // Try with and without booking_ prefix
    let booking = await kv.get(id);
    if (!booking && !id.startsWith("booking_")) {
      booking = await kv.get(`booking_${id}`);
    }

    if (!booking) {
      console.error(`❌ Booking not found for ID: ${id}`);
      return c.json(
        { success: false, message: "Booking not found" },
        404,
      );
    }

    console.log(
      `✅ Found booking: ${booking.id} with ${booking.passengers.length} passengers`,
    );

    // Generate QR codes for all passengers
    const qrCodes = [];
    for (let i = 0; i < booking.passengers.length; i++) {
      const qrCode = await generateQRCode(booking.id, i);
      qrCodes.push(qrCode);
      console.log(
        `✅ Generated QR code ${i + 1}/${booking.passengers.length}`,
      );
    }

    console.log(`🔄 Starting PDF generation...`);
    // Generate PDF
    const pdfBase64 = await generateBookingPDF(
      booking,
      qrCodes,
    );

    console.log(`✅ PDF generated, converting to binary...`);
    // Convert base64 to binary
    const pdfBinary = Uint8Array.from(atob(pdfBase64), (c) =>
      c.charCodeAt(0),
    );

    const bookingIdShort =
      booking.id.split("_")[1] || booking.id;

    console.log(
      `📦 Sending PDF file: GoSintra_Tickets_${bookingIdShort}.pdf (${pdfBinary.length} bytes)`,
    );

    return new Response(pdfBinary, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="GoSintra_Tickets_${bookingIdShort}.pdf"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return c.json(
      {
        success: false,
        message: "Failed to generate PDF",
        error: String(error),
      },
      500,
    );
  }
});

// Test PDF generation endpoint
app.get("/make-server-3bd0ade8/test-pdf", async (c) => {
  try {
    console.log("🧪 Testing PDF generation...");

    // Create a minimal test booking
    const testBooking = {
      id: "booking_test123",
      selectedDate: new Date().toISOString(),
      contactInfo: {
        name: "Test User",
        email: "test@example.com",
      },
      passengers: [{ name: "Test Passenger 1", type: "adult" }],
      totalPrice: 25.0,
    };

    // Generate a test QR code
    const testQRCode = await generateQRCode(testBooking.id, 0);
    console.log("✅ Test QR code generated");

    // Try to generate PDF
    const pdfBase64 = await generateBookingPDF(testBooking, [
      testQRCode,
    ]);

    if (!pdfBase64 || pdfBase64.length === 0) {
      return c.json(
        {
          success: false,
          message: "PDF generation returned empty result",
        },
        500,
      );
    }

    console.log(
      `✅ Test PDF generated successfully - ${pdfBase64.length} chars`,
    );

    return c.json({
      success: true,
      message: "PDF generation working",
      pdfSize: pdfBase64.length,
      estimatedBytes: Math.round(pdfBase64.length * 0.75),
    });
  } catch (error) {
    console.error("❌ Test PDF generation failed:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500,
    );
  }
});

// Verify booking code for pickup requests
app.post("/make-server-3bd0ade8/verify-booking", async (c) => {
  try {
    const body = await c.req.json();
    const { bookingCode } = body;

    if (!bookingCode) {
      return c.json(
        {
          success: false,
          message: "Booking code is required",
        },
        400,
      );
    }

    console.log(`🔍 Verifying booking code: ${bookingCode}`);

    // Try to find the booking with this code
    // The booking code is typically stored as the short ID (e.g., "AA-1234")
    // Bookings are stored with key format: "booking_AA-1234"
    let booking = await kv.get(`booking_${bookingCode}`);

    // If not found, try without the "booking_" prefix
    if (!booking) {
      booking = await kv.get(bookingCode);
    }

    if (!booking) {
      console.log(`❌ Booking not found for code: ${bookingCode}`);
      return c.json(
        {
          success: false,
          message: "Invalid booking code",
        },
        404,
      );
    }

    console.log(`✅ Booking verified: ${booking.id}`);

    // Return booking info for prefilling the form
    return c.json({
      success: true,
      booking: {
        id: booking.id,
        customerName: booking.contactInfo?.name || "",
        customerPhone: booking.contactInfo?.phone || "",
        customerEmail: booking.contactInfo?.email || "",
        passes: booking.passengers?.length || 1,
        selectedDate: booking.selectedDate,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying booking:", error);
    return c.json(
      {
        success: false,
        message: "Failed to verify booking",
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// ========== CHAT ENDPOINTS ==========

// Create new chat conversation
app.post("/make-server-3bd0ade8/chat/start", async (c) => {
  try {
    const body = await c.req.json();
    const { customerName, customerEmail } = body;

    // Generate conversation ID
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create conversation metadata
    const conversation = {
      id: conversationId,
      customerName,
      customerEmail,
      status: "open", // open, closed
      unreadByAdmin: 0,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };

    // Save conversation
    await kv.set(
      `chat_conversation_${conversationId}`,
      conversation,
    );

    // Initialize empty messages array
    await kv.set(`chat_messages_${conversationId}`, []);

    console.log(
      `💬 New chat conversation started: ${conversationId}`,
    );

    return c.json({
      success: true,
      conversationId,
      conversation,
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    return c.json(
      {
        success: false,
        error: "Failed to start chat conversation",
      },
      500,
    );
  }
});

// Send message (customer or admin)
app.post("/make-server-3bd0ade8/chat/message", async (c) => {
  try {
    const body = await c.req.json();
    const { conversationId, sender, senderName, message } =
      body;

    if (!conversationId || !sender || !message) {
      return c.json(
        {
          success: false,
          error: "Missing required fields",
        },
        400,
      );
    }

    // Get existing messages
    const messages =
      (await kv.get(`chat_messages_${conversationId}`)) || [];

    // Create new message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sender, // "customer" or "admin"
      senderName,
      message,
      timestamp: new Date().toISOString(),
    };

    // Add message to array
    messages.push(newMessage);

    // Save updated messages
    await kv.set(`chat_messages_${conversationId}`, messages);

    // Update conversation metadata
    const conversation = await kv.get(
      `chat_conversation_${conversationId}`,
    );
    if (conversation) {
      conversation.lastMessageAt = new Date().toISOString();

      // Increment unread count if customer sent message
      if (sender === "customer") {
        conversation.unreadByAdmin =
          (conversation.unreadByAdmin || 0) + 1;
      }

      await kv.set(
        `chat_conversation_${conversationId}`,
        conversation,
      );
    }

    console.log(
      `💬 Message sent in conversation ${conversationId} by ${sender}`,
    );

    return c.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json(
      {
        success: false,
        error: "Failed to send message",
      },
      500,
    );
  }
});

// Get messages for a conversation
app.get(
  "/make-server-3bd0ade8/chat/:conversationId/messages",
  async (c) => {
    try {
      const conversationId = c.req.param("conversationId");

      const messages =
        (await kv.get(`chat_messages_${conversationId}`)) || [];
      const conversation = await kv.get(
        `chat_conversation_${conversationId}`,
      );

      return c.json({
        success: true,
        messages,
        conversation,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch messages",
        },
        500,
      );
    }
  },
);

// Get all conversations (admin)
app.get(
  "/make-server-3bd0ade8/chat/conversations",
  async (c) => {
    try {
      // Query database for all conversation keys
      const { data, error } = await supabase
        .from("kv_store_3bd0ade8")
        .select("key, value")
        .like("key", "chat_conversation_%");

      if (error) {
        throw error;
      }

      const conversations = data
        ? data.map((entry: any) => entry.value)
        : [];

      // Sort by last message time (most recent first)
      conversations.sort((a: any, b: any) => {
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      });

      console.log(
        `💬 Retrieved ${conversations.length} chat conversations`,
      );

      return c.json({
        success: true,
        conversations,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch conversations",
        },
        500,
      );
    }
  },
);

// Mark conversation as read
app.post(
  "/make-server-3bd0ade8/chat/:conversationId/mark-read",
  async (c) => {
    try {
      const conversationId = c.req.param("conversationId");

      const conversation = await kv.get(
        `chat_conversation_${conversationId}`,
      );
      if (conversation) {
        conversation.unreadByAdmin = 0;
        await kv.set(
          `chat_conversation_${conversationId}`,
          conversation,
        );
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Error marking as read:", error);
      return c.json(
        {
          success: false,
          error: "Failed to mark as read",
        },
        500,
      );
    }
  },
);

// Close conversation
app.post(
  "/make-server-3bd0ade8/chat/:conversationId/close",
  async (c) => {
    try {
      const conversationId = c.req.param("conversationId");

      const conversation = await kv.get(
        `chat_conversation_${conversationId}`,
      );
      if (conversation) {
        conversation.status = "closed";
        await kv.set(
          `chat_conversation_${conversationId}`,
          conversation,
        );
      }

      console.log(`💬 Conversation closed: ${conversationId}`);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error closing conversation:", error);
      return c.json(
        {
          success: false,
          error: "Failed to close conversation",
        },
        500,
      );
    }
  },
);

// ============================================================
// PICKUP REQUEST MANAGEMENT
// ============================================================

// Create a new pickup request
app.post("/make-server-3bd0ade8/pickup-requests", async (c) => {
  try {
    const body = await c.req.json();
    const {
      groupSize,
      pickupLocation,
      destination,
      customerName,
      customerPhone,
    } = body;

    if (!groupSize || !pickupLocation) {
      return c.json(
        {
          success: false,
          error: "Group size and pickup location are required",
        },
        400,
      );
    }

    // Generate pickup request ID
    const timestamp = Date.now();
    const requestId = `PICKUP_${timestamp}`;
    const requestTime = new Date().toISOString();

    const pickupRequest = {
      id: requestId,
      groupSize: parseInt(groupSize),
      pickupLocation,
      destination: destination || null,
      customerName: customerName || "Guest",
      customerPhone: customerPhone || null,
      status: "pending", // pending, assigned, completed, cancelled
      requestTime,
      createdAt: requestTime,
      estimatedArrival: new Date(
        Date.now() + 5 * 60000,
      ).toISOString(), // 5 minutes
      vehiclesNeeded: Math.ceil(parseInt(groupSize) / 6),
    };

    // Store the pickup request
    await kv.set(requestId, pickupRequest);

    // Also add to active requests list for easy querying
    const activeRequests =
      (await kv.get("active_pickup_requests")) || [];
    activeRequests.push(requestId);
    await kv.set("active_pickup_requests", activeRequests);

    console.log(
      `🚗 Pickup request created: ${requestId} - ${groupSize} passengers at ${pickupLocation}`,
    );

    return c.json({
      success: true,
      request: pickupRequest,
    });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create pickup request",
      },
      500,
    );
  }
});

// Get all pending pickup requests (for driver dashboard)
app.get("/make-server-3bd0ade8/pickup-requests/pending", async (c) => {
  try {
    const activeRequestIds =
      (await kv.get("active_pickup_requests")) || [];

    const requests = [];
    for (const requestId of activeRequestIds) {
      const request = await kv.get(requestId);
      if (request && request.status === "pending") {
        requests.push(request);
      }
    }

    // Sort by creation time (newest first)
    requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

    return c.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error(
      "Error fetching pending pickup requests:",
      error,
    );
    return c.json(
      {
        success: false,
        error: "Failed to fetch pickup requests",
      },
      500,
    );
  }
});

// Get all active pickup requests (for operations portal - alias for compatibility)
app.get("/make-server-3bd0ade8/pickup/active", async (c) => {
  try {
    const activeRequestIds =
      (await kv.get("active_pickup_requests")) || [];

    const requests = [];
    for (const requestId of activeRequestIds) {
      const request = await kv.get(requestId);
      if (request && request.status === "pending") {
        requests.push(request);
      }
    }

    // Sort by creation time (newest first)
    requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

    return c.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error(
      "Error fetching active pickup requests:",
      error,
    );
    return c.json(
      {
        success: false,
        error: "Failed to fetch pickup requests",
      },
      500,
    );
  }
});

// Update pickup request status
app.post(
  "/make-server-3bd0ade8/pickup/:requestId/status",
  async (c) => {
    try {
      const requestId = c.req.param("requestId");
      const body = await c.req.json();
      const { status, driverName, vehicleInfo } = body;

      if (!status) {
        return c.json(
          {
            success: false,
            error: "Status is required",
          },
          400,
        );
      }

      const request = await kv.get(requestId);
      if (!request) {
        return c.json(
          {
            success: false,
            error: "Pickup request not found",
          },
          404,
        );
      }

      // Update the request
      request.status = status;
      request.updatedAt = new Date().toISOString();
      if (driverName) request.driverName = driverName;
      if (vehicleInfo) request.vehicleInfo = vehicleInfo;

      await kv.set(requestId, request);

      // If completed or cancelled, remove from active list
      if (status === "completed" || status === "cancelled") {
        const activeRequests =
          (await kv.get("active_pickup_requests")) || [];
        const updatedRequests = activeRequests.filter(
          (id: string) => id !== requestId,
        );
        await kv.set("active_pickup_requests", updatedRequests);
      }

      console.log(
        `🚗 Pickup request ${requestId} status updated to: ${status}`,
      );

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Error updating pickup request:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update pickup request",
        },
        500,
      );
    }
  },
);

// Assign pickup request to driver
app.post(
  "/make-server-3bd0ade8/pickup-requests/:requestId/assign",
  async (c) => {
    try {
      const requestId = c.req.param("requestId");
      const body = await c.req.json();
      const { driverId, driverName } = body;

      if (!driverId || !driverName) {
        return c.json(
          {
            success: false,
            error: "Driver ID and name are required",
          },
          400,
        );
      }

      const request = await kv.get(requestId);
      if (!request) {
        return c.json(
          {
            success: false,
            error: "Pickup request not found",
          },
          404,
        );
      }

      // Update the request with driver info
      request.status = "assigned";
      request.driverId = driverId;
      request.driverName = driverName;
      request.assignedAt = new Date().toISOString();
      request.updatedAt = new Date().toISOString();

      await kv.set(requestId, request);

      // Remove from active list since it's been claimed
      const activeRequests =
        (await kv.get("active_pickup_requests")) || [];
      const updatedRequests = activeRequests.filter(
        (id: string) => id !== requestId,
      );
      await kv.set("active_pickup_requests", updatedRequests);

      console.log(
        `🚗 Pickup request ${requestId} assigned to driver ${driverName}`,
      );

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Error assigning pickup request:", error);
      return c.json(
        {
          success: false,
          error: "Failed to assign pickup request",
        },
        500,
      );
    }
  },
);

// Get pickup request by ID
app.get(
  "/make-server-3bd0ade8/pickup/:requestId",
  async (c) => {
    try {
      const requestId = c.req.param("requestId");
      const request = await kv.get(requestId);

      if (!request) {
        return c.json(
          {
            success: false,
            error: "Pickup request not found",
          },
          404,
        );
      }

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Error fetching pickup request:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch pickup request",
        },
        500,
      );
    }
  },
);

// ============================================================
// PWA ICON MANAGEMENT
// ============================================================

// Store PWA icons (from the installer)
app.post(
  "/make-server-3bd0ade8/pwa-icons/deploy",
  async (c) => {
    try {
      const body = await c.req.json();
      const { icons } = body;

      if (
        !icons ||
        !Array.isArray(icons) ||
        icons.length === 0
      ) {
        console.error("❌ Invalid icons data received");
        return c.json(
          {
            success: false,
            error:
              "Invalid icons data. Expected array of icons.",
          },
          400,
        );
      }

      console.log(`📱 Deploying ${icons.length} PWA icons...`);

      // Store each icon in KV store
      const deployedIcons: any[] = [];
      const errors: string[] = [];

      for (const icon of icons) {
        const { filename, size, dataUrl } = icon;

        if (!filename || !size || !dataUrl) {
          const error = `Invalid icon data: filename=${filename}, size=${size}, dataUrl=${dataUrl ? "present" : "missing"}`;
          console.error(`❌ ${error}`);
          errors.push(error);
          continue;
        }

        // Validate size format (should be like "192x192")
        if (!/^\d+x\d+$/.test(size)) {
          const error = `Invalid size format: ${size} (expected format: 192x192)`;
          console.error(`❌ ${error}`);
          errors.push(error);
          continue;
        }

        // Validate dataUrl format
        if (!dataUrl.startsWith("data:image/png;base64,")) {
          const error = `Invalid dataUrl format for ${size}`;
          console.error(`❌ ${error}`);
          errors.push(error);
          continue;
        }

        // Store the icon data
        const key = `pwa_icon_${size}`;
        await kv.set(key, {
          filename,
          size,
          dataUrl,
          deployedAt: new Date().toISOString(),
        });

        deployedIcons.push({
          size,
          filename,
          url: `/make-server-3bd0ade8/pwa-icons/${size}.png`,
        });

        console.log(
          `✅ Deployed icon: ${filename} (${size}) → ${key}`,
        );
      }

      // Store deployment metadata
      await kv.set("pwa_icons_deployed", {
        icons: deployedIcons,
        deployedAt: new Date().toISOString(),
        count: deployedIcons.length,
      });

      console.log(
        `🎉 Successfully deployed ${deployedIcons.length} PWA icons`,
      );

      if (errors.length > 0) {
        console.log(
          `⚠️ Deployment completed with ${errors.length} errors:`,
          errors,
        );
      }

      return c.json({
        success: true,
        deployed: deployedIcons,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully deployed ${deployedIcons.length} icons${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      });
    } catch (error) {
      console.error("❌ Error deploying PWA icons:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to deploy PWA icons",
        },
        500,
      );
    }
  },
);

// Serve PWA icon by size (e.g., /pwa-icons/192x192.png)
app.get(
  "/make-server-3bd0ade8/pwa-icons/:size.png",
  async (c) => {
    try {
      const size = c.req.param("size");

      // Validate size parameter - SILENTLY reject invalid requests from cache
      if (!size || size === "undefined" || size === "null") {
        // Don't log error - this is likely a cached request being blocked
        console.log(
          `🚫 Silently blocked invalid icon request: ${size} (likely from browser cache)`,
        );
        return c.text("Invalid icon size", 400);
      }

      const key = `pwa_icon_${size}`;
      console.log(`🔍 Looking for icon: ${key}`);

      const iconData = await kv.get(key);

      if (!iconData || !iconData.dataUrl) {
        console.error(
          `❌ Icon not found in KV store: ${size} (key: ${key})`,
        );
        return c.text("Icon not found", 404);
      }

      // Extract base64 data from data URL
      const base64Data = iconData.dataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );

      if (!base64Data) {
        console.error(
          `❌ Invalid icon data format for: ${size}`,
        );
        return c.text("Invalid icon data", 500);
      }

      const imageBytes = Uint8Array.from(
        atob(base64Data),
        (c) => c.charCodeAt(0),
      );

      console.log(
        `✅ Serving icon: ${size} (${imageBytes.length} bytes)`,
      );

      return new Response(imageBytes, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
          "Content-Length": imageBytes.length.toString(),
        },
      });
    } catch (error) {
      console.error("❌ Error serving PWA icon:", error);
      return c.text("Error serving icon", 500);
    }
  },
);

// Get current PWA icons deployment status
app.get("/make-server-3bd0ade8/pwa-icons/status", async (c) => {
  try {
    const deployment = await kv.get("pwa_icons_deployed");

    if (!deployment) {
      return c.json({
        success: true,
        deployed: false,
        message: "No PWA icons deployed yet",
      });
    }

    // Filter and validate icons before returning (remove any corrupted data)
    const icons = deployment.icons || [];
    const validIcons = icons.filter((icon: any) => {
      if (!icon || !icon.size || !icon.url) {
        console.warn(
          `⚠️ Skipping invalid icon in status: size=${icon?.size}, url=${icon?.url}`,
        );
        return false;
      }
      if (
        icon.size === "undefined" ||
        icon.size === "null" ||
        typeof icon.size !== "string"
      ) {
        console.warn(
          `⚠️ Skipping icon with invalid size in status: ${icon.size}`,
        );
        return false;
      }
      if (
        icon.url.includes("undefined") ||
        icon.url.includes("null")
      ) {
        console.warn(
          `⚠️ Skipping icon with invalid URL in status: ${icon.url}`,
        );
        return false;
      }
      return true;
    });

    // Log if we filtered out any icons
    if (validIcons.length < icons.length) {
      console.log(
        `🧹 Filtered out ${icons.length - validIcons.length} invalid icons from status response`,
      );
    }

    return c.json({
      success: true,
      deployed: validIcons.length > 0,
      icons: validIcons,
      deployedAt: deployment.deployedAt,
      count: validIcons.length,
    });
  } catch (error) {
    console.error("❌ Error checking PWA icons status:", error);
    return c.json(
      {
        success: false,
        error: "Failed to check deployment status",
      },
      500,
    );
  }
});

// Generate and serve dynamic manifest.json
app.get(
  "/make-server-3bd0ade8/pwa-icons/manifest.json",
  async (c) => {
    try {
      const deployment = await kv.get("pwa_icons_deployed");
      const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

      // Generate manifest with deployed icons or defaults
      const icons = deployment?.icons || [];

      // Filter and validate icons before creating manifest
      const validIcons = icons.filter((icon: any) => {
        if (!icon || typeof icon !== "object") {
          console.warn(
            `⚠️ Skipping invalid icon in manifest: not an object`,
            icon,
          );
          return false;
        }
        if (!icon.size || !icon.url) {
          console.warn(
            `⚠️ Skipping invalid icon in manifest: size=${icon.size}, url=${icon.url}`,
          );
          return false;
        }
        if (
          typeof icon.size !== "string" ||
          typeof icon.url !== "string"
        ) {
          console.warn(
            `⚠️ Skipping icon with non-string properties: size type=${typeof icon.size}, url type=${typeof icon.url}`,
          );
          return false;
        }
        if (icon.size === "undefined" || icon.size === "null") {
          console.warn(
            `⚠️ Skipping icon with invalid size string: ${icon.size}`,
          );
          return false;
        }
        if (
          icon.url.includes("undefined") ||
          icon.url.includes("null")
        ) {
          console.warn(
            `⚠️ Skipping icon with invalid URL: ${icon.url}`,
          );
          return false;
        }
        return true;
      });

      // Log filtering results
      if (validIcons.length < icons.length) {
        console.log(
          `🧹 Manifest: Filtered out ${icons.length - validIcons.length} invalid icons (${validIcons.length} valid)`,
        );
      } else if (validIcons.length > 0) {
        console.log(
          `✅ Manifest: All ${validIcons.length} icons are valid`,
        );
      }

      const manifestIcons = validIcons
        .map((icon: any) => {
          const src = `${baseUrl}${icon.url}`;

          // Final sanity check before including in manifest
          if (
            src.includes("undefined") ||
            src.includes("null")
          ) {
            console.error(
              `🚨 CRITICAL: Manifest icon src contains undefined: ${src}`,
            );
            return null;
          }

          return {
            src,
            sizes: icon.size,
            type: "image/png",
            purpose: "any maskable",
          };
        })
        .filter(Boolean); // Remove any null entries

      const manifest = {
        name: "Go Sintra - Hop-On/Hop-Off Day Pass",
        short_name: "Go Sintra",
        description:
          "Premium hop-on/hop-off day pass service in Sintra, Portugal. Unlimited rides between major attractions with guaranteed seating.",
        start_url: "/",
        display: "standalone",
        background_color: "#fffbf7",
        theme_color: "#0A4D5C",
        orientation: "any",
        icons:
          manifestIcons.length > 0
            ? manifestIcons
            : [
                {
                  src: "/icon-72x72.png",
                  sizes: "72x72",
                  type: "image/png",
                },
                {
                  src: "/icon-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any maskable",
                },
                {
                  src: "/icon-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any maskable",
                },
              ],
        categories: ["travel", "transportation", "tourism"],
        screenshots: [],
      };

      return c.json(manifest);
    } catch (error) {
      console.error("❌ Error generating manifest:", error);
      return c.json(
        {
          error: "Failed to generate manifest",
        },
        500,
      );
    }
  },
);

// ==========================================
// DRIVER AUTHENTICATION & MANAGEMENT ROUTES
// ==========================================

// Create driver account (admin only)
app.post("/make-server-3bd0ade8/drivers/create", async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      email,
      password,
      phoneNumber,
      vehicleType,
      licenseNumber,
    } = body;

    if (!name || !email || !password) {
      return c.json(
        { error: "Name, email, and password are required" },
        400,
      );
    }

    const existingDriver = await kv.get(
      `driver:credentials:${email}`,
    );
    if (existingDriver) {
      return c.json(
        { error: "Driver with this email already exists" },
        400,
      );
    }

    const driverId = `driver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const hashedPassword = btoa(password);

    await kv.set(`driver:credentials:${email}`, {
      driverId,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });

    const driverProfile = {
      id: driverId,
      name,
      email,
      phoneNumber: phoneNumber || "",
      vehicleType: vehicleType || "",
      licenseNumber: licenseNumber || "",
      status: "active",
      isOnline: false,
      createdAt: new Date().toISOString(),
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalQRScans: 0,
    };

    await kv.set(`driver:${driverId}`, driverProfile);

    const driversList = (await kv.get("drivers:list")) || [];
    driversList.push(driverId);
    await kv.set("drivers:list", driversList);

    console.log(
      `✅ Driver account created: ${driverId} (${email})`,
    );

    return c.json({
      success: true,
      driver: { ...driverProfile, password: undefined },
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return c.json(
      { error: "Failed to create driver account" },
      500,
    );
  }
});

// Driver login
app.post("/make-server-3bd0ade8/drivers/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        { error: "Email and password are required" },
        400,
      );
    }

    const credentials = await kv.get(
      `driver:credentials:${email}`,
    );
    if (!credentials) {
      return c.json(
        { error: "Invalid email or password" },
        401,
      );
    }

    const hashedPassword = btoa(password);
    if (credentials.password !== hashedPassword) {
      return c.json(
        { error: "Invalid email or password" },
        401,
      );
    }

    const driverProfile = await kv.get(
      `driver:${credentials.driverId}`,
    );
    if (!driverProfile) {
      return c.json({ error: "Driver profile not found" }, 404);
    }

    if (driverProfile.status !== "active") {
      return c.json(
        { error: "Driver account is inactive" },
        403,
      );
    }

    // Update driver to online status
    const updatedProfile = {
      ...driverProfile,
      isOnline: true,
      lastLoginAt: new Date().toISOString(),
    };
    await kv.set(
      `driver:${credentials.driverId}`,
      updatedProfile,
    );

    console.log(
      `✅ Driver logged in: ${credentials.driverId} (${email})`,
    );

    return c.json({
      success: true,
      driver: { ...updatedProfile, password: undefined },
      token: credentials.driverId,
    });
  } catch (error) {
    console.error("Error during driver login:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Driver logout
app.post("/make-server-3bd0ade8/drivers/logout", async (c) => {
  try {
    const body = await c.req.json();
    const { driverId } = body;

    if (!driverId) {
      return c.json({ error: "Driver ID is required" }, 400);
    }

    const driver = await kv.get(`driver:${driverId}`);
    if (driver) {
      const updatedProfile = {
        ...driver,
        isOnline: false,
        lastLogoutAt: new Date().toISOString(),
      };
      await kv.set(`driver:${driverId}`, updatedProfile);
      console.log(`✅ Driver logged out: ${driverId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error during driver logout:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

// Get all drivers (admin only)
app.get("/make-server-3bd0ade8/drivers", async (c) => {
  try {
    const driversList = (await kv.get("drivers:list")) || [];
    const drivers = [];

    for (const driverId of driversList) {
      const driver = await kv.get(`driver:${driverId}`);
      if (driver) {
        drivers.push(driver);
      }
    }

    return c.json({ success: true, drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return c.json({ error: "Failed to fetch drivers" }, 500);
  }
});

// Get single driver by ID
app.get(
  "/make-server-3bd0ade8/drivers/:driverId",
  async (c) => {
    try {
      const driverId = c.req.param("driverId");
      const driver = await kv.get(`driver:${driverId}`);

      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      return c.json({ success: true, driver });
    } catch (error) {
      console.error("Error fetching driver:", error);
      return c.json({ error: "Failed to fetch driver" }, 500);
    }
  },
);

// Update driver profile (admin only)
app.put(
  "/make-server-3bd0ade8/drivers/:driverId",
  async (c) => {
    try {
      const driverId = c.req.param("driverId");
      const body = await c.req.json();

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const updatedDriver = {
        ...driver,
        name: body.name || driver.name,
        phoneNumber:
          body.phoneNumber !== undefined
            ? body.phoneNumber
            : driver.phoneNumber,
        vehicleType:
          body.vehicleType !== undefined
            ? body.vehicleType
            : driver.vehicleType,
        licenseNumber:
          body.licenseNumber !== undefined
            ? body.licenseNumber
            : driver.licenseNumber,
        status: body.status || driver.status,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`driver:${driverId}`, updatedDriver);

      console.log(`✅ Driver profile updated: ${driverId}`);

      return c.json({ success: true, driver: updatedDriver });
    } catch (error) {
      console.error("Error updating driver:", error);
      return c.json({ error: "Failed to update driver" }, 500);
    }
  },
);

// Delete driver (admin only)
app.delete(
  "/make-server-3bd0ade8/drivers/:driverId",
  async (c) => {
    try {
      const driverId = c.req.param("driverId");

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const driversList = (await kv.get("drivers:list")) || [];
      const updatedList = driversList.filter(
        (id) => id !== driverId,
      );
      await kv.set("drivers:list", updatedList);

      await kv.del(`driver:${driverId}`);
      await kv.del(`driver:credentials:${driver.email}`);

      console.log(`✅ Driver deleted: ${driverId}`);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting driver:", error);
      return c.json({ error: "Failed to delete driver" }, 500);
    }
  },
);

// Record manual ticket sale
app.post(
  "/make-server-3bd0ade8/drivers/record-sale",
  async (c) => {
    try {
      const body = await c.req.json();
      const { driverId, amount, ticketType, quantity, notes } =
        body;

      if (!driverId || !amount || !quantity) {
        return c.json(
          {
            error:
              "Driver ID, amount, and quantity are required",
          },
          400,
        );
      }

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const sale = {
        id: saleId,
        driverId,
        amount: parseFloat(amount),
        ticketType: ticketType || "day-pass",
        quantity: parseInt(quantity),
        notes: notes || "",
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
      };

      await kv.set(`driver:sale:${saleId}`, sale);

      const updatedDriver = {
        ...driver,
        totalTicketsSold:
          (driver.totalTicketsSold || 0) + parseInt(quantity),
        totalRevenue:
          (driver.totalRevenue || 0) + parseFloat(amount),
        lastSaleAt: new Date().toISOString(),
      };
      await kv.set(`driver:${driverId}`, updatedDriver);

      const today = new Date().toISOString().split("T")[0];
      const metricsKey = `driver:metrics:${driverId}:${today}`;
      const metrics = (await kv.get(metricsKey)) || {
        driverId,
        date: today,
        ticketsSold: 0,
        revenue: 0,
        qrScans: 0,
      };

      metrics.ticketsSold += parseInt(quantity);
      metrics.revenue += parseFloat(amount);
      await kv.set(metricsKey, metrics);

      console.log(
        `✅ Manual sale recorded: ${saleId} by driver ${driverId}`,
      );

      return c.json({
        success: true,
        sale,
        driver: updatedDriver,
      });
    } catch (error) {
      console.error("Error recording sale:", error);
      return c.json({ error: "Failed to record sale" }, 500);
    }
  },
);

// Record QR code scan
app.post(
  "/make-server-3bd0ade8/drivers/record-scan",
  async (c) => {
    try {
      const body = await c.req.json();
      const { driverId, bookingId, passengerIndex } = body;

      if (!driverId || !bookingId) {
        return c.json(
          { error: "Driver ID and booking ID are required" },
          400,
        );
      }

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const scan = {
        id: scanId,
        driverId,
        bookingId,
        passengerIndex: passengerIndex || 0,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
      };

      await kv.set(`driver:scan:${scanId}`, scan);

      const updatedDriver = {
        ...driver,
        totalQRScans: (driver.totalQRScans || 0) + 1,
        lastScanAt: new Date().toISOString(),
      };
      await kv.set(`driver:${driverId}`, updatedDriver);

      const today = new Date().toISOString().split("T")[0];
      const metricsKey = `driver:metrics:${driverId}:${today}`;
      const metrics = (await kv.get(metricsKey)) || {
        driverId,
        date: today,
        ticketsSold: 0,
        revenue: 0,
        qrScans: 0,
      };

      metrics.qrScans += 1;
      await kv.set(metricsKey, metrics);

      console.log(
        `✅ QR scan recorded: ${scanId} by driver ${driverId}`,
      );

      return c.json({
        success: true,
        scan,
        driver: updatedDriver,
      });
    } catch (error) {
      console.error("Error recording scan:", error);
      return c.json({ error: "Failed to record scan" }, 500);
    }
  },
);

// Get driver metrics for a date range
app.get(
  "/make-server-3bd0ade8/drivers/:driverId/metrics",
  async (c) => {
    try {
      const driverId = c.req.param("driverId");
      const startDate = c.req.query("startDate");
      const endDate = c.req.query("endDate");

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const metrics = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const metricsKey = `driver:metrics:${driverId}:${dateStr}`;
        const dayMetrics = await kv.get(metricsKey);

        if (dayMetrics) {
          metrics.push(dayMetrics);
        } else {
          metrics.push({
            driverId,
            date: dateStr,
            ticketsSold: 0,
            revenue: 0,
            qrScans: 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return c.json({ success: true, metrics, driver });
    } catch (error) {
      console.error("Error fetching driver metrics:", error);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  },
);

// Get driver's recent activity
app.get(
  "/make-server-3bd0ade8/drivers/:driverId/activity",
  async (c) => {
    try {
      const driverId = c.req.param("driverId");
      const limit = parseInt(c.req.query("limit") || "20");

      const driver = await kv.get(`driver:${driverId}`);
      if (!driver) {
        return c.json({ error: "Driver not found" }, 404);
      }

      const allKeys = await kv.getByPrefix("driver:");

      const sales = [];
      const scans = [];

      for (const [key, value] of Object.entries(allKeys)) {
        if (
          key.startsWith(`driver:sale:`) &&
          value.driverId === driverId
        ) {
          sales.push(value);
        } else if (
          key.startsWith(`driver:scan:`) &&
          value.driverId === driverId
        ) {
          scans.push(value);
        }
      }

      sales.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
      scans.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      const activity = [
        ...sales
          .slice(0, limit)
          .map((s) => ({ ...s, type: "sale" })),
        ...scans
          .slice(0, limit)
          .map((s) => ({ ...s, type: "scan" })),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp),
        )
        .slice(0, limit);

      return c.json({
        success: true,
        activity,
        driver,
        totalSales: sales.length,
        totalScans: scans.length,
      });
    } catch (error) {
      console.error("Error fetching driver activity:", error);
      return c.json({ error: "Failed to fetch activity" }, 500);
    }
  },
);

// ==========================================
// PICKUP REQUEST ROUTES
// ==========================================

// Get all pickup requests
app.get("/make-server-3bd0ade8/pickup-requests", async (c) => {
  try {
    const requestsArray = await kv.getByPrefix(
      "pickup_request:",
    );
    const requests = (requestsArray || []).sort(
      (a: any, b: any) =>
        new Date(b.requestTime).getTime() -
        new Date(a.requestTime).getTime(),
    );

    console.log(
      `📋 Fetched ${requests.length} pickup requests`,
    );

    return c.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("❌ Error fetching pickup requests:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch pickup requests",
        message: error.message,
      },
      500,
    );
  }
});

// Create a new pickup request
app.post("/make-server-3bd0ade8/pickup-requests", async (c) => {
  try {
    const body = await c.req.json();
    const {
      customerName,
      customerPhone,
      pickupLocation,
      destination,
      groupSize,
    } = body;

    if (
      !customerName ||
      !customerPhone ||
      !pickupLocation ||
      !destination ||
      !groupSize
    ) {
      return c.json(
        {
          success: false,
          error: "Missing required fields",
        },
        400,
      );
    }

    const requestId = `REQ${Date.now()}`;
    const request = {
      id: requestId,
      customerName,
      customerPhone,
      pickupLocation,
      destination,
      groupSize,
      requestTime: new Date().toISOString(),
      status: "pending",
      estimatedWait: 10, // Default 10 minutes
    };

    await kv.set(`pickup_request:${requestId}`, request);

    return c.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create pickup request",
      },
      500,
    );
  }
});

// Cancel a pickup request
app.post(
  "/make-server-3bd0ade8/pickup-requests/:id/cancel",
  async (c) => {
    try {
      const requestId = c.req.param("id");
      const request = await kv.get(
        `pickup_request:${requestId}`,
      );

      if (!request) {
        return c.json(
          {
            success: false,
            error: "Request not found",
          },
          404,
        );
      }

      request.status = "cancelled";
      await kv.set(`pickup_request:${requestId}`, request);

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Error cancelling pickup request:", error);
      return c.json(
        {
          success: false,
          error: "Failed to cancel request",
        },
        500,
      );
    }
  },
);

// Accept a pickup request (driver indicates they're going)
app.post(
  "/make-server-3bd0ade8/pickup-requests/:id/assign",
  async (c) => {
    try {
      const requestId = c.req.param("id");
      const body = await c.req.json();
      const { driverId, driverName } = body;

      const request = await kv.get(
        `pickup_request:${requestId}`,
      );

      if (!request) {
        return c.json(
          {
            success: false,
            error: "Request not found",
          },
          404,
        );
      }

      request.status = "accepted";
      request.acceptedBy = driverId;
      request.acceptedByName = driverName;
      request.acceptedAt = new Date().toISOString();
      await kv.set(`pickup_request:${requestId}`, request);

      console.log(
        `✅ Pickup request ${requestId} accepted by driver ${driverName} (${driverId})`,
      );

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error(
        "Error accepting pickup request:",
        error,
      );
      return c.json(
        {
          success: false,
          error: "Failed to accept request",
        },
        500,
      );
    }
  },
);

// Complete a pickup request
app.post(
  "/make-server-3bd0ade8/pickup-requests/:id/complete",
  async (c) => {
    try {
      const requestId = c.req.param("id");
      const request = await kv.get(
        `pickup_request:${requestId}`,
      );

      if (!request) {
        return c.json(
          {
            success: false,
            error: "Request not found",
          },
          404,
        );
      }

      request.status = "completed";
      request.completedTime = new Date().toISOString();
      await kv.set(`pickup_request:${requestId}`, request);

      return c.json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Error completing pickup request:", error);
      return c.json(
        {
          success: false,
          error: "Failed to complete request",
        },
        500,
      );
    }
  },
);

// Get pending pickup requests for drivers
app.get(
  "/make-server-3bd0ade8/pickup-requests/pending",
  async (c) => {
    try {
      const requestsArray = await kv.getByPrefix(
        "pickup_request:",
      );
      const requests = (requestsArray || [])
        .filter((req: any) => req.status === "pending")
        .sort(
          (a: any, b: any) =>
            new Date(a.requestTime).getTime() -
            new Date(b.requestTime).getTime(),
        );

      console.log(
        `📋 Fetched ${requests.length} pending pickup requests`,
      );

      return c.json({
        success: true,
        requests,
        count: requests.length,
      });
    } catch (error) {
      console.error(
        "❌ Error fetching pending pickup requests:",
        error,
      );
      return c.json(
        {
          success: false,
          error: "Failed to fetch pending requests",
          message: error.message,
        },
        500,
      );
    }
  },
);

// ==================== DRIVER MANAGEMENT ROUTES ====================

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper function to generate a simple auth token
function generateAuthToken(): string {
  return crypto.randomUUID();
}

// Get all drivers
app.get("/make-server-3bd0ade8/drivers", async (c) => {
  try {
    console.log("📋 Fetching all drivers...");

    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];

    console.log(`✅ Found ${drivers.length} drivers`);

    // Remove password hashes but keep plaintext password for admin
    const sanitizedDrivers = drivers.map((driver: any) => {
      const { passwordHash, ...safeDriver } = driver;
      return safeDriver;
    });

    return c.json({
      success: true,
      drivers: sanitizedDrivers,
    });
  } catch (error) {
    console.error("❌ Error fetching drivers:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch drivers",
      },
      500,
    );
  }
});

// Create a new driver
app.post("/make-server-3bd0ade8/drivers/create", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password, phoneNumber, vehicleType, licenseNumber, status } = body;

    if (!name || !email || !password) {
      return c.json(
        {
          success: false,
          error: "Name, email, and password are required",
        },
        400,
      );
    }

    console.log(`👤 Creating driver account: ${email}`);

    // Get existing drivers
    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];

    // Check if email already exists
    const existingDriver = drivers.find(
      (d: any) => d.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingDriver) {
      return c.json(
        {
          success: false,
          error: "A driver with this email already exists",
        },
        400,
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new driver
    const newDriver = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      password: password, // Store plaintext password for admin access
      phoneNumber: phoneNumber || "",
      vehicleType: vehicleType || "",
      licenseNumber: licenseNumber || "",
      status: status || "active",
      createdAt: new Date().toISOString(),
      lastLogin: null,
      metrics: {
        ticketsSold: 0,
        ticketsSoldToday: 0,
        revenueGenerated: 0,
        qrCodesScanned: 0,
      },
    };

    // Add to drivers list
    drivers.push(newDriver);
    await kv.set("drivers_list", drivers);

    console.log(`✅ Driver created: ${email}`);

    // Remove password hash before sending response
    const { passwordHash: _, ...safeDriver } = newDriver;

    return c.json({
      success: true,
      driver: safeDriver,
    });
  } catch (error) {
    console.error("❌ Error creating driver:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create driver",
      },
      500,
    );
  }
});

// Driver login
app.post("/make-server-3bd0ade8/drivers/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: "Email and password are required",
        },
        400,
      );
    }

    console.log(`🔐 Driver login attempt: ${email}`);

    // Get all drivers
    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];

    // Find driver by email
    const driver = drivers.find(
      (d: any) => d.email.toLowerCase() === email.toLowerCase(),
    );

    if (!driver) {
      console.log(`❌ Driver not found: ${email}`);
      return c.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        401,
      );
    }

    // Check if driver is active
    if (driver.status !== "active") {
      console.log(`❌ Driver account inactive: ${email}`);
      return c.json(
        {
          success: false,
          error: "Your account is inactive. Please contact your administrator.",
        },
        403,
      );
    }

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== driver.passwordHash) {
      console.log(`❌ Invalid password for: ${email}`);
      return c.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        401,
      );
    }

    // Update last login time
    driver.lastLogin = new Date().toISOString();
    await kv.set("drivers_list", drivers);

    // Generate auth token
    const token = generateAuthToken();

    // Store active session
    const sessions = (await kv.get("driver_sessions")) || {};
    sessions[token] = {
      driverId: driver.id,
      email: driver.email,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
    await kv.set("driver_sessions", sessions);

    console.log(`✅ Driver logged in successfully: ${email}`);

    // Remove password hash before sending response
    const { passwordHash: _, ...safeDriver } = driver;

    return c.json({
      success: true,
      driver: safeDriver,
      token,
    });
  } catch (error) {
    console.error("❌ Error during driver login:", error);
    return c.json(
      {
        success: false,
        error: "Login failed. Please try again.",
      },
      500,
    );
  }
});

// Update driver
app.put("/make-server-3bd0ade8/drivers/:id", async (c) => {
  try {
    const driverId = c.req.param("id");
    const body = await c.req.json();

    console.log(`✏️ Updating driver: ${driverId}`);

    // Get all drivers
    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];

    // Find driver index
    const driverIndex = drivers.findIndex((d: any) => d.id === driverId);

    if (driverIndex === -1) {
      return c.json(
        {
          success: false,
          error: "Driver not found",
        },
        404,
      );
    }

    // Update driver fields
    const updatedDriver = {
      ...drivers[driverIndex],
      name: body.name || drivers[driverIndex].name,
      phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : drivers[driverIndex].phoneNumber,
      vehicleType: body.vehicleType !== undefined ? body.vehicleType : drivers[driverIndex].vehicleType,
      licenseNumber: body.licenseNumber !== undefined ? body.licenseNumber : drivers[driverIndex].licenseNumber,
      status: body.status || drivers[driverIndex].status,
      updatedAt: new Date().toISOString(),
    };

    // Update password if provided
    if (body.password) {
      updatedDriver.passwordHash = await hashPassword(body.password);
      updatedDriver.password = body.password; // Also update plaintext password
    }

    drivers[driverIndex] = updatedDriver;
    await kv.set("drivers_list", drivers);

    console.log(`✅ Driver updated: ${driverId}`);

    // Remove password hash before sending response
    const { passwordHash: _, ...safeDriver } = updatedDriver;

    return c.json({
      success: true,
      driver: safeDriver,
    });
  } catch (error) {
    console.error("❌ Error updating driver:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update driver",
      },
      500,
    );
  }
});

// Delete driver
app.delete("/make-server-3bd0ade8/drivers/:id", async (c) => {
  try {
    const driverId = c.req.param("id");

    console.log(`🗑️ Deleting driver: ${driverId}`);

    // Get all drivers
    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];

    // Filter out the driver to delete
    const filteredDrivers = drivers.filter((d: any) => d.id !== driverId);

    if (filteredDrivers.length === drivers.length) {
      return c.json(
        {
          success: false,
          error: "Driver not found",
        },
        404,
      );
    }

    await kv.set("drivers_list", filteredDrivers);

    console.log(`✅ Driver deleted: ${driverId}`);

    return c.json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting driver:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete driver",
      },
      500,
    );
  }
});

// Verify driver token (for authenticated requests)
app.post("/make-server-3bd0ade8/drivers/verify-token", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json(
        {
          success: false,
          error: "Token is required",
        },
        400,
      );
    }

    // Get active sessions
    const sessions = (await kv.get("driver_sessions")) || {};
    const session = sessions[token];

    if (!session) {
      return c.json(
        {
          success: false,
          error: "Invalid token",
        },
        401,
      );
    }

    // Check if token is expired
    if (new Date(session.expiresAt) < new Date()) {
      // Remove expired session
      delete sessions[token];
      await kv.set("driver_sessions", sessions);

      return c.json(
        {
          success: false,
          error: "Token expired",
        },
        401,
      );
    }

    // Get driver details
    const driversData = await kv.get("drivers_list");
    const drivers = driversData || [];
    const driver = drivers.find((d: any) => d.id === session.driverId);

    if (!driver) {
      return c.json(
        {
          success: false,
          error: "Driver not found",
        },
        404,
      );
    }

    // Remove password hash before sending response
    const { passwordHash: _, ...safeDriver } = driver;

    return c.json({
      success: true,
      driver: safeDriver,
    });
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    return c.json(
      {
        success: false,
        error: "Token verification failed",
      },
      500,
    );
  }
});

// ===== IMAGE MANAGEMENT ROUTES =====

// Ensure storage bucket exists on startup
const IMAGES_BUCKET = "make-3bd0ade8-images";

async function ensureImagesBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (bucket) => bucket.name === IMAGES_BUCKET,
    );

    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${IMAGES_BUCKET}`);
      const { error } = await supabase.storage.createBucket(
        IMAGES_BUCKET,
        {
          public: false,
          fileSizeLimit: 5242880, // 5MB
        },
      );

      if (error) {
        console.error("❌ Failed to create images bucket:", error);
      } else {
        console.log(`✅ Images bucket created: ${IMAGES_BUCKET}`);
      }
    } else {
      console.log(`✅ Images bucket already exists: ${IMAGES_BUCKET}`);
    }
  } catch (error) {
    console.error("❌ Error ensuring images bucket:", error);
  }
}

// Initialize bucket on startup
ensureImagesBucket();

// Upload image
app.post("/make-server-3bd0ade8/images/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { fileName, fileData, fileType } = body;

    if (!fileName || !fileData || !fileType) {
      return c.json(
        {
          success: false,
          error: "Missing required fields",
        },
        400,
      );
    }

    console.log(`📤 Uploading image: ${fileName}`);

    // Convert base64 to buffer
    const base64Data = fileData.split(",")[1] || fileData;
    const imageBytes = Uint8Array.from(
      atob(base64Data),
      (c) => c.charCodeAt(0),
    );

    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(uniqueFileName, imageBytes, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return c.json(
        {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        },
        500,
      );
    }

    // Create signed URL (valid for 10 years)
    const { data: signedUrlData, error: urlError } =
      await supabase.storage
        .from(IMAGES_BUCKET)
        .createSignedUrl(uniqueFileName, 315360000); // 10 years in seconds

    if (urlError || !signedUrlData) {
      console.error("❌ Error creating signed URL:", urlError);
      return c.json(
        {
          success: false,
          error: "Failed to create image URL",
        },
        500,
      );
    }

    console.log(`✅ Image uploaded: ${uniqueFileName}`);

    // Store image metadata
    const imageMetadata = {
      name: uniqueFileName,
      originalName: fileName,
      url: signedUrlData.signedUrl,
      uploadedAt: new Date().toISOString(),
      size: imageBytes.length,
      type: fileType,
    };

    // Save metadata to KV store
    const existingImages = (await kv.get("uploaded_images")) || [];
    existingImages.push(imageMetadata);
    await kv.set("uploaded_images", existingImages);

    return c.json({
      success: true,
      image: imageMetadata,
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    return c.json(
      {
        success: false,
        error: "Failed to upload image",
      },
      500,
    );
  }
});

// Get all uploaded images
app.get("/make-server-3bd0ade8/images", async (c) => {
  try {
    const images = (await kv.get("uploaded_images")) || [];

    // Refresh signed URLs if needed (check if any are close to expiring)
    const refreshedImages = [];
    for (const image of images) {
      // For simplicity, just return existing URLs
      // In production, you'd check expiration and regenerate if needed
      refreshedImages.push(image);
    }

    return c.json({
      success: true,
      images: refreshedImages,
    });
  } catch (error) {
    console.error("❌ Error fetching images:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch images",
      },
      500,
    );
  }
});

// Delete image
app.delete("/make-server-3bd0ade8/images/:fileName", async (c) => {
  try {
    const fileName = decodeURIComponent(c.req.param("fileName"));

    console.log(`🗑️ Deleting image: ${fileName}`);

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove([fileName]);

    if (deleteError) {
      console.error("❌ Delete error:", deleteError);
      return c.json(
        {
          success: false,
          error: `Delete failed: ${deleteError.message}`,
        },
        500,
      );
    }

    // Remove from metadata
    const existingImages = (await kv.get("uploaded_images")) || [];
    const updatedImages = existingImages.filter(
      (img: any) => img.name !== fileName,
    );
    await kv.set("uploaded_images", updatedImages);

    console.log(`✅ Image deleted: ${fileName}`);

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete image",
      },
      500,
    );
  }
});

// ==========================================
// SYSTEM RESET ROUTE (ONE-TIME USE FOR PRE-DEPLOYMENT)
// ==========================================

app.post("/make-server-3bd0ade8/admin/reset-all-data", async (c) => {
  try {
    console.log("🔴 SYSTEM RESET INITIATED - Deleting all data...");
    
    // Get all keys from the database
    const allBookings = await kv.getByPrefix("booking_");
    const allPickups = await kv.getByPrefix("pickup_request:");
    const allCheckIns = await kv.getByPrefix("checkin_");
    const allDestinations = await kv.getByPrefix("destination_");
    const allChats = await kv.getByPrefix("live_chat_");
    
    let deletedCount = 0;
    
    // Delete all bookings
    if (allBookings && allBookings.length > 0) {
      for (const booking of allBookings) {
        if (booking && booking.id) {
          await kv.del(`booking_${booking.id}`);
          deletedCount++;
        }
      }
      console.log(`✅ Deleted ${allBookings.length} bookings`);
    }
    
    // Delete all pickup requests
    if (allPickups && allPickups.length > 0) {
      for (const pickup of allPickups) {
        if (pickup && pickup.id) {
          await kv.del(`pickup_request:${pickup.id}`);
          deletedCount++;
        }
      }
      console.log(`✅ Deleted ${allPickups.length} pickup requests`);
    }
    
    // Delete all check-ins and destination data
    const checkInKeys = await kv.getByPrefix("checkins_");
    if (checkInKeys) {
      for (const item of checkInKeys) {
        // Delete by reconstructing the key
        const key = `checkins_${item.bookingId || 'unknown'}_${item.passengerIndex || 0}`;
        try {
          await kv.del(key);
          deletedCount++;
        } catch (e) {
          console.warn(`Could not delete check-in key: ${key}`);
        }
      }
    }
    
    // Delete destination logs and stats
    const destLogs = await kv.getByPrefix("destination_log_");
    if (destLogs) {
      for (let i = 0; i < destLogs.length; i++) {
        const today = new Date().toISOString().split('T')[0];
        await kv.del(`destination_log_${today}`);
      }
    }
    
    const destinations = [
      "Palácio da Pena",
      "Castelo dos Mouros", 
      "Palácio Nacional de Sintra",
      "Quinta da Regaleira",
      "Palácio de Monserrate",
      "Cabo da Roca",
      "Centro Histórico",
      "Other"
    ];
    
    const today = new Date().toISOString().split('T')[0];
    for (const dest of destinations) {
      await kv.del(`destination_${today}_${dest}`);
    }
    
    // Delete all chat conversations
    if (allChats && allChats.length > 0) {
      for (const chat of allChats) {
        if (chat && chat.id) {
          await kv.del(`live_chat_${chat.id}`);
          deletedCount++;
        }
      }
      console.log(`✅ Deleted ${allChats.length} chat conversations`);
    }
    
    // Reset booking prefix counter to AA
    await kv.set("booking_current_prefix", "AA");
    console.log("✅ Reset booking prefix to AA");
    
    // Clear active pickup requests list
    await kv.del("active_pickup_requests");
    
    console.log(`🔴 SYSTEM RESET COMPLETE - Deleted ${deletedCount} items total`);
    
    return c.json({
      success: true,
      message: "All data has been reset successfully",
      deletedCount: deletedCount,
      details: {
        bookings: allBookings?.length || 0,
        pickups: allPickups?.length || 0,
        chats: allChats?.length || 0,
      }
    });
  } catch (error) {
    console.error("❌ Error during system reset:", error);
    return c.json(
      {
        success: false,
        error: "Failed to reset system data",
        message: error.message
      },
      500
    );
  }
});

Deno.serve(app.fetch);