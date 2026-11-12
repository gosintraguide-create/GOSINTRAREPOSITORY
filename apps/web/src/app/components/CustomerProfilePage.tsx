import {useEffect, useRef, useState} from 'react';
import {Link, NavLink, useParams} from 'react-router';
import {CustomerCardAccount} from './CustomerCardAccount';
import {WalletView} from './CustomerCardsPage';
import {CustomerProfileRides} from './CustomerProfileRides';
import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {getProfileCopy} from '../lib/translations/profileCopy';
import {customerCardApi, type Order} from '../lib/customerCards';

export function CustomerProfilePage() {
  const {section} = useParams();
  const {language} = useCardTranslation();
  const p = getProfileCopy(language);
  return <CustomerCardAccount>{user => <>
    <section className="cc-profile-heading"><p className="cc-eyebrow">{p.title}</p><h1>{String(user.user_metadata?.full_name || user.email || '')}</h1><p>{p.intro}</p></section>
    <nav className="cc-profile-nav" aria-label={p.profile}>
      <NavLink to="/profile" end>{p.cards}</NavLink>
      <NavLink to="/profile/rides">{p.rides}</NavLink>
      <NavLink to="/profile/history">{p.history}</NavLink>
    </nav>
    {section === 'rides' ? <CustomerProfileRides /> : section === 'history' ? <PurchaseHistory /> : <WalletView embedded />}
  </>}</CustomerCardAccount>;
}

type HistoryOrder = Order & {createdAt: string};
function PurchaseHistory() {
  const {language, t, money, date, status} = useCardTranslation();
  const p = getProfileCopy(language);
  const [orders, setOrders] = useState<HistoryOrder[]>([]), [nextPage, setNextPage] = useState<number | null>(0);
  const [busy, setBusy] = useState(true), [error, setError] = useState(false);
  const lock = useRef(false), alive = useRef(true);
  async function load(page: number) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      const data = await customerCardApi<{orders: HistoryOrder[]; nextPage: number | null}>(`/customer/city-cards/history?page=${page}`, undefined, false, 'customer-profile-history');
      if (alive.current) {setOrders(old => page === 0 ? data.orders : [...old, ...data.orders.filter(item => !old.some(o => o.id === item.id))]); setNextPage(data.nextPage);}
    } catch {if (alive.current) setError(true);}
    finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  useEffect(() => {alive.current = true; void load(0); return () => {alive.current = false;};}, []);
  return <section><h2>{p.history}</h2><p>{p.historyHelp}</p>
    {error && <p className="cc-error" role="alert">{p.historyError}</p>}
    {!busy && !error && !orders.length && <p>{p.noOrders}</p>}
    {orders.map(order => <article className="cc-panel" key={order.id}>
      <h3>{p.visitDate}: {date(order.date)}</h3><p>{t('cardCount', {count: order.quantity, amount: money(order.totalCents)})}</p>
      <p>{t('status', {status: order.state === 'paid' || order.state === 'completed' ? p.paid : order.state === 'expired' ? p.expired : order.state === 'reserved' ? p.reserved : status(order.state)})}</p>
      <p className="cc-muted">{p.purchaseDate}: {new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : language, {dateStyle:'medium', timeZone:'Europe/Lisbon'}).format(new Date(order.createdAt))}</p>
      {order.state === 'reserved' && <Link to="/profile">{t('wallet')}</Link>}
    </article>)}
    {busy && <p role="status">{t('checkingCards')}</p>}
    <div className="cc-actions"><button className="secondary" disabled={busy} onClick={() => void load(0)}>{p.refresh}</button>{nextPage !== null && nextPage > 0 && <button disabled={busy} onClick={() => void load(nextPage)}>{p.more}</button>}<Link to="/manage-booking">{t('existing')}</Link></div>
  </section>;
}
