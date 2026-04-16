/**
 * Database Cleanup Utility
 * Run this to clean up old, unnecessary data from the KV store
 */

import * as kv from "./kv_store.ts";

export async function cleanupDatabase() {
  console.log("🧹 Starting database cleanup...");
  
  const results = {
    removed: [] as string[],
    kept: [] as string[],
    errors: [] as string[],
  };

  try {
    // Get all keys from database
    const allKeys = await kv.getByPrefix("");
    console.log(`📊 Found ${allKeys.length} total keys in database`);

    // Keys to keep (essential data)
    const keepPatterns = [
      "^website_content$",          // Site content
      "^pricing_config$",            // Pricing configuration
      "^db_initialized$",            // Database init flag
      "^booking_current_prefix$",    // Current booking prefix
      "^booking_used_prefixes$",     // Used booking prefixes
      "^HOP-[A-Z]{2}\\d{4}$",        // Booking IDs (e.g., HOP-AB1234)
      "^availability_\\d{4}-\\d{2}-\\d{2}$", // Availability dates
      "^stripe_",                    // Stripe payment data
      "^pwa_icons_deployed$",        // PWA icons status
      "^pwa_icon_",                  // PWA icon files
    ];

    // Keys to remove (old/unnecessary data)
    const removePatterns = [
      "^comprehensive_content$",     // Old content structure
      "^checkin_",                   // Old check-in records (if you're not using driver features)
      "^checkins_",                  // Old check-ins history
      "^destination_",               // Old destination tracking
      "^destination_log_",           // Old destination logs
      "^analytics_",                 // Old analytics data (use GA4 instead)
    ];

    for (const key of allKeys) {
      // Check if it should be kept
      const shouldKeep = keepPatterns.some(pattern => 
        new RegExp(pattern).test(key)
      );

      // Check if it should be removed
      const shouldRemove = removePatterns.some(pattern =>
        new RegExp(pattern).test(key)
      );

      if (shouldRemove && !shouldKeep) {
        try {
          await kv.del(key);
          results.removed.push(key);
          console.log(`🗑️  Removed: ${key}`);
        } catch (error) {
          results.errors.push(`${key}: ${error}`);
          console.error(`❌ Error removing ${key}:`, error);
        }
      } else {
        results.kept.push(key);
        console.log(`✅ Kept: ${key}`);
      }
    }

    console.log("\n📊 Cleanup Summary:");
    console.log(`✅ Kept: ${results.kept.length} keys`);
    console.log(`🗑️  Removed: ${results.removed.length} keys`);
    console.log(`❌ Errors: ${results.errors.length}`);

    return results;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

/**
 * Remove old branding data
 */
export async function removeLegacyBranding() {
  console.log("🧹 Removing legacy Go Sintra branding...");
  
  try {
    const content = await kv.get("website_content");
    
    if (content) {
      // Check if it has old branding
      if (
        content.company?.email?.includes("gosintra.com") ||
        content.company?.name?.includes("Go Sintra") ||
        content.seo?.home?.title?.includes("Go Sintra")
      ) {
        console.log("🔄 Found old branding, clearing...");
        await kv.del("website_content");
        console.log("✅ Legacy branding removed");
        return { removed: true };
      } else {
        console.log("✅ No legacy branding found");
        return { removed: false };
      }
    }
    
    console.log("ℹ️  No content found in database");
    return { removed: false };
  } catch (error) {
    console.error("❌ Failed to remove legacy branding:", error);
    throw error;
  }
}

/**
 * Remove old availability data (older than 30 days)
 */
export async function cleanupOldAvailability() {
  console.log("🧹 Cleaning up old availability data...");
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const allKeys = await kv.getByPrefix("availability_");
    let removed = 0;
    
    for (const key of allKeys) {
      // Extract date from key (format: availability_YYYY-MM-DD)
      const dateStr = key.replace("availability_", "");
      const date = new Date(dateStr);
      
      if (date < thirtyDaysAgo) {
        await kv.del(key);
        removed++;
        console.log(`🗑️  Removed old availability: ${key}`);
      }
    }
    
    console.log(`✅ Removed ${removed} old availability records`);
    return { removed };
  } catch (error) {
    console.error("❌ Failed to cleanup old availability:", error);
    throw error;
  }
}
