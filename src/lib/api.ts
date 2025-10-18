import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  silent = false // Silent mode for optional API calls with fallbacks
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (!silent) {
        console.error(`API Error (${endpoint}):`, data);
      }
      return {
        success: false,
        error: data.error || 'An error occurred',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    if (!silent) {
      console.log(`ℹ️ Backend not available (${endpoint}) - using local data`);
    }
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

// Content Management
export async function getContent() {
  const response = await apiCall('/content', {}, true); // Silent mode - has fallback
  return response.data?.content || null;
}

export async function saveContent(content: any) {
  return await apiCall('/content', {
    method: 'POST',
    body: JSON.stringify(content),
  });
}

// Pricing Management
export async function getPricing() {
  const response = await apiCall('/pricing', {}, true); // Silent mode - has fallback
  return response.data?.pricing || null;
}

export async function savePricing(pricing: any) {
  return await apiCall('/pricing', {
    method: 'POST',
    body: JSON.stringify(pricing),
  });
}

// Availability Management
export async function getAvailability(date: string) {
  const response = await apiCall(`/availability/${date}`);
  return response.data?.availability || {
    totalSeats: 100,
    bookedSeats: 0,
    availableSeats: 100,
  };
}

export async function setAvailability(date: string, availability: any) {
  return await apiCall(`/availability/${date}`, {
    method: 'POST',
    body: JSON.stringify(availability),
  });
}

// Booking Management
export async function createBooking(bookingData: any) {
  console.log("📤 Creating booking with data:", bookingData);
  const response = await apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  console.log("📥 Booking response:", response);
  return response;
}

export async function getBookings() {
  const response = await apiCall('/bookings');
  return response.data?.bookings || [];
}

export async function getBookingById(id: string) {
  const response = await apiCall(`/bookings/${id}`);
  return response.data?.booking || null;
}

export async function verifyQRCode(qrCode: string) {
  const response = await apiCall('/verify-qr', {
    method: 'POST',
    body: JSON.stringify({ qrCode }),
  });
  return response;
}

// Health check
export async function checkHealth() {
  return await apiCall('/health');
}

// Stripe Payment Integration
export async function createPaymentIntent(amount: number, metadata?: any) {
  console.log(`💳 Creating payment intent for €${amount}`);
  const response = await apiCall('/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ amount, currency: 'eur', metadata }),
  });
  return response;
}

export async function verifyPayment(paymentIntentId: string) {
  console.log(`🔍 Verifying payment: ${paymentIntentId}`);
  const response = await apiCall('/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  });
  return response;
}