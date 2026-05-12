// ===== TOUR BOOKING CONFIRMATION =====

export function generateTourBookingConfirmationHTML(data: {
  customerName: string;
  bookingId: string;
  tourTitle: string;
  tourDate: string;
  numberOfPeople: number;
  totalPrice: number;
  specialRequests?: string;
}): string {
  const { customerName, bookingId, tourTitle, tourDate, numberOfPeople, totalPrice, specialRequests } = data;

  const formattedDate = (() => {
    try {
      return new Date(tourDate).toLocaleDateString("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch (_) {
      return tourDate;
    }
  })();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Private Tour is Confirmed – Go Sintra</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; color: #2d3436;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #D97843;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Your Private Tour is Confirmed!</h1>
      <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.95; font-size: 16px;">Go Sintra – Private Tours</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin-bottom: 10px; color: #2d3436;">Dear ${customerName},</p>
      <p style="margin-bottom: 30px; color: #2d3436; line-height: 1.6;">
        Thank you for booking a private tour with Go Sintra! Your booking is confirmed and we can't wait to show you the magic of Sintra. Please keep this email as your booking reference.
      </p>

      <!-- Booking Details -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0A4D5C;">Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Booking ID:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tour:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${tourTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Guests:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}</td>
          </tr>
          ${specialRequests ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Special Requests:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${specialRequests}</td>
          </tr>` : ""}
          <tr style="border-top: 2px solid #D97843;">
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; font-size: 16px;">Total Paid:</td>
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; text-align: right; font-size: 18px;">€${totalPrice.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- What's Next -->
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A4D5C;">✨ What Happens Next</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2d3436; font-size: 14px; line-height: 1.8;">
          <li>Our team will reach out within 24 hours to confirm your meeting point</li>
          <li>Your private guide will be exclusively dedicated to your group</li>
          <li>The tour runs rain or shine — we know all the best covered spots!</li>
          <li>Feel free to WhatsApp us with any questions</li>
        </ul>
      </div>

      <!-- Contact -->
      <div style="background-color: #fef3e7; border: 1px solid #D97843; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0A4D5C;">📱 Need to reach us?</h3>
        <p style="margin: 0; color: #2d3436; font-size: 14px; line-height: 1.8;">
          WhatsApp: <strong>+351 919 495 826</strong><br/>
          Email: <strong>info@hoponsintra.com</strong>
        </p>
      </div>

      <p style="margin-top: 30px; color: #2d3436;">We look forward to an unforgettable day with you in Sintra!</p>
      <p style="margin: 5px 0; color: #2d3436;"><strong>The Go Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0A4D5C; color: #ffffff; padding: 25px; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Go Sintra</p>
      <p style="margin: 0 0 15px 0; color: #D97843; font-size: 13px;">Private Tours &amp; Hop-On Service</p>
      <p style="margin: 5px 0; font-size: 13px;">📧 info@hoponsintra.com</p>
      <p style="margin: 5px 0; font-size: 13px;">📱 WhatsApp: +351 919 495 826</p>
      <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">Sintra, Portugal</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ===== TOUR QUOTE REQUEST ACKNOWLEDGEMENT =====

export function generateTourQuoteRequestHTML(data: {
  customerName: string;
  requestId: string;
  tourTitle: string;
  tourDate: string;
  numberOfPeople: number;
  specialRequests?: string;
}): string {
  const { customerName, requestId, tourTitle, tourDate, numberOfPeople, specialRequests } = data;

  const formattedDate = (() => {
    try {
      return new Date(tourDate).toLocaleDateString("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch (_) {
      return tourDate;
    }
  })();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Request Received – Go Sintra</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; color: #2d3436;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #D97843;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✉️ Quote Request Received</h1>
      <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.95; font-size: 16px;">Go Sintra – Private Tours</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin-bottom: 10px; color: #2d3436;">Dear ${customerName},</p>
      <p style="margin-bottom: 30px; color: #2d3436; line-height: 1.6;">
        Thank you for your interest in a private tour with Go Sintra! We've received your request and will send you a personalised quote within <strong>24 hours</strong>.
      </p>

      <!-- Request Details -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0A4D5C;">Your Request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reference:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${requestId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tour:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${tourTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preferred Date:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Group Size:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}</td>
          </tr>
          ${specialRequests ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Special Requests:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${specialRequests}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- What happens next -->
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A4D5C;">⏱ What Happens Next</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2d3436; font-size: 14px; line-height: 1.8;">
          <li>We'll review your request and prepare a tailored quote</li>
          <li>You'll hear back from us within 24 hours</li>
          <li>No payment is required until you confirm the booking</li>
        </ul>
      </div>

      <!-- Contact -->
      <div style="background-color: #fef3e7; border: 1px solid #D97843; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0A4D5C;">📱 Can't wait? Reach us directly</h3>
        <p style="margin: 0; color: #2d3436; font-size: 14px; line-height: 1.8;">
          WhatsApp: <strong>+351 919 495 826</strong><br/>
          Email: <strong>info@hoponsintra.com</strong>
        </p>
      </div>

      <p style="margin-top: 30px; color: #2d3436;">We look forward to creating an unforgettable experience for you!</p>
      <p style="margin: 5px 0; color: #2d3436;"><strong>The Go Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0A4D5C; color: #ffffff; padding: 25px; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Go Sintra</p>
      <p style="margin: 0 0 15px 0; color: #D97843; font-size: 13px;">Private Tours &amp; Hop-On Service</p>
      <p style="margin: 5px 0; font-size: 13px;">📧 info@hoponsintra.com</p>
      <p style="margin: 5px 0; font-size: 13px;">📱 WhatsApp: +351 919 495 826</p>
      <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">Sintra, Portugal</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ===== HOP-ON DAY PASS CONFIRMATION =====

// Email confirmation template
export function generateBookingConfirmationHTML(data: any): string {
  const {
    customerName,
    bookingId,
    formattedDate,
    totalPrice,
    dayPassCount,
  } = data;

  const bookingIdShort = bookingId.split("_")[1] || bookingId;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Hop On Sintra Pass Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; color: #2d3436;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #D97843;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Your Day Pass is Ready!</h1>
      <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.95; font-size: 16px;">Hop On Sintra</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin-bottom: 10px; color: #2d3436;">Dear ${customerName},</p>
      <p style="margin-bottom: 30px; color: #2d3436; line-height: 1.6;">Thank you for choosing Hop On Sintra! Your day pass is confirmed and ready to use. Enjoy unlimited rides on our professional-guided tuk tuks and UMM jeeps throughout Sintra's most enchanting destinations.</p>
      
      <!-- PDF Attachment Notice -->
      <div style="background-color: #fff4ed; border-left: 4px solid #D97843; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; color: #0A4D5C; font-weight: 700; font-size: 16px;">📎 Your Passes (PDF Attached)</p>
        <p style="margin: 0; color: #2d3436; font-size: 14px; line-height: 1.6;">We've attached a PDF with ${dayPassCount} pass${dayPassCount === 1 ? '' : 'es'}. Save it to your phone and show the QR code when boarding any of our vehicles.</p>
      </div>
      
      <!-- Booking Details -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0A4D5C;">Pass Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Booking ID:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${bookingIdShort}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contact Name:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valid Date:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service Hours:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">9:00 AM - 7:00 PM</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Guests:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${dayPassCount}</td>
          </tr>
          <tr style="border-top: 2px solid #D97843;">
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; font-size: 16px;">Total Paid:</td>
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; text-align: right; font-size: 18px;">€${totalPrice.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- How to Use -->
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A4D5C;">✨ How to Use Your Day Pass</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2d3436; font-size: 14px; line-height: 1.8;">
          <li>Show your QR code to the driver when boarding</li>
          <li>Unlimited rides all day (9am - 7pm)</li>
          <li>Service every 30 minutes at all stops</li>
          <li>Professional guides on every vehicle</li>
          <li>Guaranteed seating - no overcrowding</li>
        </ul>
      </div>

      <!-- What to Expect -->
      <div style="background-color: #fef3e7; border: 1px solid #D97843; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A4D5C;">🚙 What to Expect</h3>
        <p style="margin: 0; color: #2d3436; font-size: 14px; line-height: 1.8;">Your pass includes rides on our fleet of tuk tuks, UMM jeeps, and other comfortable vehicles - all driven by professional guides who know Sintra's history and hidden gems. Hop on, hop off as many times as you like at any of our designated stops.</p>
      </div>

      <!-- Manage Booking -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://hoponsintra.com/manage-booking?id=${bookingId}" style="display: inline-block; background-color: #D97843; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(217, 120, 67, 0.3);">Manage My Pass</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Questions? We're here to help via WhatsApp or email.</p>
      <p style="margin-top: 20px; color: #2d3436;">We look forward to showing you the magic of Sintra!</p>
      <p style="margin: 5px 0; color: #2d3436;"><strong>The Hop On Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0A4D5C; color: #ffffff; padding: 25px; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Hop On Sintra</p>
      <p style="margin: 0 0 15px 0; color: #D97843; font-size: 13px;">Professional Hop-On/Hop-Off Day Pass Service</p>
      <p style="margin: 5px 0; font-size: 13px;">📧 info@hoponsintra.com</p>
      <p style="margin: 5px 0; font-size: 13px;">📱 WhatsApp: +351 932 967 279</p>
      <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">Daily Service: 9:00 AM - 7:00 PM | Sintra, Portugal</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
