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
  <title>Your Go Sintra Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fffbf7; color: #2d3436;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #D97843;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0; color: #f0e9e3; font-size: 16px;">Go Sintra Day Pass</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin-bottom: 10px; color: #2d3436;">Dear ${customerName},</p>
      <p style="margin-bottom: 30px; color: #2d3436;">Thank you for choosing Go Sintra! Your day pass is confirmed and ready to use.</p>
      
      <!-- PDF Attachment Notice -->
      <div style="background-color: #fff4ed; border-left: 4px solid #D97843; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; color: #0A4D5C; font-weight: 700; font-size: 16px;">📎 Your Tickets (PDF Attached)</p>
        <p style="margin: 0; color: #2d3436; font-size: 14px; line-height: 1.6;">We've attached a PDF with ${dayPassCount} ticket${dayPassCount === 1 ? '' : 's'}. Save it to your phone and show the QR code to board any vehicle.</p>
      </div>
      
      <!-- Booking Details -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0A4D5C;">Booking Details</h2>
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
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Operating Hours:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">9:00 AM - 8:00 PM</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Passengers:</td>
            <td style="padding: 8px 0; color: #2d3436; font-weight: 600; text-align: right; font-size: 14px;">${dayPassCount}</td>
          </tr>
          <tr style="border-top: 2px solid #D97843;">
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; font-size: 16px;">Total Paid:</td>
            <td style="padding: 15px 0 0 0; color: #0A4D5C; font-weight: 700; text-align: right; font-size: 18px;">€${totalPrice.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- How to Use -->
      <div style="background-color: #e6f7ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A4D5C;">How to Use Your Pass</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2d3436; font-size: 14px; line-height: 1.8;">
          <li>Show your QR code to the driver when boarding</li>
          <li>Valid for unlimited rides until 8:00 PM</li>
          <li>Vehicles depart every 10-15 minutes</li>
        </ul>
      </div>

      <!-- Manage Booking -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://gosintra.com/manage-booking?id=${bookingId}" style="display: inline-block; background-color: #D97843; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Manage My Booking</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Need help? Contact us via WhatsApp or email.</p>
      <p style="margin-top: 20px; color: #2d3436;">Safe travels!</p>
      <p style="margin: 5px 0; color: #2d3436;"><strong>The Go Sintra Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0A4D5C; color: #ffffff; padding: 25px; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Go Sintra</p>
      <p style="margin: 0 0 15px 0; color: #D97843; font-size: 13px;">Premium Hop-On/Hop-Off Day Pass</p>
      <p style="margin: 5px 0; font-size: 13px;">📧 info@gosintra.com</p>
      <p style="margin: 5px 0; font-size: 13px;">📱 WhatsApp: +351 932 967 279</p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #b0a89e;">Operating Daily: 9:00 AM - 8:00 PM | Sintra, Portugal</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
