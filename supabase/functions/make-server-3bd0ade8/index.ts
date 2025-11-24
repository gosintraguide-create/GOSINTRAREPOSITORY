import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
// --- FIXES APPLIED HERE: Changed .tsx to .ts ---
import * as kv from "./kv_store.ts";
import QRCode from "npm:qrcode@1.5.4";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import Stripe from "npm:stripe@17.3.1";
import { generateBookingConfirmationHTML } from "./email_template.ts";
import { cleanupDatabase, removeLegacyBranding, cleanupOldAvailability } from "./cleanup.ts";
// -----------------------------------------------

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

// ... (Keep all other existing functions here: getNextAvailablePrefix, generateBookingId, etc.) ...
// Note: For brevity, I am not pasting the helper functions that DID NOT change. 
// The key change is below in the /checkin endpoint.

// --- PASTE THE REST OF THE FILE FROM THE AI CODE HERE, BUT ENSURE IMPORTS AT TOP ARE .ts ---
// Below is the specific CHECKIN endpoint logic that changed:

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

    // Check if this is an update to an existing check-in
    const checkInKey = `checkin_${bookingId}_${passengerIndex || 0}_${booking.selectedDate}`;
    const existingCheckIn = await kv.get(checkInKey);
    
    // Create check-in record for today
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

    // Add to check-ins history
    const checkInsKey = `checkins_${bookingId}_${passengerIndex || 0}`;
    const checkIns = (await kv.get(checkInsKey)) || [];
    
    if (existingCheckIn) {
      // Update the last entry with new destination
      checkIns[checkIns.length - 1] = checkInRecord;
      console.log(
        `🔄 Updated destination for ${booking.contactInfo.name} to ${destination}`,
      );
    } else {
      // New check-in
      checkIns.push(checkInRecord);
      console.log(
        `✅ Passenger checked in: ${booking.contactInfo.name} - ${checkInRecord.timestamp} - ${destination}`,
      );
    }
    
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
      customerName: booking.contactInfo.name,
      isUpdate: !!existingCheckIn,
    });
    await kv.set(destLogKey, destLog);

    return c.json({
      success: true,
      checkIn: checkInRecord,
      message: existingCheckIn 
        ? `Destination updated to ${destination}` 
        : "Passenger checked in successfully",
      isUpdate: !!existingCheckIn,
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

// ... (Include all other routes: drivers, chat, etc. from the AI code) ...

Deno.serve(app.fetch);