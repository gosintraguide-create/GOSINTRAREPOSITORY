import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";

const app = new Hono();

// Middleware - Allow all origins for development
app.use("*", cors({
  origin: (origin) => {
    // Allow all localhost origins
    if (origin?.includes('localhost')) return origin;
    
    // Allow all Vercel preview and production URLs
    if (origin?.includes('vercel.app')) return origin;
    
    // Allow specific production domains
    const allowedDomains = [
      'https://go-sintra.vercel.app',
      // Add your custom domain here when ready
      // 'https://your-custom-domain.com',
    ];
    
    if (allowedDomains.includes(origin || '')) return origin;
    
    // For development, allow all origins
    return origin || '*';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use("*", logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20.acacia",
}) : null;

// Generate unique Go Sintra booking ID with sequential letter prefixes
// Format: AA-1234, AB-1234, AC-1234... ZZ-9999
// When AA exhausts (9,000 IDs), moves to AB, then AC, etc.
// Total capacity: 676 letter combos × 9,000 numbers = 6,084,000 IDs!

async function getNextAvailablePrefix(): Promise<string> {
  // Get current prefix from storage (defaults to "AA")
  const currentPrefixData = await kv.get("booking_current_prefix");
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
  console.log(`📝 Prefix ${currentPrefix} exhausted, moving to next...`);
  
  const nextPrefix = getNextPrefix(currentPrefix);
  
  // Save new prefix
  await kv.set("booking_current_prefix", nextPrefix);
  
  console.log(`✅ New prefix: ${nextPrefix}`);
  return nextPrefix;
}

function getNextPrefix(current: string): string {
  // Convert letters to numbers (A=0, B=1, ... Z=25)
  const first = current.charCodeAt(0) - 65;  // First letter
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
    console.warn("🚀 MILESTONE: Moving to 3-letter prefix system (AAA-####)");
    return "AAA";
  }
  
  // Convert back to letters
  const newPrefix = String.fromCharCode(65 + newFirst) + String.fromCharCode(65 + newSecond);
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
      console.error(`Error generating booking ID (attempt ${attempt + 1}):`, error);
    }
  }
  
  // Fallback (extremely rare - only if something is broken)
  console.error("❌ CRITICAL: Could not generate booking ID after 50 attempts");
  const timestamp = Date.now().toString().slice(-6);
  return `FB-${timestamp}`; // FB = Fallback
}

