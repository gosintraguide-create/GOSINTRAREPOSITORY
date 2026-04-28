// QR Code generation utilities for booking confirmations

/**
 * Generates a QR code data URL for a booking
 * @param bookingId - The unique booking ID
 * @param passengerIndex - Index of the passenger (0-based)
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQRCode(bookingId: string, passengerIndex: number): Promise<string> {
  try {
    // Dynamic import of qrcode library
    const QRCode = await import('qrcode');
    
    // Format: booking_id|passenger_index
    const qrData = `${bookingId}|${passengerIndex}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.default.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#0A4D5C', // Primary color
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generates QR codes for all passengers in a booking
 * @param bookingId - The unique booking ID
 * @param passengerCount - Number of passengers
 * @returns Promise<string[]> - Array of QR code data URLs
 */
export async function generateBookingQRCodes(
  bookingId: string, 
  passengerCount: number
): Promise<string[]> {
  const qrCodes: string[] = [];
  
  for (let i = 0; i < passengerCount; i++) {
    const qrCode = await generateQRCode(bookingId, i);
    qrCodes.push(qrCode);
  }
  
  return qrCodes;
}

/**
 * Validates QR code format
 * @param qrData - The scanned QR code data
 * @returns Object with bookingId and passengerIndex, or null if invalid
 */
export function parseQRCode(qrData: string): { bookingId: string; passengerIndex: number } | null {
  try {
    const parts = qrData.split('|');
    if (parts.length !== 2) return null;
    
    const bookingId = parts[0];
    const passengerIndex = parseInt(parts[1], 10);
    
    if (!bookingId || isNaN(passengerIndex)) return null;
    
    return { bookingId, passengerIndex };
  } catch {
    return null;
  }
}
