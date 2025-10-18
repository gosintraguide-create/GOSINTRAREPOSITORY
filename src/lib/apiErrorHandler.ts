// Utility for handling API errors gracefully
// Prevents console spam while still logging critical issues

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const warnedEndpoints = new Set<string>();

export function logApiWarning(endpoint: string, error: any) {
  // Only warn once per endpoint per session
  if (warnedEndpoints.has(endpoint)) {
    return;
  }
  
  warnedEndpoints.add(endpoint);
  
  // In development, show more details
  if (isDevelopment) {
    console.warn(`API unavailable: ${endpoint}`, error);
  }
  // In production, stay silent - the app works without the server
}

export function logApiError(endpoint: string, error: any) {
  // Only log actual errors (not network failures)
  if (isDevelopment) {
    console.error(`API error: ${endpoint}`, error);
  }
}

export async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Network error - fail silently
    logApiWarning(url, error);
    return null;
  }
}

export async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      logApiWarning(url, `HTTP ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    logApiWarning(url, error);
    return null;
  }
}