// Initialize database on startup (only runs once per database)
async function initializeDatabase() {
  try {
    // Check if database has already been initialized
    const dbInitialized = await kv.get("db_initialized");
    
    if (dbInitialized) {
      console.log("✅ Database already initialized, skipping setup");
      return;
    }
    
    console.log("🔧 First-time database initialization...");
    
    // Initialize default content
    await kv.set("website_content", {
      initialized: true,
      lastUpdated: new Date().toISOString()
    });
    console.log("✅ Default content initialized");

    // Initialize default pricing
    await kv.set("pricing_config", {
      dayPass: {
        adult: 25,
        child: 15,
        infant: 0
      },
      guidedTour: {
        private: 150,
        small: 35
      }
    });
    console.log("✅ Default pricing initialized");
    
    // Mark database as initialized
    await kv.set("db_initialized", {
      initialized: true,
      timestamp: new Date().toISOString(),
      version: "1.0"
    });

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}

// Call initialization (will only run once per database)
initializeDatabase();

// Generate QR code function
async function generateQRCode(bookingId: string, passengerIndex: number): Promise<string> {
  const qrData = `${bookingId}|${passengerIndex}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#0A4D5C',
      light: '#FFFFFF'
    }
  });
  console.log(`✅ Generated QR code for ${bookingId} passenger ${passengerIndex} - Length: ${qrCodeDataUrl.length}`);
  return qrCodeDataUrl;
}

// Generate PDF with booking confirmation and QR codes
async function generateBookingPDF(booking: any, qrCodes: string[]): Promise<string> {
  try {
    console.log(`🔧 Starting PDF generation for booking ${booking.id}`);
    console.log(`📊 PDF will include ${qrCodes.length} QR codes`);
    
    const pdfDoc = await PDFDocument.create();
    console.log(`✅ pdf-lib instance created successfully`);

    const formattedDate = new Date(booking.selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const bookingIdShort = booking.id.split('_')[1] || booking.id;
    
    // Add a page
    let page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();
    
    let yPosition = height - 50;

    // Header background
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.039, 0.302, 0.361), // #0A4D5C
    });

    // Title
    page.drawText('Booking Confirmed!', {
      x: 50,
      y: height - 60,
      size: 28,
      color: rgb(1, 1, 1),
    });

    page.drawText('Go Sintra - Premium Hop-On/Hop-Off Service', {
      x: 50,
      y: height - 90,
      size: 14,
      color: rgb(1, 1, 1),
    });

    yPosition = height - 150;

    // Booking Details Section
    page.drawRectangle({
      x: 50,
      y: yPosition - 120,
      width: width - 100,
      height: 120,
      color: rgb(1, 0.957, 0.929), // #FFF4ED
    });

    page.drawText('Booking Details', {
      x: 70,
      y: yPosition - 30,
      size: 16,
      color: rgb(0.039, 0.302, 0.361),
    });

    page.drawText(`Booking ID: ${bookingIdShort}`, {
      x: 70,
      y: yPosition - 55,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText(`Date: ${formattedDate}`, {
      x: 70,
      y: yPosition - 75,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText(`Operating Hours: 9:00 AM - 8:00 PM`, {
      x: 70,
      y: yPosition - 95,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText(`Day Passes: ${booking.passengers.length} ${booking.passengers.length === 1 ? 'passenger' : 'passengers'}`, {
      x: 70,
      y: yPosition - 115,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    yPosition -= 150;

    // Instructions Section
    page.drawRectangle({
      x: 50,
      y: yPosition - 100,
      width: width - 100,
      height: 100,
      color: rgb(0.961, 0.961, 0.961), // #F5F5F5
    });

    page.drawText('How to Use Your Pass:', {
      x: 70,
      y: yPosition - 25,
      size: 12,
      color: rgb(0.039, 0.302, 0.361),
    });

    page.drawText('Show your QR code to the driver when boarding', {
      x: 70,
      y: yPosition - 45,
      size: 9,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText('Valid for unlimited hop-on/hop-off rides until 8:00 PM', {
      x: 70,
      y: yPosition - 60,
      size: 9,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText('New vehicles depart every 10-15 minutes', {
      x: 70,
      y: yPosition - 75,
      size: 9,
      color: rgb(0.176, 0.204, 0.212),
    });

    yPosition -= 130;

    // Generate tickets for each passenger (new perforated design)
    for (let i = 0; i < booking.passengers.length; i++) {
      const passenger = booking.passengers[i];
      const qrCode = qrCodes[i];

      // Check if we need a new page
      if (yPosition < 260) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      const ticketHeight = 230;
      const ticketWidth = width - 100;
      const ticketX = 50;
      const ticketY = yPosition - ticketHeight;
      
      // Main ticket section width (70% of total for better proportions)
      const mainWidth = ticketWidth * 0.68;
      const stubWidth = ticketWidth * 0.32;

      // === MAIN TICKET SECTION ===
      
      // Ticket background
      page.drawRectangle({
        x: ticketX,
        y: ticketY,
        width: mainWidth,
        height: ticketHeight,
        color: rgb(1, 0.973, 0.941), // #FFF8F0
        borderColor: rgb(0.867, 0.816, 0.753), // #DDD0C0
        borderWidth: 1.5,
      });

      // Header background (terracotta)
      page.drawRectangle({
        x: ticketX,
        y: ticketY + ticketHeight - 40,
        width: mainWidth,
        height: 40,
        color: rgb(0.851, 0.471, 0.263), // #D97843
      });

      // Header text - "DAY PASS"
      page.drawText('DAY PASS', {
        x: ticketX + 15,
        y: ticketY + ticketHeight - 25,
        size: 11,
        color: rgb(1, 0.973, 0.941),
      });

      // Booking ID in header with border
      const bookingIdWidth = bookingIdShort.length * 5.5;
      page.drawRectangle({
        x: ticketX + mainWidth - bookingIdWidth - 25,
        y: ticketY + ticketHeight - 32,
        width: bookingIdWidth + 15,
        height: 18,
        borderColor: rgb(1, 0.973, 0.941, 0.4),
        borderWidth: 1,
      });
      page.drawText(bookingIdShort, {
        x: ticketX + mainWidth - bookingIdWidth - 18,
        y: ticketY + ticketHeight - 23,
        size: 9,
        color: rgb(1, 0.973, 0.941),
      });

      // Define consistent left margin and column positions
      const leftMargin = ticketX + 18;
      const col1X = leftMargin;
      const col2X = ticketX + mainWidth / 2 + 5;
      
      // Content area - Row 1: Passenger Info
      let contentY = ticketY + ticketHeight - 60;

      // Passenger Name (spans both columns for longer names)
      page.drawText('NAME OF PASSENGER', {
        x: col1X,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(passenger.name.toUpperCase(), {
        x: col1X,
        y: contentY - 14,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Ticket Type (right column)
      page.drawText('TICKET TYPE', {
        x: col2X,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(passenger.type.toUpperCase(), {
        x: col2X,
        y: contentY - 14,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Row 2: Location Info
      contentY -= 42;

      // Service Area (left column)
      page.drawText('SERVICE AREA', {
        x: col1X,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText('SINTRA', {
        x: col1X,
        y: contentY - 14,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Coverage (right column)
      page.drawText('COVERAGE', {
        x: col2X,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText('ALL ROUTES', {
        x: col2X,
        y: contentY - 14,
        size: 11,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Divider line
      contentY -= 28;
      page.drawLine({
        start: { x: ticketX + 12, y: contentY },
        end: { x: ticketX + mainWidth - 12, y: contentY },
        color: rgb(0.867, 0.816, 0.753),
        thickness: 1,
      });

      // Row 3: Date & Time Info (3 columns)
      contentY -= 18;
      
      const col3Width = mainWidth / 3;

      // Date
      page.drawText('DATE', {
        x: col1X,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(formattedDate, {
        x: col1X,
        y: contentY - 13,
        size: 9,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Start Time
      page.drawText('START TIME', {
        x: ticketX + col3Width + 8,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(booking.timeSlot, {
        x: ticketX + col3Width + 8,
        y: contentY - 13,
        size: 9,
        color: rgb(0.176, 0.204, 0.212),
      });

      // Valid Until
      page.drawText('VALID UNTIL', {
        x: ticketX + col3Width * 2 + 3,
        y: contentY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText('20:00', {
        x: ticketX + col3Width * 2 + 3,
        y: contentY - 13,
        size: 9,
        color: rgb(0.176, 0.204, 0.212),
      });

      // === PERFORATION LINE ===
      const perforationX = ticketX + mainWidth;
      // Draw dashed perforation line
      for (let j = 0; j < 40; j++) {
        const dashY = ticketY + (ticketHeight / 40) * j;
        page.drawRectangle({
          x: perforationX - 0.5,
          y: dashY,
          width: 1,
          height: ticketHeight / 80,
          color: rgb(0.867, 0.816, 0.753),
        });
      }

      // Left and right notches (perforated edges)
      const notchRadius = 4;
      const notchCount = 5;
      for (let n = 0; n < notchCount; n++) {
        const notchY = ticketY + (ticketHeight / (notchCount + 1)) * (n + 1);
        
        // Left notch
        page.drawCircle({
          x: ticketX,
          y: notchY,
          size: notchRadius,
          color: rgb(1, 1, 1), // White background
          borderColor: rgb(0.867, 0.816, 0.753),
          borderWidth: 0.5,
        });
        
        // Right notch
        page.drawCircle({
          x: ticketX + ticketWidth,
          y: notchY,
          size: notchRadius,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.867, 0.816, 0.753),
          borderWidth: 0.5,
        });
      }

      // === STUB SECTION ===
      
      // Stub background
      page.drawRectangle({
        x: perforationX,
        y: ticketY,
        width: stubWidth,
        height: ticketHeight,
        color: rgb(1, 0.973, 0.941), // #FFF8F0
        borderColor: rgb(0.867, 0.816, 0.753),
        borderWidth: 1.5,
      });

      // Stub header
      page.drawRectangle({
        x: perforationX,
        y: ticketY + ticketHeight - 40,
        width: stubWidth,
        height: 40,
        color: rgb(0.851, 0.471, 0.263), // #D97843
      });

      page.drawText('DAY PASS', {
        x: perforationX + 12,
        y: ticketY + ticketHeight - 25,
        size: 9,
        color: rgb(1, 0.973, 0.941),
      });

      // Stub content - centered alignment
      const stubCenterX = perforationX + stubWidth / 2;
      let stubY = ticketY + ticketHeight - 62;

      // Passenger (first name only)
      const firstName = passenger.name.split(' ')[0];
      const firstNameWidth = firstName.length * 4.5;
      
      page.drawText('PASSENGER', {
        x: stubCenterX - 22,
        y: stubY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText(firstName.toUpperCase(), {
        x: stubCenterX - firstNameWidth / 2,
        y: stubY - 13,
        size: 9,
        color: rgb(0.176, 0.204, 0.212),
      });

      stubY -= 35;

      // Service
      page.drawText('SERVICE', {
        x: stubCenterX - 18,
        y: stubY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      page.drawText('SINTRA', {
        x: stubCenterX - 18,
        y: stubY - 13,
        size: 9,
        color: rgb(0.176, 0.204, 0.212),
      });

      stubY -= 28;

      // Divider
      page.drawLine({
        start: { x: perforationX + 8, y: stubY },
        end: { x: perforationX + stubWidth - 8, y: stubY },
        color: rgb(0.867, 0.816, 0.753),
        thickness: 1,
      });

      stubY -= 18;

      // QR Code - centered
      if (qrCode) {
        try {
          const qrBase64 = qrCode.replace(/^data:image\/png;base64,/, '');
          const qrImageBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
          const qrImage = await pdfDoc.embedPng(qrImageBytes);
          
          const qrSize = 75;
          const qrX = perforationX + (stubWidth - qrSize) / 2;
          
          // White background for QR with rounded corners effect
          page.drawRectangle({
            x: qrX - 4,
            y: stubY - qrSize - 4,
            width: qrSize + 8,
            height: qrSize + 8,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.9, 0.9, 0.9),
            borderWidth: 1,
          });

          page.drawImage(qrImage, {
            x: qrX,
            y: stubY - qrSize,
            width: qrSize,
            height: qrSize,
          });

          stubY -= qrSize + 10;

          // "Scan to validate" text - centered
          const scanTextWidth = 52;
          page.drawText('Scan to validate', {
            x: stubCenterX - scanTextWidth / 2,
            y: stubY,
            size: 7,
            color: rgb(0.42, 0.447, 0.533),
          });

          console.log(`✅ Added QR code for passenger ${i + 1}: ${passenger.name}`);
        } catch (err) {
          console.error(`Error adding QR code for passenger ${i + 1}:`, err);
        }
      }

      stubY -= 18;

      // Divider
      page.drawLine({
        start: { x: perforationX + 8, y: stubY },
        end: { x: perforationX + stubWidth - 8, y: stubY },
        color: rgb(0.867, 0.816, 0.753),
        thickness: 1,
      });

      stubY -= 14;

      // Date in stub - centered
      page.drawText('DATE', {
        x: stubCenterX - 12,
        y: stubY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });
      
      const dateWidth = formattedDate.length * 3.5;
      page.drawText(formattedDate, {
        x: stubCenterX - dateWidth / 2,
        y: stubY - 12,
        size: 8,
        color: rgb(0.176, 0.204, 0.212),
      });

      stubY -= 28;

      // Booking ID at bottom - centered
      const idWidth = bookingIdShort.length * 3;
      page.drawText(bookingIdShort, {
        x: stubCenterX - idWidth / 2,
        y: stubY,
        size: 7,
        color: rgb(0.42, 0.447, 0.533),
      });

      // Counter badge (if multiple passengers)
      if (booking.passengers.length > 1) {
        const badgeRadius = 16;
        const badgeX = ticketX + ticketWidth - badgeRadius - 5;
        const badgeY = ticketY + ticketHeight - badgeRadius - 5;
        
        // Badge circle with shadow effect
        page.drawCircle({
          x: badgeX,
          y: badgeY,
          size: badgeRadius,
          color: rgb(0.039, 0.302, 0.361), // primary
          borderColor: rgb(1, 1, 1),
          borderWidth: 3.5,
        });

        // Counter text - better centering
        const counterText = `${i + 1}`;
        const ofText = `of ${booking.passengers.length}`;
        
        page.drawText(counterText, {
          x: badgeX - 5,
          y: badgeY + 4,
          size: 11,
          color: rgb(1, 1, 1),
        });
        page.drawText(ofText, {
          x: badgeX - (ofText.length * 2.5),
          y: badgeY - 8,
          size: 7,
          color: rgb(1, 1, 1),
        });
      }

      yPosition -= ticketHeight + 35;
    }

    // Order Summary on last page or new page if needed
    if (yPosition < 150) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    page.drawRectangle({
      x: 50,
      y: yPosition - 90,
      width: width - 100,
      height: 90,
      color: rgb(1, 0.957, 0.929), // #FFF4ED
    });

    page.drawText('Order Summary', {
      x: 70,
      y: yPosition - 30,
      size: 14,
      color: rgb(0.039, 0.302, 0.361),
    });

    page.drawText(`Day Pass (${booking.passengers.length} ${booking.passengers.length === 1 ? 'passenger' : 'passengers'})`, {
      x: 70,
      y: yPosition - 55,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    page.drawText(`€${booking.totalPrice.toFixed(2)}`, {
      x: width - 120,
      y: yPosition - 55,
      size: 11,
      color: rgb(0.176, 0.204, 0.212),
    });

    // Total line
    page.drawText('Total Paid', {
      x: 70,
      y: yPosition - 75,
      size: 14,
      color: rgb(0.039, 0.302, 0.361),
    });

    page.drawText(`€${booking.totalPrice.toFixed(2)}`, {
      x: width - 120,
      y: yPosition - 75,
      size: 14,
      color: rgb(0.039, 0.302, 0.361),
    });

    // Footer on every page
    const pages = pdfDoc.getPages();
    for (const pg of pages) {
      pg.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 80,
        color: rgb(0.039, 0.302, 0.361),
      });

      pg.drawText('Go Sintra', {
        x: width / 2 - 30,
        y: 50,
        size: 10,
        color: rgb(1, 1, 1),
      });

      pg.drawText('Email: info@gosintra.com | WhatsApp: +351 932 967 279', {
        x: width / 2 - 150,
        y: 35,
        size: 8,
        color: rgb(1, 1, 1),
      });

      pg.drawText('Operating Daily: 9:00 AM - 8:00 PM | Sintra, Portugal', {
        x: width / 2 - 135,
        y: 20,
        size: 8,
        color: rgb(1, 1, 1),
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    
    console.log(`✅ Generated PDF with ${booking.passengers.length} tickets - Size: ${base64.length} bytes`);
    console.log(`📄 PDF base64 preview (first 100 chars): ${base64.substring(0, 100)}`);
    
    return base64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Send booking confirmation email with QR codes
async function sendBookingEmail(booking: any, qrCodes: string[]) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const formattedDate = new Date(booking.selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Verify all passengers have QR codes
    const passengersWithQR = booking.passengers.map((p: any, i: number) => ({
      ...p,
      qrCode: qrCodes[i]
    }));
    
    console.log(`✅ Email payload includes ${passengersWithQR.length} passengers with QR codes:`, 
      passengersWithQR.map((p: any, i: number) => ({
        name: p.name,
        hasQRCode: !!p.qrCode,
        qrCodeLength: p.qrCode?.length || 0
      }))
    );

    // Build HTML email
    const htmlContent = generateBookingConfirmationHTML({
      customerName: booking.contactInfo.name,
      bookingId: booking.id,
      selectedDate: booking.selectedDate,
      formattedDate,
      passengers: passengersWithQR,
      totalPrice: booking.totalPrice,
      dayPassCount: booking.passengers.length,
      guidedTour: booking.guidedTour,
      attractions: booking.selectedAttractions
    });

    console.log(`📧 Preparing email with ${qrCodes.length} QR codes for ${booking.contactInfo.email}`);
    console.log(`QR Code sample (first 100 chars): ${qrCodes[0]?.substring(0, 100)}...`);

    // Generate PDF with tickets
    let pdfBase64;
    try {
      console.log(`🔄 Attempting to generate PDF for booking ${booking.id}...`);
      pdfBase64 = await generateBookingPDF(booking, qrCodes);
      
      if (!pdfBase64 || pdfBase64.length === 0) {
        throw new Error('PDF generation returned empty result');
      }
      
      console.log(`✅ PDF generated successfully for booking ${booking.id}`);
      console.log(`📊 PDF size: ${pdfBase64.length} characters (base64)`);
      console.log(`📊 PDF size in bytes: ${Math.round(pdfBase64.length * 0.75)} bytes (estimated)`);
      console.log(`📄 PDF preview (first 50 chars): ${pdfBase64.substring(0, 50)}...`);
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      console.error('PDF error name:', pdfError instanceof Error ? pdfError.name : 'Unknown');
      console.error('PDF error message:', pdfError instanceof Error ? pdfError.message : String(pdfError));
      console.error('PDF error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
      pdfBase64 = undefined; // Explicitly set to undefined
      // Continue with email even if PDF fails
    }

    const bookingIdShort = booking.id.split('_')[1] || booking.id;

    // Send email via Resend with PDF attachment
    // NOTE: Using onboarding@resend.dev for free tier (no domain verification needed)
    // To use your own domain (e.g., bookings@gosintra.com), verify it at https://resend.com/domains
    const emailPayload: any = {
      from: "Go Sintra <onboarding@resend.dev>",
      to: [booking.contactInfo.email],
      subject: `🎉 Your Go Sintra Booking Confirmed - ${formattedDate}`,
      html: htmlContent,
    };

    // Add PDF attachment if generated successfully
    if (pdfBase64) {
      emailPayload.attachments = [{
        filename: `GoSintra_Tickets_${bookingIdShort}.pdf`,
        content: pdfBase64,
      }];
      console.log(`📎 PDF attachment added to email payload`);
      console.log(`📎 Attachment filename: GoSintra_Tickets_${bookingIdShort}.pdf`);
      console.log(`📎 Attachment size: ${pdfBase64.length} characters (base64)`);
      console.log(`📧 Email payload with attachment ready - Total attachments: 1`);
    } else {
      console.warn(`⚠️  No PDF attachment - PDF generation failed or returned empty`);
      console.warn(`⚠️  Email will be sent WITHOUT PDF attachment`);
    }

    console.log(`📤 Sending email to ${booking.contactInfo.email}...`);
    console.log(`📤 Email has ${emailPayload.attachments ? emailPayload.attachments.length : 0} attachment(s)`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend API error:", result);
      
      // Check if it's the testing-only limitation
      if (result.message && result.message.includes("only send testing emails")) {
        console.error("⚠️  DOMAIN VERIFICATION REQUIRED");
        console.error("Current setup only allows test emails to:", result.message.match(/\(([^)]+)\)/)?.[1]);
        console.error("To send to customers, verify your domain at: https://resend.com/domains");
        return { 
          success: false, 
          error: "Domain verification required. See server logs for details.",
          requiresDomainVerification: true 
        };
      }
      
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log("Email sent successfully:", result);
    console.log(`📧 Booking confirmation email sent to ${booking.contactInfo.email} from onboarding@resend.dev`);
    if (pdfBase64) {
      console.log(`✅ Email included PDF attachment: GoSintra_Tickets_${bookingIdShort}.pdf`);
    } else {
      console.log(`⚠️  Email sent WITHOUT PDF attachment (PDF generation failed)`);
    }
    return { success: true, emailId: result.id, pdfAttached: !!pdfBase64 };
  } catch (error) {
    console.error("Error sending booking email:", error);
    return { success: false, error: String(error) };
  }
}

// HTML email template generator
function generateBookingConfirmationHTML(data: any): string {
  const {
    customerName,
    bookingId,
    formattedDate,
    passengers,
    totalPrice,
    dayPassCount,
    guidedTour,
    attractions
  } = data;

  const bookingIdShort = bookingId.split('_')[1] || bookingId;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Go Sintra Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fffbf7; color: #2d3436;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Booking Confirmed!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin-bottom: 20px; color: #2d3436;">Dear ${customerName},</p>
      
      <p>Thank you for choosing Go Sintra! We're excited to help you discover the magic of Sintra.</p>
      
      <!-- PDF Attachment Notice -->
      <div style="background-color: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0; color: #0050b3;"><strong>📎 Your Tickets Are Attached!</strong></p>
        <p style="margin: 8px 0 0 0; color: #0050b3; font-size: 14px;">We've attached a PDF file with all your QR code tickets. Save it to your phone or print it out. Each passenger needs their own QR code to board.</p>
      </div>
      
      <!-- Booking Details -->
      <div style="background-color: #fff4ed; border-left: 4px solid #D97843; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #0A4D5C;">📋 Booking Details</h2>
        <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f0e9e3;">
          <strong style="color: #6b7280;">Booking ID:</strong>
          <span style="color: #2d3436; font-weight: 500; float: right;">${bookingIdShort}</span>
        </div>
        <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f0e9e3;">
          <strong style="color: #6b7280;">Date:</strong>
          <span style="color: #2d3436; font-weight: 500; float: right;">${formattedDate}</span>
        </div>
        <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f0e9e3;">
          <strong style="color: #6b7280;">Operating Hours:</strong>
          <span style="color: #2d3436; font-weight: 500; float: right;">9:00 AM - 8:00 PM</span>
        </div>
        <div style="margin: 10px 0; padding: 8px 0;">
          <strong style="color: #6b7280;">Day Passes:</strong>
          <span style="color: #2d3436; font-weight: 500; float: right;">${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'}</span>
        </div>
      </div>

      <!-- Passengers List -->
      <div style="margin: 30px 0;">
        <h2 style="color: #0A4D5C; margin-bottom: 15px;">👥 Passengers</h2>
        ${passengers.map((passenger: any, index: number) => `
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; align-items: center; gap: 12px;">
            <span style="display: inline-block; background-color: #D97843; color: #ffffff; padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${passenger.type}</span>
            <span style="color: #0A4D5C; font-weight: 500; font-size: 16px;">${passenger.name}</span>
          </div>
        `).join('')}
      </div>

      <!-- Order Summary -->
      <div style="background-color: #fff4ed; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #0A4D5C; margin: 0 0 15px 0;">💰 Order Summary</h3>
        <div style="margin: 10px 0;">
          <span>Day Pass (${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'})</span>
          <span style="float: right;">€${totalPrice.toFixed(2)}</span>
        </div>
        <div style="border-top: 2px solid #D97843; padding-top: 15px; margin-top: 15px; font-size: 20px; font-weight: 700; color: #0A4D5C;">
          <span>Total Paid</span>
          <span style="float: right;">€${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <!-- Instructions -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #0A4D5C;">📱 How to Use Your Pass</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin: 8px 0; line-height: 1.6;"><strong>Show QR Code:</strong> Present your QR code to the driver when boarding any vehicle</li>
          <li style="margin: 8px 0; line-height: 1.6;"><strong>Unlimited Rides:</strong> Use your pass for unlimited hop-on/hop-off rides until 8:00 PM</li>
          <li style="margin: 8px 0; line-height: 1.6;"><strong>Regular Service:</strong> New vehicles depart every 10-15 minutes from all major attractions</li>
          <li style="margin: 8px 0; line-height: 1.6;"><strong>Small Vehicles:</strong> Guaranteed seating in groups of 2-6 passengers</li>
          <li style="margin: 8px 0; line-height: 1.6;"><strong>Flexible Schedule:</strong> Spend as much time as you want at each attraction</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us via WhatsApp or email.</p>
      
      <p style="margin-top: 20px;">Safe travels and enjoy Sintra!</p>
      <p style="margin: 5px 0;"><strong>The Go Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0A4D5C; color: #ffffff; padding: 30px; text-align: center;">
      <p style="margin: 5px 0; font-size: 14px;"><strong>Go Sintra</strong></p>
      <p style="margin: 5px 0; font-size: 14px;">Premium Hop-On/Hop-Off Service</p>
      <p style="margin-top: 15px; font-size: 14px;">
        📧 <a href="mailto:info@gosintra.com" style="color: #D97843; text-decoration: none;">info@gosintra.com</a> | 
        📱 WhatsApp: +351 932 967 279
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #f0e9e3;">
        Operating Daily: 9:00 AM - 8:00 PM | Sintra, Portugal
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Health check
app.get("/make-server-3bd0ade8/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Simple database check - test if we can query the table
app.get("/make-server-3bd0ade8/db-check", async (c) => {
  try {
    console.log("🔍 Testing database connection...");
    
    // Try to count rows
    const { count, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("*", { count: 'exact', head: true });
    
    if (error) {
      console.error("Database check failed:", error);
      return c.json({
        success: false,
        error: error.message,
        hint: "The kv_store_3bd0ade8 table may not exist or you don't have permission to access it",
        supabaseUrl: Deno.env.get("SUPABASE_URL"),
        hasServiceRole: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      }, 500);
    }
    
    console.log(`✅ Database check passed: ${count} rows found`);
    
    return c.json({
      success: true,
      message: "Database connection successful",
      rowCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Database check error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
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
      return c.json({
        success: false,
        error: `Database query failed: ${error.message}`,
        details: error,
        hint: "Make sure the kv_store_3bd0ade8 table exists in your Supabase database"
      }, 500);
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
    
    console.log(`✅ Database diagnostics complete: ${totalKeys} unique keys, ${totalRows} total rows`);
    
    if (hasDuplicates) {
      console.warn(`⚠️ Found ${duplicates.length} duplicate keys:`, duplicates);
    }
    
    return c.json({
      success: true,
      diagnostics: {
        totalKeys,
        totalRows,
        hasDuplicates,
        duplicates: hasDuplicates ? duplicates : [],
        keyCount: hasDuplicates ? Object.fromEntries(
          Object.entries(keyCount).filter(([_, count]) => count > 1)
        ) : {},
        note: "The 'duplicate' warning in Supabase is normal - it means upsert is updating existing keys rather than inserting duplicates. This is the expected behavior.",
        explanation: {
          whatIsUpsert: "Upsert = UPDATE if key exists, INSERT if it doesn't",
          whyWarning: "Supabase logs 'duplicate' when it updates instead of inserts",
          isThisBad: "No! This is the correct and expected behavior for a key-value store",
          whenToWorry: "Only if you see actual duplicate rows (totalRows > totalKeys)"
        }
      }
    });
  } catch (error) {
    console.error("❌ Error running diagnostics:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Diagnostics failed",
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
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
      return c.json({ success: true, message: "Database is empty, nothing to clean" });
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
    
    console.log(`🗑️ Deleted all rows, re-inserting ${Object.keys(uniqueData).length} unique records...`);
    
    // Re-insert unique records using kv.set (which uses upsert)
    let insertCount = 0;
    for (const [key, value] of Object.entries(uniqueData)) {
      await kv.set(key, value);
      insertCount++;
    }
    
    console.log(`✅ Database cleanup complete: ${insertCount} records restored`);
    
    return c.json({
      success: true,
      message: "Database cleaned successfully",
      recordsRestored: insertCount,
      note: "All duplicate rows removed, unique records preserved"
    });
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Cleanup failed"
    }, 500);
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
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ success: false, error: "Failed to fetch content" }, 500);
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
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set("website_content", contentToSave);
    console.log("✅ Content saved successfully to database");
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving content:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save content" 
    }, 500);
  }
});

// Get comprehensive website content
app.get("/make-server-3bd0ade8/comprehensive-content", async (c) => {
  try {
    console.log("📖 Fetching comprehensive content from database...");
    const content = await kv.get("comprehensive_content");
    
    if (content) {
      console.log("✅ Comprehensive content found in database");
      console.log("Comprehensive content keys:", Object.keys(content));
    } else {
      console.log("ℹ️ No comprehensive content found in database");
    }
    
    return c.json({ success: true, content });
  } catch (error) {
    console.error("❌ Error fetching comprehensive content:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ success: false, error: "Failed to fetch comprehensive content" }, 500);
  }
});

// Save comprehensive website content
app.post("/make-server-3bd0ade8/comprehensive-content", async (c) => {
  try {
    const body = await c.req.json();
    console.log("📝 Saving comprehensive content to database...");
    console.log("Comprehensive content keys:", Object.keys(body));
    
    const contentToSave = {
      ...body,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set("comprehensive_content", contentToSave);
    console.log("✅ Comprehensive content saved successfully to database");
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving comprehensive content:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save comprehensive content" 
    }, 500);
  }
});

// Get pricing configuration
app.get("/make-server-3bd0ade8/pricing", async (c) => {
  try {
    console.log("💰 Fetching pricing from database...");
    const pricing = await kv.get("pricing_config");
    
    if (pricing) {
      console.log("✅ Pricing found in database");
    } else {
      console.log("ℹ️ No pricing found in database, will use defaults");
    }
    
    return c.json({ success: true, pricing });
  } catch (error) {
    console.error("❌ Error fetching pricing:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ success: false, error: "Failed to fetch pricing" }, 500);
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
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save pricing" 
    }, 500);
  }
});

// Get availability for a specific date
app.get("/make-server-3bd0ade8/availability/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const availability = await kv.get(`availability_${date}`);
    
    // Return default availability if none set (50 seats per time slot)
    if (!availability) {
      const defaultSlots: any = {};
      const timeSlots = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
      timeSlots.forEach(slot => {
        defaultSlots[slot] = 50;
      });
      
      return c.json({ 
        success: true, 
        availability: defaultSlots
      });
    }
    
    return c.json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return c.json({ success: false, error: "Failed to fetch availability" }, 500);
  }
});

// Set availability for a specific date
app.post("/make-server-3bd0ade8/availability/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const body = await c.req.json();
    console.log(`💾 Saving availability for ${date}:`, body);
    await kv.set(`availability_${date}`, body);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving availability:", error);
    return c.json({ success: false, error: "Failed to save availability" }, 500);
  }
});

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
        if (entry && entry.key && typeof entry.key === 'string') {
          const date = entry.key.replace("availability_", "");
          availability[date] = entry.value;
        }
      });
    }
    
    console.log(`📊 Retrieved availability for ${Object.keys(availability).length} dates`);
    return c.json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching all availability:", error);
    return c.json({ success: false, error: "Failed to fetch availability" }, 500);
  }
});

// Create Stripe Payment Intent
app.post("/make-server-3bd0ade8/create-payment-intent", async (c) => {
  try {
    if (!stripe) {
      console.error("Stripe not initialized - STRIPE_SECRET_KEY not configured");
      return c.json({ 
        success: false, 
        error: "Payment processing not configured. Please contact support." 
      }, 500);
    }

    const body = await c.req.json();
    const { amount, currency = "eur", metadata = {} } = body;

    if (!amount || amount <= 0) {
      return c.json({ 
        success: false, 
        error: "Invalid amount" 
      }, 400);
    }

    console.log(`💳 Creating Stripe Payment Intent for €${amount}`);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        service: "Go Sintra Day Pass",
      },
    });

    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);

    return c.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create payment intent" 
    }, 500);
  }
});

// Verify Payment Intent
app.post("/make-server-3bd0ade8/verify-payment", async (c) => {
  try {
    if (!stripe) {
      return c.json({ 
        success: false, 
        error: "Payment processing not configured" 
      }, 500);
    }

    const body = await c.req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return c.json({ 
        success: false, 
        error: "Payment Intent ID required" 
      }, 400);
    }

    console.log(`🔍 Verifying payment intent: ${paymentIntentId}`);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      console.log(`✅ Payment verified successfully: ${paymentIntentId}`);
      return c.json({
        success: true,
        verified: true,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      });
    } else {
      console.log(`⚠️  Payment not completed: ${paymentIntent.status}`);
      return c.json({
        success: false,
        verified: false,
        status: paymentIntent.status,
        error: "Payment not completed"
      }, 400);
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to verify payment" 
    }, 500);
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
    const usedPrefixes = await kv.get("booking_used_prefixes") || [];
    
    // If no used prefixes tracked yet, check common ones
    if (usedPrefixes.length === 0) {
      // Check first few prefixes that likely have bookings
      const commonPrefixes = ["AA", "AB", "AC", "AD", "AE"];
      for (const prefix of commonPrefixes) {
        const prefixBookings = await kv.getByPrefix(`${prefix}-`);
        if (prefixBookings.length > 0) {
          letterBookings.push(...prefixBookings);
        }
      }
    } else {
      // Query only prefixes we know have bookings
      for (const prefix of usedPrefixes) {
        const prefixBookings = await kv.getByPrefix(`${prefix}-`);
        letterBookings.push(...prefixBookings);
      }
    }
    
    const allBookings = [...oldBookings, ...gsBookings, ...letterBookings];
    
    // Filter out any null or invalid bookings
    const validBookings = allBookings
      .map(b => b.value)
      .filter(booking => booking && booking.id && booking.selectedDate);
    
    console.log(`📊 Retrieved ${validBookings.length} valid bookings`);
    
    return c.json({ 
      success: true, 
      bookings: validBookings
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
});

// Get booking by ID and email (customer portal login)
app.post("/make-server-3bd0ade8/bookings/lookup", async (c) => {
  try {
    const body = await c.req.json();
    const { bookingId, email } = body;
    
    if (!bookingId || !email) {
      return c.json({ 
        success: false, 
        error: "Booking ID and email are required" 
      }, 400);
    }
    
    console.log(`🔍 Looking up booking: ${bookingId} for ${email}`);
    
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
      return c.json({ 
        success: false, 
        error: "Booking not found. Please check your booking ID." 
      }, 404);
    }
    
    // Verify email matches (case insensitive)
    const bookingEmail = booking.contactInfo?.email?.toLowerCase();
    const inputEmail = email.toLowerCase().trim();
    
    if (bookingEmail !== inputEmail) {
      console.log(`❌ Email mismatch for booking ${bookingId}`);
      return c.json({ 
        success: false, 
        error: "Email does not match our records. Please check and try again." 
      }, 401);
    }
    
    console.log(`✅ Booking found and verified: ${bookingId}`);
    
    // Return booking data (without sensitive info)
    return c.json({ 
      success: true, 
      booking: {
        ...booking,
        // Don't send payment intent ID to customer
        paymentIntentId: undefined
      }
    });
  } catch (error) {
    console.error("Error looking up booking:", error);
    return c.json({ 
      success: false, 
      error: "Failed to look up booking" 
    }, 500);
  }
});

// Create a new booking
app.post("/make-server-3bd0ade8/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIntentId, isTestBooking } = body;

    // Verify payment if Stripe is configured (skip for test bookings)
    if (stripe && paymentIntentId && !isTestBooking) {
      console.log(`🔐 Verifying payment before creating booking: ${paymentIntentId}`);
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== "succeeded") {
          console.error(`❌ Payment not successful: ${paymentIntent.status}`);
          return c.json({ 
            success: false, 
            error: "Payment verification failed. Please try again." 
          }, 400);
        }
        
        console.log(`✅ Payment verified: €${paymentIntent.amount / 100}`);
      } catch (error) {
        console.error("Payment verification error:", error);
        return c.json({ 
          success: false, 
          error: "Payment verification failed" 
        }, 400);
      }
    } else if (isTestBooking) {
      console.log(`🧪 Creating test booking - skipping payment verification`);
    }

    // Generate unique booking ID (format: AA-1234, AB-1234, etc.)
    const bookingId = await generateBookingId();
    
    // Check availability for the selected time slot
    const date = body.selectedDate;
    const timeSlot = body.timeSlot;
    const totalPassengers = body.passengers.length;
    
    // Get current availability for this date
    const currentAvailability = await kv.get(`availability_${date}`);
    
    // If no availability set, use defaults (50 per slot)
    const availabilitySlots = currentAvailability || {
      "9:00": 50,
      "10:00": 50,
      "11:00": 50,
      "12:00": 50,
      "13:00": 50,
      "14:00": 50,
      "15:00": 50,
      "16:00": 50
    };
    
    // Check if enough seats available
    const availableSeats = availabilitySlots[timeSlot] ?? 50;
    if (availableSeats < totalPassengers) {
      console.log(`❌ Not enough seats: Requested ${totalPassengers}, Available ${availableSeats}`);
      return c.json({ 
        success: false, 
        error: `Not enough seats available. Only ${availableSeats} seats left for this time slot.` 
      }, 400);
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
      paymentIntentId: body.paymentIntentId || null
    };
    
    console.log(`💾 Saving booking ${bookingId} with ${qrCodes.length} QR codes`);
    console.log(`📊 Booking data summary:`, {
      id: booking.id,
      passengers: booking.passengers.length,
      qrCodesCount: booking.qrCodes.length,
      hasQRCodes: booking.qrCodes.every((qr: string) => qr.startsWith('data:image'))
    });
    
    await kv.set(bookingId, booking);
    
    // Track this prefix as used (for efficient admin queries)
    const prefix = bookingId.split("-")[0];
    if (prefix && prefix.length === 2 && /^[A-Z]{2}$/.test(prefix)) {
      const usedPrefixes = await kv.get("booking_used_prefixes") || [];
      if (!usedPrefixes.includes(prefix)) {
        usedPrefixes.push(prefix);
        await kv.set("booking_used_prefixes", usedPrefixes);
        console.log(`📝 Tracking new prefix: ${prefix}`);
      }
    }
    
    // Update availability - decrement seats for the specific time slot
    availabilitySlots[timeSlot] = availableSeats - totalPassengers;
    await kv.set(`availability_${date}`, availabilitySlots);
    console.log(`✅ Updated availability for ${date} at ${timeSlot}: ${availableSeats} -> ${availabilitySlots[timeSlot]}`);
    
    // Send confirmation email with QR codes
    const emailResult = await sendBookingEmail(booking, qrCodes);
    
    if (!emailResult.success) {
      console.error("Failed to send email, but booking was created:", emailResult.error);
    }
    
    return c.json({ 
      success: true, 
      booking,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return c.json({ success: false, error: "Failed to create booking" }, 500);
  }
});

// Get booking by ID
app.get("/make-server-3bd0ade8/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const booking = await kv.get(id);
    
    if (!booking) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }
    
    return c.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return c.json({ success: false, error: "Failed to fetch booking" }, 500);
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
        message: "Invalid QR code format" 
      });
    }
    
    const booking = await kv.get(bookingId);
    
    if (!booking) {
      return c.json({ 
        success: false, 
        message: "Booking not found - Invalid QR code" 
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
    const checkIns = await kv.get(checkInsKey) || [];
    
    const passenger = booking.passengers[passengerIndex];
    
    return c.json({ 
      success: true, 
      booking: {
        bookingId: booking.id,
        customerName: booking.contactInfo.name,
        customerEmail: booking.contactInfo.email,
        passType: `${booking.passengers.length} Day ${booking.passengers.length === 1 ? 'Pass' : 'Passes'}`,
        numPasses: booking.passengers.length,
        passDate: booking.selectedDate,
        totalPrice: booking.totalPrice,
        guidedTour: booking.guidedTour || false,
        passengerName: passenger?.name || 'Unknown',
        passengerType: passenger?.type || 'adult',
        passengerIndex,
        checkIns: checkIns,
        alreadyCheckedIn,
        isExpired
      }
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return c.json({ success: false, message: "Failed to verify QR code" }, 500);
  }
});

// Check in passenger
app.post("/make-server-3bd0ade8/checkin", async (c) => {
  try {
    const { bookingId, passengerIndex, location } = await c.req.json();
    
    const booking = await kv.get(bookingId);
    
    if (!booking) {
      return c.json({ 
        success: false, 
        message: "Booking not found" 
      }, 404);
    }
    
    // Create check-in record for today
    const checkInKey = `checkin_${bookingId}_${passengerIndex || 0}_${booking.selectedDate}`;
    const checkInRecord = {
      bookingId,
      passengerIndex: passengerIndex || 0,
      timestamp: new Date().toISOString(),
      location: location || "Vehicle Pickup",
      date: booking.selectedDate
    };
    
    await kv.set(checkInKey, checkInRecord);
    
    // Add to check-ins history
    const checkInsKey = `checkins_${bookingId}_${passengerIndex || 0}`;
    const checkIns = await kv.get(checkInsKey) || [];
    checkIns.push(checkInRecord);
    await kv.set(checkInsKey, checkIns);
    
    console.log(`✅ Passenger checked in: ${booking.contactInfo.name} - ${checkInRecord.timestamp}`);
    
    return c.json({ 
      success: true,
      checkIn: checkInRecord,
      message: "Passenger checked in successfully"
    });
  } catch (error) {
    console.error("Error checking in passenger:", error);
    return c.json({ success: false, message: "Failed to check in passenger" }, 500);
  }
});

// Get check-ins for a specific passenger
app.get("/make-server-3bd0ade8/checkins/:bookingId/:passengerIndex", async (c) => {
  try {
    const bookingId = c.req.param("bookingId");
    const passengerIndex = c.req.param("passengerIndex");
    
    const checkInsKey = `checkins_${bookingId}_${passengerIndex}`;
    const checkIns = await kv.get(checkInsKey) || [];
    
    return c.json({ 
      success: true,
      checkIns: checkIns
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return c.json({ success: false, message: "Failed to fetch check-ins" }, 500);
  }
});

// Download booking PDF
app.get("/make-server-3bd0ade8/bookings/:id/pdf", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`📄 Generating PDF for booking: ${id}`);
    
    // Try with and without booking_ prefix
    let booking = await kv.get(id);
    if (!booking && !id.startsWith('booking_')) {
      booking = await kv.get(`booking_${id}`);
    }
    
    if (!booking) {
      console.error(`❌ Booking not found for ID: ${id}`);
      return c.json({ success: false, message: "Booking not found" }, 404);
    }

    console.log(`✅ Found booking: ${booking.id} with ${booking.passengers.length} passengers`);

    // Generate QR codes for all passengers
    const qrCodes = [];
    for (let i = 0; i < booking.passengers.length; i++) {
      const qrCode = await generateQRCode(booking.id, i);
      qrCodes.push(qrCode);
      console.log(`✅ Generated QR code ${i + 1}/${booking.passengers.length}`);
    }

    console.log(`🔄 Starting PDF generation...`);
    // Generate PDF
    const pdfBase64 = await generateBookingPDF(booking, qrCodes);
    
    console.log(`✅ PDF generated, converting to binary...`);
    // Convert base64 to binary
    const pdfBinary = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    
    const bookingIdShort = booking.id.split('_')[1] || booking.id;
    
    console.log(`📦 Sending PDF file: GoSintra_Tickets_${bookingIdShort}.pdf (${pdfBinary.length} bytes)`);
    
    return new Response(pdfBinary, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="GoSintra_Tickets_${bookingIdShort}.pdf"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ success: false, message: "Failed to generate PDF", error: String(error) }, 500);
  }
});

// Test PDF generation endpoint
app.get("/make-server-3bd0ade8/test-pdf", async (c) => {
  try {
    console.log('🧪 Testing PDF generation...');
    
    // Create a minimal test booking
    const testBooking = {
      id: 'booking_test123',
      selectedDate: new Date().toISOString(),
      contactInfo: {
        name: 'Test User',
        email: 'test@example.com'
      },
      passengers: [
        { name: 'Test Passenger 1', type: 'adult' }
      ],
      totalPrice: 25.00
    };
    
    // Generate a test QR code
    const testQRCode = await generateQRCode(testBooking.id, 0);
    console.log('✅ Test QR code generated');
    
    // Try to generate PDF
    const pdfBase64 = await generateBookingPDF(testBooking, [testQRCode]);
    
    if (!pdfBase64 || pdfBase64.length === 0) {
      return c.json({
        success: false,
        message: 'PDF generation returned empty result'
      }, 500);
    }
    
    console.log(`✅ Test PDF generated successfully - ${pdfBase64.length} chars`);
    
    return c.json({
      success: true,
      message: 'PDF generation working',
      pdfSize: pdfBase64.length,
      estimatedBytes: Math.round(pdfBase64.length * 0.75)
    });
  } catch (error) {
    console.error('❌ Test PDF generation failed:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
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
    await kv.set(`chat_conversation_${conversationId}`, conversation);
    
    // Initialize empty messages array
    await kv.set(`chat_messages_${conversationId}`, []);
    
    console.log(`💬 New chat conversation started: ${conversationId}`);
    
    return c.json({ 
      success: true, 
      conversationId,
      conversation
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    return c.json({ 
      success: false, 
      error: "Failed to start chat conversation" 
    }, 500);
  }
});

// Send message (customer or admin)
app.post("/make-server-3bd0ade8/chat/message", async (c) => {
  try {
    const body = await c.req.json();
    const { conversationId, sender, senderName, message } = body;
    
    if (!conversationId || !sender || !message) {
      return c.json({ 
        success: false, 
        error: "Missing required fields" 
      }, 400);
    }
    
    // Get existing messages
    const messages = await kv.get(`chat_messages_${conversationId}`) || [];
    
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
    const conversation = await kv.get(`chat_conversation_${conversationId}`);
    if (conversation) {
      conversation.lastMessageAt = new Date().toISOString();
      
      // Increment unread count if customer sent message
      if (sender === "customer") {
        conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
      }
      
      await kv.set(`chat_conversation_${conversationId}`, conversation);
    }
    
    console.log(`💬 Message sent in conversation ${conversationId} by ${sender}`);
    
    return c.json({ 
      success: true, 
      message: newMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json({ 
      success: false, 
      error: "Failed to send message" 
    }, 500);
  }
});

// Get messages for a conversation
app.get("/make-server-3bd0ade8/chat/:conversationId/messages", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    
    const messages = await kv.get(`chat_messages_${conversationId}`) || [];
    const conversation = await kv.get(`chat_conversation_${conversationId}`);
    
    return c.json({ 
      success: true, 
      messages,
      conversation
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch messages" 
    }, 500);
  }
});

// Get all conversations (admin)
app.get("/make-server-3bd0ade8/chat/conversations", async (c) => {
  try {
    // Query database for all conversation keys
    const { data, error } = await supabase
      .from("kv_store_3bd0ade8")
      .select("key, value")
      .like("key", "chat_conversation_%");
    
    if (error) {
      throw error;
    }
    
    const conversations = data ? data.map((entry: any) => entry.value) : [];
    
    // Sort by last message time (most recent first)
    conversations.sort((a: any, b: any) => {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    
    console.log(`💬 Retrieved ${conversations.length} chat conversations`);
    
    return c.json({ 
      success: true, 
      conversations 
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch conversations" 
    }, 500);
  }
});

// Mark conversation as read
app.post("/make-server-3bd0ade8/chat/:conversationId/mark-read", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    
    const conversation = await kv.get(`chat_conversation_${conversationId}`);
    if (conversation) {
      conversation.unreadByAdmin = 0;
      await kv.set(`chat_conversation_${conversationId}`, conversation);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    return c.json({ 
      success: false, 
      error: "Failed to mark as read" 
    }, 500);
  }
});

// Close conversation
app.post("/make-server-3bd0ade8/chat/:conversationId/close", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    
    const conversation = await kv.get(`chat_conversation_${conversationId}`);
    if (conversation) {
      conversation.status = "closed";
      await kv.set(`chat_conversation_${conversationId}`, conversation);
    }
    
    console.log(`💬 Conversation closed: ${conversationId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error closing conversation:", error);
    return c.json({ 
      success: false, 
      error: "Failed to close conversation" 
    }, 500);
  }
});

