// Email templates for booking confirmations
//
// NOTE: By default, emails are sent from "Go Sintra <onboarding@resend.dev>"
// To use your own domain (e.g., bookings@gosintra.com):
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
    .header {
      background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
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
    .qr-card {
      background-color: #ffffff;
      border: 2px solid #f0e9e3;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .qr-card h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #0A4D5C;
    }
    .qr-card img {
      max-width: 250px;
      height: auto;
      margin: 15px auto;
    }
    .passenger-type {
      display: inline-block;
      background-color: #D97843;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 10px;
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
      background-color: #0A4D5C;
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #D97843;
      text-decoration: none;
    }
    .cta-button {
      display: inline-block;
      background-color: #D97843;
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Dear ${customerName},</p>
      
      <p>Thank you for choosing Go Sintra! We're excited to help you discover the magic of Sintra.</p>
      
      <!-- Booking Details -->
      <div class="booking-info">
        <h2>📋 Booking Details</h2>
        <div class="info-row">
          <span class="info-label">Booking ID:</span>
          <span class="info-value">${bookingId.split('_')[1]}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Operating Hours:</span>
          <span class="info-value">9:00 AM - 8:00 PM</span>
        </div>
        <div class="info-row">
          <span class="info-label">Day Passes:</span>
          <span class="info-value">${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'}</span>
        </div>
      </div>

      <!-- Ticket Cards -->
      <div class="qr-section">
        <h2 style="color: #0A4D5C; margin-bottom: 20px;">🎫 Your Day Pass Tickets</h2>
        <p style="margin-bottom: 20px;">Save these tickets or show them directly from this email to board any vehicle. Each passenger needs their own ticket.</p>
        
        ${passengers.map((passenger, index) => `
          <div style="margin: 30px 0; position: relative;">
            <!-- Ticket Container -->
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <tr>
                <!-- Main Ticket Section -->
                <td style="background-color: #FFF8F0; border: 2px solid #DDD0C0; border-right: none; padding: 0; vertical-align: top; width: 70%;">
                  <!-- Header -->
                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #D97843;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                          <tr>
                            <td style="color: #FFF8F0; font-size: 16px; letter-spacing: 1px; font-weight: 600;">
                              DAY PASS
                            </td>
                            <td style="text-align: right;">
                              <span style="color: #FFF8F0; font-size: 13px; border: 1px solid rgba(255,248,240,0.3); padding: 6px 12px; border-radius: 4px;">
                                ${bookingId}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Body -->
                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; padding: 25px 20px;">
                    <tr>
                      <td>
                        <!-- Passenger Info -->
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 15px;">
                          <tr>
                            <td style="width: 50%; padding-right: 10px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Name of Passenger
                              </div>
                              <div style="font-size: 15px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                ${passenger.name}
                              </div>
                            </td>
                            <td style="width: 50%; padding-left: 10px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Ticket Type
                              </div>
                              <div style="font-size: 15px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                ${passenger.type}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Location Info -->
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 15px;">
                          <tr>
                            <td style="width: 50%; padding-right: 10px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Service Area
                              </div>
                              <div style="font-size: 15px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                SINTRA
                              </div>
                            </td>
                            <td style="width: 50%; padding-left: 10px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Coverage
                              </div>
                              <div style="font-size: 15px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                ALL ROUTES
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Date/Time Info -->
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-top: 1px solid #DDD0C0; padding-top: 15px; margin-top: 15px;">
                          <tr>
                            <td style="width: 33%; padding-right: 5px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Date
                              </div>
                              <div style="font-size: 14px; color: #2d3436; letter-spacing: 0.3px; font-weight: 500;">
                                ${formattedDate}
                              </div>
                            </td>
                            <td style="width: 33%; padding: 0 5px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Start Time
                              </div>
                              <div style="font-size: 14px; color: #2d3436; letter-spacing: 0.3px; font-weight: 500;">
                                9:00 AM
                              </div>
                            </td>
                            <td style="width: 33%; padding-left: 5px;">
                              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                                Valid Until
                              </div>
                              <div style="font-size: 14px; color: #2d3436; letter-spacing: 0.3px; font-weight: 500;">
                                8:00 PM
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                
                <!-- Perforation Line -->
                <td style="width: 2px; background: repeating-linear-gradient(to bottom, #DDD0C0 0px, #DDD0C0 6px, transparent 6px, transparent 12px); padding: 0;">
                </td>
                
                <!-- Stub Section -->
                <td style="background-color: #FFF8F0; border: 2px solid #DDD0C0; border-left: none; padding: 0; vertical-align: top; width: 30%;">
                  <!-- Stub Header -->
                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #D97843;">
                    <tr>
                      <td style="padding: 15px; color: #FFF8F0; font-size: 14px; letter-spacing: 1px; font-weight: 600; text-align: center;">
                        DAY PASS
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Stub Body -->
                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; padding: 20px 15px;">
                    <tr>
                      <td style="text-align: center;">
                        <!-- Passenger Name -->
                        <div style="margin-bottom: 15px;">
                          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                            Passenger
                          </div>
                          <div style="font-size: 13px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                            ${passenger.name.split(' ')[0]}
                          </div>
                        </div>
                        
                        <!-- Service -->
                        <div style="margin-bottom: 15px;">
                          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                            Service
                          </div>
                          <div style="font-size: 13px; color: #2d3436; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                            SINTRA
                          </div>
                        </div>
                        
                        <!-- QR Code -->
                        <div style="border-top: 1px solid #DDD0C0; padding-top: 15px; margin-bottom: 15px;">
                          <div style="background-color: #ffffff; padding: 10px; display: inline-block; border-radius: 4px;">
                            <img src="${passenger.qrCode}" alt="QR Code" style="width: 120px; height: 120px; display: block;" />
                          </div>
                          <div style="font-size: 9px; color: #6b7280; margin-top: 8px;">
                            Scan to validate
                          </div>
                        </div>
                        
                        <!-- Date -->
                        <div style="border-top: 1px solid #DDD0C0; padding-top: 12px; margin-bottom: 12px;">
                          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                            Date
                          </div>
                          <div style="font-size: 12px; color: #2d3436; letter-spacing: 0.3px; font-weight: 500;">
                            ${formattedDate}
                          </div>
                        </div>
                        
                        <!-- Booking ID -->
                        <div style="font-size: 9px; color: #6b7280;">
                          ${bookingId}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            ${passengers.length > 1 ? `
            <!-- Passenger Counter Badge -->
            <div style="position: absolute; top: -10px; right: 10px; background-color: #0A4D5C; color: #ffffff; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 4px solid #ffffff;">
              <div style="text-align: center; line-height: 1.2;">
                <div style="font-size: 16px; font-weight: 700;">${index + 1}</div>
                <div style="font-size: 10px;">of ${passengers.length}</div>
              </div>
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Order Summary -->
      <div class="summary">
        <h3 style="color: #0A4D5C; margin: 0 0 15px 0;">���� Order Summary</h3>
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

      <!-- Instructions -->
      <div class="instructions">
        <h3>📱 How to Use Your Pass</h3>
        <ul>
          <li><strong>Show QR Code:</strong> Present your QR code to the driver when boarding any vehicle</li>
          <li><strong>Unlimited Rides:</strong> Use your pass for unlimited hop-on/hop-off rides until 8 PM</li>
          <li><strong>Regular Service:</strong> New vehicles depart every 10-15 minutes from all major attractions</li>
          <li><strong>Small Vehicles:</strong> Guaranteed seating in groups of 2-6 passengers</li>
          <li><strong>Flexible Schedule:</strong> Spend as much time as you want at each attraction</li>
        </ul>
      </div>

      <!-- Next Steps -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; margin-bottom: 15px;">Need help planning your visit?</p>
        <a href="https://gosintra.com/attractions" class="cta-button">View Attraction Guide</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us via WhatsApp or email.</p>
      
      <p style="margin-top: 20px;">Safe travels and enjoy Sintra!</p>
      <p style="margin: 5px 0;"><strong>The Go Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Go Sintra</strong></p>
      <p>Premium Hop-On/Hop-Off Service</p>
      <p style="margin-top: 15px;">
        📧 <a href="mailto:info@gosintra.com">info@gosintra.com</a> | 
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

Thank you for choosing Go Sintra! We're excited to help you discover the magic of Sintra.

BOOKING DETAILS
================
Booking ID: ${bookingId.split('_')[1]}
Date: ${formattedDate}
Operating Hours: 9:00 AM - 8:00 PM
Day Passes: ${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'}

YOUR DIGITAL PASSES
===================
${passengers.map((p, i) => `${i + 1}. ${p.name} (${p.type})`).join('\n')}

(QR codes are attached to this email. Please save them or show them directly from this email to board.)

ORDER SUMMARY
=============
Day Pass (${dayPassCount} ${dayPassCount === 1 ? 'passenger' : 'passengers'}): €${(totalPrice - (guidedTour?.price || 0) - (attractions?.reduce((sum, a) => sum + a.price, 0) || 0)).toFixed(2)}
${guidedTour ? `Guided Tour (${guidedTour.type}): €${guidedTour.price.toFixed(2)}\n` : ''}${attractions && attractions.length > 0 ? attractions.map(attr => `${attr.name} (${attr.tickets} ${attr.tickets === 1 ? 'ticket' : 'tickets'}): €${attr.price.toFixed(2)}`).join('\n') + '\n' : ''}
---
Total Paid: €${totalPrice.toFixed(2)}

HOW TO USE YOUR PASS
====================
1. Show your QR code to the driver when boarding
2. Enjoy unlimited hop-on/hop-off rides until 8 PM
3. New vehicles depart every 10-15 minutes
4. Guaranteed seating in small groups of 2-6
5. Spend as much time as you want at each attraction

Need help? Contact us:
Email: info@gosintra.com
WhatsApp: +351 932 967 279

Safe travels and enjoy Sintra!

The Go Sintra Team
Operating Daily: 9:00 AM - 8:00 PM
Sintra, Portugal
  `.trim();
}