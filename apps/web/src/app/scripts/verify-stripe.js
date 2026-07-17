// Simple script to verify Stripe keys are in test mode
// Run with: node scripts/verify-stripe.js

const testPublishableKey = "pk_test_51SHXlZJVoVAJealRtS3M6i53Jz8uas7LUwsqs5lAdlLG64mxzYu8FCSwIjSdmY4GAc7XUyH6muXtVWdSSNg6l8LB00APHphxAH";
const testSecretKey = "sk_test_51SHXlZJVoVAJealRFRyHKeVmiVxMwaqvQBNO4BesEz4K2OKVD2OBaQFrd46TLTGtDbVJ7jZmk7TeSAmFugurxDkV00zzUFKm8z";

console.log("🔐 Stripe Test Mode Keys");
console.log("=" .repeat(80));
console.log("");
console.log("📝 Publishable Key (pk_test_...):");
console.log(testPublishableKey);
console.log("");
console.log("🔒 Secret Key (sk_test_...):");
console.log(testSecretKey);
console.log("");
console.log("=" .repeat(80));
console.log("");
console.log("✅ CHECKLIST:");
console.log("");
console.log("1. Go to Supabase Dashboard:");
console.log("   https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions");
console.log("");
console.log("2. Update these environment variables:");
console.log("   - STRIPE_PUBLISHABLE_KEY (copy from above)");
console.log("   - STRIPE_SECRET_KEY (copy from above)");
console.log("");
console.log("3. Verify both keys start with 'test_' not 'live_'");
console.log("");
console.log("4. Test payment with card: 4242 4242 4242 4242");
console.log("");
console.log("5. Check test payments at:");
console.log("   https://dashboard.stripe.com/test/payments");
console.log("");
console.log("=" .repeat(80));

// Check if keys are valid format
const isValidPublishableKey = testPublishableKey.startsWith('pk_test_') && testPublishableKey.length > 50;
const isValidSecretKey = testSecretKey.startsWith('sk_test_') && testSecretKey.length > 50;

if (isValidPublishableKey && isValidSecretKey) {
  console.log("✅ Keys appear to be in correct TEST MODE format");
} else {
  console.log("❌ Warning: Keys may not be in correct format");
  if (!isValidPublishableKey) {
    console.log("   - Publishable key should start with 'pk_test_'");
  }
  if (!isValidSecretKey) {
    console.log("   - Secret key should start with 'sk_test_'");
  }
}

console.log("");
