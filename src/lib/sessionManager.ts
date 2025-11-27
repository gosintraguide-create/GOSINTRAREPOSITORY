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
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId.trim().toUpperCase(),
          lastName: lastName.trim(),
        }),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        success: false,
        error: result.error || 'Failed to verify booking',
      };
    }

    const result = await response.json();

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
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}
