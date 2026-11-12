/// <reference types="vite/client" />
import {createClient} from '@supabase/supabase-js';
import {projectId, publicAnonKey} from '../utils/supabase/info';

// This override is compiled out of production and never receives customer tokens.
const sandboxSetting = import.meta.env.DEV ? import.meta.env.VITE_CARD_SANDBOX_URL : undefined;
export const cardSandboxUrl: string | undefined = sandboxSetting || undefined;
if (cardSandboxUrl) {
  const url = new URL(cardSandboxUrl);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !/^\/sandbox\/[a-f0-9-]+$/.test(url.pathname)) {
    throw new Error('Invalid local payment sandbox. Live checkout has not been enabled.');
  }
}

// Customer sessions must never overwrite the admin or driver session.
export const customerClient = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  auth: {storageKey: 'hopon-web-customer-auth-v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
});
export type AgeBand = 'full' | 'half' | 'free';
export type Traveller = {name: string; ageBand: AgeBand | ''};
export type Offer = {serverTime: string; salesEnabled: boolean; prices: Record<AgeBand, number>; day: {
  date: string; configured: boolean; remaining: number; opens: string | null; closes: string | null;
  slots: Record<string, {remaining: number}>;
}};
export type Card = {id: string; bookingId: string; index: number; name: string; date: string;
  ageBand: AgeBand | 'unknown'; status: string; qr: string | null; perks: boolean; canCancel: boolean;
  transportHours: {opens: string; closes: string} | null};
export type Order = {id: string; date: string; state: string; quantity: number; totalCents: number; checkoutUrl: string | null; paymentFlow?: string; expiresAt?: string};
export type Wallet = {cards: Card[]; orders: Order[]; recoveryPending: boolean;
  refunds?: {id: string; amountCents: number; state: string}[]};
export type CancellationQuote = {date: string; fingerprint: string; totalCents: number; includesChildren: boolean;
  cards: {bookingId: string; index: number; name: string; amountCents: number}[]};
export const money = (cents: number) => new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR'}).format(cents / 100);
export const ageLabels = {full: '12+ · full price', half: '7–11 · half price', free: 'Under 7 · free', unknown: 'Legacy child pass'};
export function lisbonDate() {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
}
export async function customerCardApi<T>(path: string, body?: unknown, publicRead = false, functionName = 'make-server-3bd0ade8'): Promise<T> {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (!publicRead && !cardSandboxUrl) {
    const {data, error} = await customerClient.auth.getSession();
    if (error || !data.session) throw new Error('Please sign in again to access your cards.');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${cardSandboxUrl || `https://${projectId}.supabase.co/functions/v1/${functionName}`}${path}`, {
      method: body === undefined ? 'GET' : 'POST', headers, cache: 'no-store', signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => {throw new Error('City Cards are temporarily unavailable. Please try again shortly.');});
    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load City Cards.');
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The request timed out. Check My Cards before starting another checkout.');
    throw error;
  } finally {clearTimeout(timer);}
}
export const loadCustomerCards = () => customerCardApi<Wallet>('/customer/city-cards');