// ============================================================
// PICKUP REQUEST MANAGEMENT
// ============================================================

// Create a new pickup request
app.post("/make-server-3bd0ade8/pickup/request", async (c) => {
  try {
    const body = await c.req.json();
    const { groupSize, location, destination, customerName, customerEmail } = body;

    if (!groupSize || !location) {
      return c.json({ 
        success: false, 
        error: "Group size and location are required" 
      }, 400);
    }

    // Generate pickup request ID
    const timestamp = Date.now();
    const requestId = `PICKUP_${timestamp}`;

    const pickupRequest = {
      id: requestId,
      groupSize: parseInt(groupSize),
      location,
      destination: destination || null,
      customerName: customerName || "Guest",
      customerEmail: customerEmail || null,
      status: "pending", // pending, assigned, completed, cancelled
      createdAt: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutes
      vehiclesNeeded: Math.ceil(parseInt(groupSize) / 6),
    };

    // Store the pickup request
    await kv.set(requestId, pickupRequest);

    // Also add to active requests list for easy querying
    const activeRequests = await kv.get("active_pickup_requests") || [];
    activeRequests.push(requestId);
    await kv.set("active_pickup_requests", activeRequests);

    console.log(`🚗 Pickup request created: ${requestId} - ${groupSize} passengers at ${location}`);

    return c.json({
      success: true,
      request: pickupRequest,
    });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create pickup request" 
    }, 500);
  }
});

