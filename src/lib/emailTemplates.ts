// Email templates for booking confirmations
//
// NOTE: By default, emails are sent from "Hop On Sintra <onboarding@resend.dev>"
// To use your own domain (e.g., bookings@hoponsintra.com):
// 1. Verify your domain at https://resend.com/domains
// 2. Update the 'from' address in /supabase/functions/server/index.tsx

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  selectedDate: string;
  passengers: Array<{
    name: string;
    type: string;
    qrCode: string; // Base64 data URL
  }>;
  totalPrice: number;
  dayPassCount: number;
  guidedTour?: {
    type: string;
    price: number;
  };
  attractions?: Array<{
    name: string;
    tickets: number;
    price: number;
  }>;
}

/**
 * Generates HTML email for booking confirmation
 */
export function generateBookingConfirmationEmail(data: BookingEmailData): string {
  const {
    customerName,
    bookingId,
    selectedDate,
    passengers,
    totalPrice,
    dayPassCount,
    guidedTour,
    attractions
  } = data;

  // Format date nicely
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Go Sintra Booking Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fffbf7;
      color: #2d3436;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .ticket-page {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .ticket-page:last-child {
      page-break-after: auto;
    }
    @media print {
      .ticket-page {
        page-break-after: always;
        min-height: 100vh;
      }
      .ticket-page:last-child {
        page-break-after: auto;
      }
    }
    .header {
      background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%);
      padding: 40px 20px;
      text-align: center;
      border-bottom: 4px solid #D97843;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
    }
    .header .tagline {
      margin: 10px 0 0 0;
      color: #f0e9e3;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #2d3436;
    }
    .booking-info {
      background-color: #fff4ed;
      border-left: 4px solid #D97843;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .booking-info h2 {
      margin: 0 0 15px 0;
      font-size: 20px;
      color: #0A4D5C;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #f0e9e3;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #2d3436;
      font-weight: 500;
    }
    .qr-section {
      margin: 30px 0;
    }
    .instructions {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .instructions h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #0A4D5C;
    }
    .instructions ul {
      margin: 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
      line-height: 1.6;
    }
    .summary {
      background-color: #fff4ed;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .summary-total {
      border-top: 2px solid #D97843;
      padding-top: 15px;
      margin-top: 15px;
      font-size: 20px;
      font-weight: 700;
      color: #0A4D5C;
    }
    .footer {
      background: linear-gradient(135deg, #0A4D5C 0%, #073844 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
      border-top: 4px solid #D97843;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #D97843;
      text-decoration: none;
      font-weight: 600;
    }
    .manage-booking {
      background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      border: 3px solid #D97843;
    }
    .manage-booking h3 {
      margin: 0 0 10px 0;
      font-size: 22px;
      color: #ffffff;
    }
    .manage-booking p {
      margin: 10px 0 20px 0;
      color: #f0e9e3;
      line-height: 1.6;
    }
    .manage-booking-btn {
      display: inline-block;
      background-color: #D97843;
      color: #ffffff;
      padding: 14px 35px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin: 10px 0;
      transition: all 0.3s ease;
    }
    .manage-booking-benefits {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    .manage-booking-benefits ul {
      list-style: none;
      padding: 0;
      margin: 10px 0 0 0;
      color: #f0e9e3;
      font-size: 14px;
    }
    .manage-booking-benefits li {
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    .manage-booking-benefits li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #D97843;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${passengers.map((passenger, index) => `
  <div class="container ticket-page">
    <!-- Header -->
    <div class="header">
      <h1>🎉 ${index === 0 ? 'Booking Confirmed!' : 'Your Day Pass'}</h1>
      <p class="tagline">Your adventure through Sintra awaits</p>
    </div>

    <!-- Content -->
    <div class="content">
      ${index === 0 ? `
      <p class="greeting">Dear ${customerName},</p>
      
      <p>Thank you for choosing Go Sintra! Your day pass for ${formattedDate} is ready.</p>
      ` : `
      <p class="greeting">Day Pass ${index + 1} of ${passengers.length}</p>
      `}

      <!-- Ticket Card -->
      <div class="qr-section">
        <h2 style="color: #0A4D5C; margin-bottom: 15px;">🎫 Your Day Pass</h2>
        <p style="margin-bottom: 20px; color: #6b7280;">Show this QR code to board any vehicle</p>
        
        <div style="margin: 30px 0;">
          <!-- Modern Ticket Container -->
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(10, 77, 92, 0.3);">
            <!-- Header -->
            <tr>
              <td style="padding: 25px 30px; text-align: center; border-bottom: 3px solid #D97843;">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                  <tr>
                    <td style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
                      GO SINTRA
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #D97843; font-size: 14px; font-weight: 600; padding-top: 5px; letter-spacing: 0.5px;">
                      DAY PASS
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- QR Code Section - Prominent -->
            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
                <div style="background-color: #ffffff; padding: 15px; display: inline-block; border-radius: 12px; border: 3px solid #0A4D5C;">
                  <img src="${passenger.qrCode}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
                </div>
                <div style="margin-top: 15px; color: #0A4D5C; font-size: 16px; font-weight: 600;">
                  Scan to Board
                </div>
              </td>
            </tr>
            
            <!-- Passenger Info Section -->
            <tr>
              <td style="background-color: #fff4ed; padding: 30px;">
                <!-- Passenger Name -->
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20px;">
                  <tr>
                    <td style="text-align: center;">
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        Passenger Name
                      </div>
                      <div style="font-size: 22px; color: #0A4D5C; font-weight: 700; letter-spacing: 0.5px;">
                        ${passenger.name}
                      </div>
                    </td>
                  </tr>
                </table>
                
                <!-- Details Grid -->
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-top: 2px solid #D97843; padding-top: 20px;">
                  <tr>
                    <td style="width: 50%; padding: 0 10px 15px 0; vertical-align: top;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Date
                      </div>
                      <div style="font-size: 15px; color: #2d3436; font-weight: 600;">
                        ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td style="width: 50%; padding: 0 0 15px 10px; vertical-align: top;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Type
                      </div>
                      <div style="font-size: 15px; color: #2d3436; font-weight: 600;">
                        ${passenger.type}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding: 0 10px 0 0; vertical-align: top;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Valid Hours
                      </div>
                      <div style="font-size: 15px; color: #2d3436; font-weight: 600;">
                        9:00 AM - 8:00 PM
                      </div>
                    </td>
                    <td style="width: 50%; padding: 0 0 0 10px; vertical-align: top;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Booking ID
                      </div>
                      <div style="font-size: 13px; color: #2d3436; font-weight: 600; font-family: monospace;">
                        ${bookingId.split('_')[1]}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background: linear-gradient(135deg, #0A4D5C 0%, #073844 100%); padding: 20px 30px; text-align: center;">
                <div style="color: #f0e9e3; font-size: 13px; margin-bottom: 5px;">
                  Unlimited Rides • Professional Guides
                </div>
                <div style="color: #D97843; font-size: 12px; font-weight: 600;">
                  Sintra, Portugal
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      ${index === 0 ? `
      <!-- Manage Booking Section -->
      <div class="manage-booking">
        <h3>🎯 Manage Your Booking</h3>
        <p>Request pickups, get route tips, and access exclusive benefits</p>
        <a href="https://hoponsintra.com/manage-booking?id=${bookingId}" class="manage-booking-btn">
          Manage My Booking →
        </a>
      </div>
      ` : ''}

      <!-- Instructions -->
      <div class="instructions">
        <h3>📱 How It Works</h3>
        <ul>
          <li><strong>Show Your QR Code</strong> to board at any stop</li>
          <li><strong>Unlimited Rides</strong> from 9 AM to 7 PM with professional guides</li>
          <li><strong>Vehicles Every 30 Minutes</strong> at all major attractions</li>
        </ul>
      </div>

      ${index === 0 ? `
      <!-- Order Summary (only on first page) -->
      <div class="summary">
        <h3 style="color: #0A4D5C; margin: 0 0 15px 0;">💰 Order Summary</h3>
        <div class="summary-row">
          <span>Day Pass (${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'})</span>
          <span>€${(totalPrice - (guidedTour?.price || 0) - (attractions?.reduce((sum, a) => sum + a.price, 0) || 0)).toFixed(2)}</span>
        </div>
        ${guidedTour ? `
          <div class="summary-row">
            <span>Guided Tour (${guidedTour.type})</span>
            <span>€${guidedTour.price.toFixed(2)}</span>
          </div>
        ` : ''}
        ${attractions && attractions.length > 0 ? attractions.map(attr => `
          <div class="summary-row">
            <span>${attr.name} (${attr.tickets} ${attr.tickets === 1 ? 'ticket' : 'tickets'})</span>
            <span>€${attr.price.toFixed(2)}</span>
          </div>
        `).join('') : ''}
        <div class="summary-row summary-total">
          <span>Total Paid</span>
          <span>€${totalPrice.toFixed(2)}</span>
        </div>
      </div>
      ` : ''}

      ${index === 0 ? `
      <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us via WhatsApp or email.</p>
      
      <p style="margin-top: 20px;">Safe travels and enjoy Sintra!</p>
      <p style="margin: 5px 0;"><strong>The Go Sintra Team</strong></p>
      ` : `
      <p style="margin-top: 30px; text-align: center;">
        <strong>Questions?</strong> Contact us via WhatsApp or email.
      </p>
      `}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="font-size: 20px; margin-bottom: 10px;"><strong>🎫 Go Sintra</strong></p>
      <p style="color: #D97843; font-weight: 600;">Premium Hop-On/Hop-Off Day Pass Service</p>
      <p style="margin-top: 20px;">
        📧 <a href="mailto:info@hoponsintra.com">info@hoponsintra.com</a>
      </p>
      <p style="margin-top: 5px;">
        📱 WhatsApp: <a href="https://wa.me/351932967279">+351 932 967 279</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #f0e9e3;">
        Operating Daily: 9:00 AM - 8:00 PM | Sintra, Portugal
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #b0a89e;">
        Driven by professional local guides
      </p>
    </div>
  </div>
  `).join('')}
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of booking confirmation email
 */
export function generateBookingConfirmationText(data: BookingEmailData): string {
  const {
    customerName,
    bookingId,
    selectedDate,
    passengers,
    totalPrice,
    dayPassCount,
    guidedTour,
    attractions
  } = data;

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
BOOKING CONFIRMED - GO SINTRA

Dear ${customerName},

Thank you for choosing Go Sintra! Your day pass for ${formattedDate} is ready.

YOUR DIGITAL PASSES
===================
${passengers.map((p, i) => `${i + 1}. ${p.name} (${p.type})`).join('\n')}

Show the QR codes (attached) to board any vehicle.

MANAGE YOUR BOOKING
===================
Request pickups, get route tips, and access exclusive benefits:
https://hoponsintra.com/manage-booking?id=${bookingId}

ORDER SUMMARY
=============
Day Pass (${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'}): €${(totalPrice - (guidedTour?.price || 0) - (attractions?.reduce((sum, a) => sum + a.price, 0) || 0)).toFixed(2)}
${guidedTour ? `Guided Tour (${guidedTour.type}): €${guidedTour.price.toFixed(2)}\n` : ''}${attractions && attractions.length > 0 ? attractions.map(attr => `${attr.name} (${attr.tickets} ${attr.tickets === 1 ? 'ticket' : 'tickets'}): €${attr.price.toFixed(2)}`).join('\n') + '\n' : ''}
---
Total Paid: €${totalPrice.toFixed(2)}

HOW IT WORKS
============
1. Show your QR code to board at any stop
2. Unlimited rides from 9 AM to 7 PM with professional guides
3. Vehicles every 30 minutes at all major attractions

Need help? Contact us:
Email: info@hoponsintra.com
WhatsApp: +351 932 967 279

Safe travels and enjoy Sintra!

The Go Sintra Team
Operating Daily: 9:00 AM - 8:00 PM
Sintra, Portugal
  `.trim();
}