import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {QRCodeSVG} from 'qrcode.react';
import {CustomerCardAccount} from './CustomerCardAccount';
import {CityCardInlinePayment} from './CityCardInlinePayment';
import {customerCardApi, loadCustomerCards, type Card, type CancellationQuote, type Wallet} from '../lib/customerCards';

export function CustomerCardsPage() {return <CustomerCardAccount>{() => <WalletView />}</CustomerCardAccount>;}
export function WalletView({embedded = false}: {embedded?: boolean}) {
  const {t, policy, money, ageLabels, status, date: formatDate, error: translateError} = useCardTranslation();
  const [wallet, setWallet] = useState<Wallet | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [cancelCard, setCancelCard] = useState<Card | null>(null);
  const lock = useRef(false);
  const [paying, setPaying] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    loadCustomerCards().then(data => {if (active) setWallet(data);}).catch(e => {if (active) {setWallet(null); setError(translateError(e));}}).finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, [revision]);
  async function cancelOrder(id: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {await customerCardApi(`/customer/city-cards/orders/${id}/cancel`, {}); setRevision(n => n + 1);}
    catch (e) {setError(translateError(e));}
    finally {lock.current = false; setBusy(false);}
  }
  return <><p className="cc-eyebrow">{t('walletEyebrow')}</p>{embedded ? <h2>{t('wallet')}</h2> : <h1>{t('wallet')}</h1>}
    <div className="cc-actions"><button className="secondary" disabled={loading || busy || !!cancelCard || !!paying} onClick={() => setRevision(n => n + 1)}>{t('refreshCards')}</button><Link to="/buy-ticket">{t('buy')}</Link></div>
    <p>{t('walletHelp')}</p>
    {loading && <p role="status">{t('checkingCards')}</p>}
    {error && <p role="alert" className="cc-error">{translateError(error)}</p>}
    {wallet?.recoveryPending && <p className="cc-error" role="status">{t('recovery')}</p>}
    {!loading && wallet?.orders.filter(o => o.state === 'reserved').map(order => <section className="cc-panel" key={order.id}><h2>{t('checkoutProgress', {date: formatDate(order.date)})}</h2><p>{t('cardCount', {count: order.quantity, amount: money(order.totalCents)})}</p><p>{t('payHelp')}</p><div className="cc-actions">
      {order.paymentFlow === 'inline' ? <button disabled={busy || !!cancelCard || !!paying} onClick={() => setPaying(order.id)}>{t('continuePayment')}</button> : <p>{t('externalPayment')}</p>}
      <button className="secondary" disabled={busy || !!cancelCard || !!paying} onClick={() => void cancelOrder(order.id)}>{t('cancelUnpaid')}</button>
    </div>{paying === order.id && <CityCardInlinePayment order={order} onClose={() => {setPaying(null); setRevision(n => n + 1);}} onDone={() => {setPaying(null); setRevision(n => n + 1);}} />}</section>)}
    {!loading && wallet && !wallet.cards.length && <section className="cc-panel"><h2>{t('empty')}</h2><p>{t('emptyHelp')}</p></section>}
    {cancelCard && <CancelCard key={cancelCard.id} card={cancelCard} onClose={() => setCancelCard(null)} onDone={() => {setCancelCard(null); setWallet(null); setRevision(n => n + 1);}} />}
    {!loading && <div className="cc-grid">{wallet?.cards.map(card => <article className={`cc-panel cc-card ${card.ageBand}`} key={card.id}>
      <p className="cc-eyebrow">{card.transportHours ? 'CITY CARD' : t('legacyPass')}</p><h2>{card.name}</h2><p>{formatDate(card.date)} · {ageLabels[card.ageBand]}</p><p>{t('status', {status: status(card.status)})}</p>
      {card.transportHours ? <p>{t('transport', {opens: card.transportHours.opens, closes: card.transportHours.closes})}</p> : <p>{t('legacyHours')}</p>}
      <p>{card.perks ? t('hasPerks') : t('noPerks')}</p>
      {card.ageBand === 'free' && <p className="cc-note">{policy.vehicle}</p>}
      {card.qr && card.status !== 'cancelled' && <div className="cc-qr">{card.qr.startsWith('data:image/png;base64,') ? <img src={card.qr} width={200} height={200} alt={t('qr', {name: card.name})} /> : <QRCodeSVG value={card.qr} size={200} marginSize={4} title={t('qr', {name: card.name})} />}</div>}
      {card.canCancel && <button className="secondary" disabled={busy || !!cancelCard} onClick={() => setCancelCard(card)}>{t('reviewCancel')}</button>}
    </article>)}</div>}
    {!!wallet?.refunds?.length && <section className="cc-panel"><h2>{t('refundStatus')}</h2>{wallet.refunds.map(refund => <p key={refund.id}>{money(refund.amountCents)} · {status(refund.state)}</p>)}<p>{t('refundHelp')}</p></section>}
    <p><Link to="/city-card-terms">{t('conditions')}</Link> · <Link to="/manage-booking">{t('manageOld')}</Link></p>
  </>;
}
function CancelCard({card, onClose, onDone}: {card: Card; onClose: () => void; onDone: () => void}) {
  const {t, money, date: formatDate, error: translateError} = useCardTranslation();
  const [quote, setQuote] = useState<CancellationQuote | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null), locked = useRef(false), panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.focus(); panel.current?.scrollIntoView({block: 'center', behavior: 'smooth'});
    let active = true;
    customerCardApi<{quote: CancellationQuote}>('/customer/city-cards/cancellation-quote', {bookingId: card.bookingId, index: card.index}).then(data => {if (active) setQuote(data.quote);}).catch(e => {if (active) setError(translateError(e));});
    return () => {active = false;};
  }, [card.bookingId, card.index]);
  async function confirm() {
    if (!quote || locked.current) return;
    locked.current = true; setBusy(true); setError(''); requestId.current ||= crypto.randomUUID();
    try {await customerCardApi('/customer/city-cards/cancellations', {bookingId: card.bookingId, index: card.index, requestId: requestId.current, fingerprint: quote.fingerprint}); onDone();}
    catch (e) {setError(translateError(e));}
    finally {locked.current = false; setBusy(false);}
  }
  return <section className="cc-panel cc-cancel" ref={panel} tabIndex={-1} aria-label={t('reviewCancel')}><h2>{t('reviewCancel')}</h2>
    {!quote && !error && <p role="status">{t('checkingCancel')}</p>}
    {error && <p className="cc-error" role="alert">{translateError(error)}</p>}
    {quote && <><p>{t('dateLabel', {date: formatDate(quote.date)})}</p>{quote.includesChildren && <p className="cc-note">{t('dependentCancel')}</p>}
      {quote.cards.map(item => <p key={`${item.bookingId}:${item.index}`}>{item.name} · {money(item.amountCents)}</p>)}
      <p className="cc-total">{t('refund', {amount: money(quote.totalCents)})}</p><p>{t('cancelHelp')}</p>
      <button disabled={busy} onClick={() => void confirm()}>{busy ? t('cancelling') : t('cancelConfirm', {count: quote.cards.length, amount: money(quote.totalCents)})}</button></>}
    <button className="secondary" disabled={busy} onClick={onClose}>{t('keep')}</button>
  </section>;
}
