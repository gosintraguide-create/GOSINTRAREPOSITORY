// Session manager for temporary user profiles based on booking credentials

export interface UserSession {
  bookingId: string;
  lastName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  passes: number;
  visitDate: string;
  expiresAt: string;
}

const SESSION_KEY = 'hop_on_sintra_user_session';

/**
 * Save user session to localStorage
 */
export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Get current user session
 */
export function getSession(): UserSession | null {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session: UserSession = JSON.parse(sessionData);

    // Check if session has expired
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();

    if (now > expiresAt) {
      // Session expired, clear it
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Check if user is currently logged in
 */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/**
 * Clear user session (logout)
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Verify booking and create session
 * Returns session if successful, null if verification fails
 */
export async function verifyAndLogin(
  bookingId: string,
  lastName: string,
  projectId: string,
  publicAnonKey: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    console.log('🔐 Verifying booking login...', { bookingId: bookingId.trim().toUpperCase() });
    
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login`;
    console.log('📍 Login URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: bookingId.trim().toUpperCase(),
        lastName: lastName.trim(),
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const result = await response.json();
      console.log('❌ Error response:', result);
      return {
        success: false,
        error: result.error || 'Failed to verify booking',
      };
    }

    const result = await response.json();
    console.log('📦 Success response:', result);

    if (result.success && result.booking) {
      const booking = result.booking;
      
      // Calculate session expiration (day after visit date at 11:59 PM)
      const visitDate = new Date(booking.visitDate);
      const expiresAt = new Date(visitDate);
      expiresAt.setDate(expiresAt.getDate() + 1);
      expiresAt.setHours(23, 59, 59, 999);

      const session: UserSession = {
        bookingId: booking.bookingId,
        lastName: lastName.trim(),
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone || '',
        passes: booking.passes,
        visitDate: booking.visitDate,
        expiresAt: expiresAt.toISOString(),
      };

      saveSession(session);

      console.log('✅ Login successful');
      return {
        success: true,
        session,
      };
    }

    return {
      success: false,
      error: 'Invalid booking credentials',
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    
    // More detailed error messages
    let errorMessage = 'Network error. Please try again.';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      console.error('🔌 Network connectivity issue detected');
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