// Get all active pickup requests (for operations portal)
app.get("/make-server-3bd0ade8/pickup/active", async (c) => {
  try {
    const activeRequestIds = await kv.get("active_pickup_requests") || [];
    
    const requests = [];
    for (const requestId of activeRequestIds) {
      const request = await kv.get(requestId);
      if (request && request.status === "pending") {
        requests.push(request);
      }
    }

    // Sort by creation time (newest first)
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("Error fetching active pickup requests:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch pickup requests" 
    }, 500);
  }
});

// Update pickup request status
app.post("/make-server-3bd0ade8/pickup/:requestId/status", async (c) => {
  try {
    const requestId = c.req.param("requestId");
    const body = await c.req.json();
    const { status, driverName, vehicleInfo } = body;

    if (!status) {
      return c.json({ 
        success: false, 
        error: "Status is required" 
      }, 400);
    }

    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ 
        success: false, 
        error: "Pickup request not found" 
      }, 404);
    }

    // Update the request
    request.status = status;
    request.updatedAt = new Date().toISOString();
    if (driverName) request.driverName = driverName;
    if (vehicleInfo) request.vehicleInfo = vehicleInfo;

    await kv.set(requestId, request);

    // If completed or cancelled, remove from active list
    if (status === "completed" || status === "cancelled") {
      const activeRequests = await kv.get("active_pickup_requests") || [];
      const updatedRequests = activeRequests.filter((id: string) => id !== requestId);
      await kv.set("active_pickup_requests", updatedRequests);
    }

    console.log(`🚗 Pickup request ${requestId} status updated to: ${status}`);

    return c.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Error updating pickup request:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update pickup request" 
    }, 500);
  }
});

