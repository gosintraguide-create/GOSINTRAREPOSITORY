import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {useEffect, useRef, useState} from 'react';
import {Elements, PaymentElement, useElements, useStripe} from '@stripe/react-stripe-js';
import {loadStripe, type Stripe} from '@stripe/stripe-js';
import {customerCardApi, type Order} from '../lib/customerCards';

type Payment = {order: Order; clientSecret: string | null; publishableKey?: string};
const clients = new Map<string, Promise<Stripe | null>>();
function stripeClient(key: string) {
  if (!clients.has(key)) clients.set(key, loadStripe(key));
  return clients.get(key)!;
}
export function CityCardInlinePayment({order, onDone, onClose}: {order: Order; onDone: () => void; onClose: () => void}) {
  const {language, t, error: translateError} = useCardTranslation();
  const [payment, setPayment] = useState<Payment | null>(null), [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setError(''); setPayment(null);
    customerCardApi<Payment>(`/customer/city-cards/orders/${order.id}/payment`).then(value => {
      if (!active) return;
      if (!value.clientSecret) {setError(t('paymentClosed')); return;}
      if (!value.publishableKey?.startsWith('pk_')) throw new Error(t('paymentUnavailable'));
      setPayment(value);
    }).catch(e => {if (active) setError(translateError(e, 'paymentUnavailable'));});
    return () => {active = false;};
  }, [order.id, revision]);
  return <div className="cc-panel" aria-label={t('secure')}><h2>{t('payHere')}</h2>
    <p>{t('stripeHelp')}</p>
    {!payment && !error && <p role="status">{t('loadingPayment')}</p>}
    {error && <p className="cc-error" role="alert">{translateError(error)} <button className="secondary" onClick={() => setRevision(n => n + 1)}>{t('retry')}</button></p>}
    {payment?.clientSecret && <Elements stripe={stripeClient(payment.publishableKey!)} options={{locale: language, clientSecret: payment.clientSecret, appearance: {theme: 'stripe', variables: {colorPrimary: '#005e6c'}}}}>
      <PaymentForm order={payment.order} onDone={onDone} onClose={onClose} />
    </Elements>}
    {!payment && <button className="secondary" onClick={onClose}>{t('closeCheckout')}</button>}
  </div>;
}
function PaymentForm({order, onDone, onClose}: {order: Order; onDone: () => void; onClose: () => void}) {
  const {t, money, error: translateError} = useCardTranslation();
  const stripe = useStripe(), elements = useElements();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  async function pay() {
    if (!stripe || !elements || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      // Recheck ownership, expiry and authoritative payment state before confirming.
      const state = await customerCardApi<Payment>(`/customer/city-cards/orders/${order.id}/payment`);
      if (!state.clientSecret) {onDone(); return;}
      const result = await stripe.confirmPayment({elements, confirmParams: {return_url: `${window.location.origin}/my-cards`}, redirect: 'if_required'});
      if (result.error) setError(t(result.error.code === 'card_declined' ? 'paymentDeclined' : result.error.type === 'validation_error' ? 'paymentInvalid' : 'paymentUnavailable'));
      else onDone(); // Wallet calls the server; this callback never issues cards.
    } catch (e) {setError(translateError(e));}
    finally {locked.current = false; setBusy(false);}
  }
  return <form onSubmit={e => {e.preventDefault(); void pay();}}><PaymentElement options={{layout: 'accordion', wallets: {applePay: 'auto', googlePay: 'auto'}, paymentMethodOrder: ['apple_pay', 'google_pay', 'mb_way', 'card']}} />
    {error && <p className="cc-error" role="alert">{translateError(error)}</p>}
    <div className="cc-actions"><button disabled={!stripe || !elements || busy}>{busy ? t('confirming') : t('pay', {amount: money(order.totalCents)})}</button><button type="button" className="secondary" disabled={busy} onClick={onClose}>{t('closeCheckout')}</button></div>
    <p className="cc-muted">{t('closeHelp')}</p>
  </form>;
}
