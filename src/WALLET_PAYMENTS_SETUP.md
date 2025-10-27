# Apple Pay & Google Pay Setup Guide

## Overview
Your Go Sintra booking system now supports Apple Pay and Google Pay! However, these wallet payment methods require additional configuration in your Stripe Dashboard to be enabled for customers.

## Current Status
✅ **Code Configuration**: Complete
- Payment intents configured with `automatic_payment_methods`
- PaymentElement configured to prioritize wallet payments
- Server-side ready for wallet transactions

⚠️ **Stripe Dashboard Setup**: Required (follow steps below)

## How It Works
When properly configured:
- **Apple Pay** will automatically appear for Safari users on iOS/macOS devices with Apple Pay set up
- **Google Pay** will automatically appear for Chrome users with Google Pay configured
- Users see wallet buttons at the top of the payment form for quick checkout
- Falls back to card payment for all other users

## Setup Instructions

### Step 1: Enable Payment Methods in Stripe
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Payment methods**
3. Find "Wallets" section
4. Enable **Apple Pay** and **Google Pay**
5. Click **Save changes**

### Step 2: Verify Your Domain for Apple Pay
Apple Pay requires domain verification for security:

1. In Stripe Dashboard, go to **Settings → Payment methods → Apple Pay**
2. Click **"Add domain"**
3. Enter your production domain (e.g., `go-sintra.vercel.app` or your custom domain)
4. Stripe will provide a verification file
5. Upload the verification file to your website (Vercel handles this automatically if using their hosting)
6. Click **"Verify domain"**

**Note**: For local testing, Apple Pay works without verification on `localhost`

### Step 3: Test the Integration

#### On Safari (Apple Pay):
1. Open your booking page on Safari (iOS or macOS)
2. Ensure you have a card saved in Apple Wallet
3. Start a booking and go to payment
4. You should see an "Apple Pay" button above the card form
5. Test a booking using Apple Pay

#### On Chrome (Google Pay):
1. Open your booking page on Chrome
2. Ensure you're signed into your Google account with payment methods saved
3. Start a booking and go to payment  
4. You should see a "Google Pay" button
5. Test a booking using Google Pay

### Step 4: Monitor in Stripe Dashboard
After enabling:
- Go to **Payments** in Stripe Dashboard
- Wallet payments will show the payment method icon (Apple Pay or Google Pay)
- Revenue appears the same as card payments

## Troubleshooting

### "Wallet buttons don't appear"
**Possible causes:**
1. Payment methods not enabled in Stripe Dashboard → Go to Settings → Payment methods
2. Domain not verified for Apple Pay → Complete Step 2 above
3. User doesn't have wallet set up → Only users with configured wallets see the buttons
4. Wrong browser → Apple Pay requires Safari; Google Pay works best in Chrome

### "Payment fails with wallet"
**Possible causes:**
1. Test mode mismatch → Ensure Stripe keys (test/live) match environment
2. Amount too low/high → Some wallets have limits
3. Currency issues → Ensure EUR is supported

### "Domain verification fails"
**For Vercel hosting:**
- Vercel may auto-handle Apple Pay domain verification
- Check Vercel dashboard for domain settings
- Ensure production domain is added to Stripe

**For custom domains:**
- Follow Stripe's provided verification steps exactly
- File must be accessible at: `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`

## Benefits of Wallet Payments

### For Customers:
- ✅ Faster checkout (1-click payment)
- ✅ No need to enter card details
- ✅ Enhanced security (biometric authentication)
- ✅ Better mobile experience

### For Your Business:
- ✅ Higher conversion rates (less cart abandonment)
- ✅ Reduced fraud (wallet authentication)
- ✅ Better user experience
- ✅ Modern payment options

## Payment Method Fees
Stripe fees are the same for wallet payments as card payments:
- **Standard rate**: 1.4% + €0.25 per transaction (EEA cards)
- No additional fees for Apple Pay or Google Pay

## Support
- [Stripe Apple Pay Documentation](https://stripe.com/docs/apple-pay)
- [Stripe Google Pay Documentation](https://stripe.com/docs/google-pay)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Admin Panel Reminder
A blue information box in the Admin Panel → Pricing tab provides quick access to these setup instructions.

---

**Last Updated**: October 27, 2025
**Status**: Wallet payment code integration complete ✅ | Dashboard setup required ⚠️
