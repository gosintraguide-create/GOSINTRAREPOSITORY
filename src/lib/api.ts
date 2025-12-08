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
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Only log API calls when not in silent mode
    if (!silent) {
      console.log(`🔗 API Call: ${options.method || 'GET'} ${url}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, try to read as text for debugging
      const text = await response.text();
      
      // Check for Supabase quota exceeded error
      if (text.includes('exceeded your Free Plan quota') || text.includes('quota in this billing')) {
        console.warn('⚠️ Supabase quota exceeded. Operating in offline mode with localStorage.');
        return {
          success: false,
          error: 'Backend quota exceeded. Operating in offline mode.',
        };
      }
      
      if (!silent) {
        console.error(`Non-JSON response from ${endpoint}:`, text.substring(0, 200));
      }
      data = { error: 'Server returned non-JSON response' };
    }

    if (!response.ok) {
      // More helpful error messages for common issues
      if (response.status === 404) {
        // Don't log 404 errors in silent mode (they have fallbacks)
        if (!silent) {
          console.error(`API Error (${endpoint}):`, {
            status: response.status,
            statusText: response.statusText,
            error: data
          });
        }
        return {
          success: false,
          error: 'Server endpoint not found. The backend service may be initializing. Please try again in a moment.',
        };
      }
      
      if (!silent) {
        console.error(`API Error (${endpoint}):`, {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
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
      console.error(`❌ Network Error (${endpoint}):`, error);
    }
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
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

// Comprehensive Content Management (separate from simple content)
export async function getComprehensiveContent() {
  const response = await apiCall('/comprehensive-content', {}, true); // Silent mode - has fallback
  return response.data?.content || null;
}

export async function saveComprehensiveContent(content: any) {
  return await apiCall('/comprehensive-content', {
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
  console.log("🔗 API endpoint:", `${API_BASE_URL}/bookings`);
  console.log("🔑 Using project ID:", projectId);
  console.log("🔑 Has anon key:", !!publicAnonKey);
  
  const response = await apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  
  console.log("📥 Booking response:", response);
  
  if (!response.success) {
    console.error("❌ Booking creation failed:");
    console.error("   - Error:", response.error);
    console.error("   - Booking data sent:", bookingData);
  } else {
    console.log("✅ Booking created successfully:", response.data);
  }
  
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