// Get pickup request by ID
app.get("/make-server-3bd0ade8/pickup/:requestId", async (c) => {
  try {
    const requestId = c.req.param("requestId");
    const request = await kv.get(requestId);

    if (!request) {
      return c.json({ 
        success: false, 
        error: "Pickup request not found" 
      }, 404);
    }

    return c.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Error fetching pickup request:", error);
    return c.json({ 
      success: false, 
      error: "Failed to fetch pickup request" 
    }, 500);
  }
});

// ============================================================
// PWA ICON MANAGEMENT
// ============================================================

// Store PWA icons (from the installer)
app.post("/make-server-3bd0ade8/pwa-icons/deploy", async (c) => {
  try {
    const body = await c.req.json();
    const { icons } = body;
    
    if (!icons || !Array.isArray(icons) || icons.length === 0) {
      console.error('❌ Invalid icons data received');
      return c.json({ 
        success: false, 
        error: "Invalid icons data. Expected array of icons." 
      }, 400);
    }
    
    console.log(`📱 Deploying ${icons.length} PWA icons...`);
    
    // Store each icon in KV store
    const deployedIcons: any[] = [];
    const errors: string[] = [];
    
    for (const icon of icons) {
      const { filename, size, dataUrl } = icon;
      
      if (!filename || !size || !dataUrl) {
        const error = `Invalid icon data: filename=${filename}, size=${size}, dataUrl=${dataUrl ? 'present' : 'missing'}`;
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
      if (!dataUrl.startsWith('data:image/png;base64,')) {
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
        deployedAt: new Date().toISOString()
      });
      
      deployedIcons.push({
        size,
        filename,
        url: `/make-server-3bd0ade8/pwa-icons/${size}.png`
      });
      
      console.log(`✅ Deployed icon: ${filename} (${size}) → ${key}`);
    }
    
    // Store deployment metadata
    await kv.set("pwa_icons_deployed", {
      icons: deployedIcons,
      deployedAt: new Date().toISOString(),
      count: deployedIcons.length
    });
    
    console.log(`🎉 Successfully deployed ${deployedIcons.length} PWA icons`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Deployment completed with ${errors.length} errors:`, errors);
    }
    
    return c.json({ 
      success: true, 
      deployed: deployedIcons,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deployed ${deployedIcons.length} icons${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
    });
  } catch (error) {
    console.error("❌ Error deploying PWA icons:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to deploy PWA icons" 
    }, 500);
  }
});

// Serve PWA icon by size (e.g., /pwa-icons/192x192.png)
app.get("/make-server-3bd0ade8/pwa-icons/:size.png", async (c) => {
  try {
    const size = c.req.param("size");
    
    // Validate size parameter - SILENTLY reject invalid requests from cache
    if (!size || size === 'undefined' || size === 'null') {
      // Don't log error - this is likely a cached request being blocked
      console.log(`🚫 Silently blocked invalid icon request: ${size} (likely from browser cache)`);
      return c.text("Invalid icon size", 400);
    }
    
    const key = `pwa_icon_${size}`;
    console.log(`🔍 Looking for icon: ${key}`);
    
    const iconData = await kv.get(key);
    
    if (!iconData || !iconData.dataUrl) {
      console.error(`❌ Icon not found in KV store: ${size} (key: ${key})`);
      return c.text("Icon not found", 404);
    }
    
    // Extract base64 data from data URL
    const base64Data = iconData.dataUrl.replace(/^data:image\/png;base64,/, '');
    
    if (!base64Data) {
      console.error(`❌ Invalid icon data format for: ${size}`);
      return c.text("Invalid icon data", 500);
    }
    
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    console.log(`✅ Serving icon: ${size} (${imageBytes.length} bytes)`);
    
    return new Response(imageBytes, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': imageBytes.length.toString()
      }
    });
  } catch (error) {
    console.error("❌ Error serving PWA icon:", error);
    return c.text("Error serving icon", 500);
  }
});

// Get current PWA icons deployment status
app.get("/make-server-3bd0ade8/pwa-icons/status", async (c) => {
  try {
    const deployment = await kv.get("pwa_icons_deployed");
    
    if (!deployment) {
      return c.json({
        success: true,
        deployed: false,
        message: "No PWA icons deployed yet"
      });
    }
    
    // Filter and validate icons before returning (remove any corrupted data)
    const icons = deployment.icons || [];
    const validIcons = icons.filter((icon: any) => {
      if (!icon || !icon.size || !icon.url) {
        console.warn(`⚠️ Skipping invalid icon in status: size=${icon?.size}, url=${icon?.url}`);
        return false;
      }
      if (icon.size === 'undefined' || icon.size === 'null' || typeof icon.size !== 'string') {
        console.warn(`⚠️ Skipping icon with invalid size in status: ${icon.size}`);
        return false;
      }
      if (icon.url.includes('undefined') || icon.url.includes('null')) {
        console.warn(`⚠️ Skipping icon with invalid URL in status: ${icon.url}`);
        return false;
      }
      return true;
    });
    
    // Log if we filtered out any icons
    if (validIcons.length < icons.length) {
      console.log(`🧹 Filtered out ${icons.length - validIcons.length} invalid icons from status response`);
    }
    
    return c.json({
      success: true,
      deployed: validIcons.length > 0,
      icons: validIcons,
      deployedAt: deployment.deployedAt,
      count: validIcons.length
    });
  } catch (error) {
    console.error("❌ Error checking PWA icons status:", error);
    return c.json({ 
      success: false, 
      error: "Failed to check deployment status" 
    }, 500);
  }
});

// Generate and serve dynamic manifest.json
app.get("/make-server-3bd0ade8/pwa-icons/manifest.json", async (c) => {
  try {
    const deployment = await kv.get("pwa_icons_deployed");
    const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    
    // Generate manifest with deployed icons or defaults
    const icons = deployment?.icons || [];
    
    // Filter and validate icons before creating manifest
    const validIcons = icons.filter((icon: any) => {
      if (!icon || typeof icon !== 'object') {
        console.warn(`⚠️ Skipping invalid icon in manifest: not an object`, icon);
        return false;
      }
      if (!icon.size || !icon.url) {
        console.warn(`⚠️ Skipping invalid icon in manifest: size=${icon.size}, url=${icon.url}`);
        return false;
      }
      if (typeof icon.size !== 'string' || typeof icon.url !== 'string') {
        console.warn(`⚠️ Skipping icon with non-string properties: size type=${typeof icon.size}, url type=${typeof icon.url}`);
        return false;
      }
      if (icon.size === 'undefined' || icon.size === 'null') {
        console.warn(`⚠️ Skipping icon with invalid size string: ${icon.size}`);
        return false;
      }
      if (icon.url.includes('undefined') || icon.url.includes('null')) {
        console.warn(`⚠️ Skipping icon with invalid URL: ${icon.url}`);
        return false;
      }
      return true;
    });
    
    // Log filtering results
    if (validIcons.length < icons.length) {
      console.log(`🧹 Manifest: Filtered out ${icons.length - validIcons.length} invalid icons (${validIcons.length} valid)`);
    } else if (validIcons.length > 0) {
      console.log(`✅ Manifest: All ${validIcons.length} icons are valid`);
    }
    
    const manifestIcons = validIcons.map((icon: any) => {
      const src = `${baseUrl}${icon.url}`;
      
      // Final sanity check before including in manifest
      if (src.includes('undefined') || src.includes('null')) {
        console.error(`🚨 CRITICAL: Manifest icon src contains undefined: ${src}`);
        return null;
      }
      
      return {
        src,
        sizes: icon.size,
        type: "image/png",
        purpose: "any maskable"
      };
    }).filter(Boolean); // Remove any null entries
    
    const manifest = {
      name: "Go Sintra - Hop-On/Hop-Off Day Pass",
      short_name: "Go Sintra",
      description: "Premium hop-on/hop-off day pass service in Sintra, Portugal. Unlimited rides between major attractions with guaranteed seating.",
      start_url: "/",
      display: "standalone",
      background_color: "#fffbf7",
      theme_color: "#0A4D5C",
      orientation: "any",
      icons: manifestIcons.length > 0 ? manifestIcons : [
        {
          src: "/icon-72x72.png",
          sizes: "72x72",
          type: "image/png"
        },
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      categories: ["travel", "transportation", "tourism"],
      screenshots: []
    };
    
    return c.json(manifest);
  } catch (error) {
    console.error("❌ Error generating manifest:", error);
    return c.json({ 
      error: "Failed to generate manifest" 
    }, 500);
  }
});

Deno.serve(app.fetch);