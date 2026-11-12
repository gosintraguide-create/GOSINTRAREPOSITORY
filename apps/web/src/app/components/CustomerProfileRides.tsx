import {useEffect, useRef, useState} from 'react';
import {customerCardApi, lisbonDate, loadCustomerCards, type Card} from '../lib/customerCards';
import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {getProfileCopy} from '../lib/translations/profileCopy';
import {useWebsiteText} from '../lib/translations/websiteText';

const stops = ['Sintra Train Station','Pena Palace','Quinta da Regaleira','Moorish Castle','Monserrate Palace','Sintra National Palace','Historic Town Center'];
type Ride = {id: string; status: string; groupSize: number; pickupLocation: string; destination: string; nonTukTuk: boolean; pickedUpAt: string | null; acceptedByName: string | null};
type Request = {cards: {bookingId: string; index: number}[]; pickupLocation: string; destination: string; customerPhone: string; readyInMinutes: number; requestKey: string};

export function CustomerProfileRides() {
  const {language, t, ageLabels} = useCardTranslation(), p = getProfileCopy(language);
  const wt = useWebsiteText();
  const [cards, setCards] = useState<Card[]>([]), [rides, setRides] = useState<Ride[]>([]), [selected, setSelected] = useState<string[]>([]);
  const [pickup, setPickup] = useState(stops[0]), [destination, setDestination] = useState(stops[1]), [phone, setPhone] = useState(''), [minutes, setMinutes] = useState(0);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState<'loadError' | 'sendError' | 'actionError' | null>(null);
  const [pending, setPending] = useState<Request | null>(null);
  const locked = useRef(false), refreshId = useRef(0), alive = useRef(true);
  async function refresh() {
    const id = ++refreshId.current;
    try {
      const [wallet, data] = await Promise.all([loadCustomerCards(), customerCardApi<{requests: Ride[]}>('/customer/rides')]);
      if (!alive.current || id !== refreshId.current) return;
      setCards(wallet.cards.filter(card => card.date === lisbonDate() && ['confirmed', 'completed'].includes(card.status) && !!card.transportHours));
      setRides(data.requests); setError(old => old === 'loadError' ? null : old);
    } catch {if (alive.current && id === refreshId.current) setError(old => old || 'loadError');}
    finally {if (alive.current && id === refreshId.current) setLoading(false);}
  }
  useEffect(() => {
    alive.current = true; void refresh();
    const timer = setInterval(() => {if (!document.hidden && !locked.current) void refresh();}, 15000);
    return () => {alive.current = false; refreshId.current++; clearInterval(timer);};
  }, []);
  const group = cards.filter(card => selected.includes(card.id));
  const valid = group.some(card => card.ageBand === 'full') && pickup !== destination && /^\+[0-9 ()-]{6,24}$/.test(phone.trim());
  async function submit() {
    if (locked.current || (!pending && !valid)) return;
    locked.current = true; setBusy(true); setError(null);
    const payload = pending || {cards: group.map(card => ({bookingId: card.bookingId, index: card.index})), pickupLocation: pickup, destination, customerPhone: phone.trim(), readyInMinutes: minutes, requestKey: crypto.randomUUID()};
    setPending(payload);
    try {
      await customerCardApi('/customer/rides', payload);
      if (alive.current) {setPending(null); setSelected([]); await refresh();}
    } catch {if (alive.current) setError('sendError');}
    finally {locked.current = false; if (alive.current) setBusy(false);}
  }
  async function cancel(id: string) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try {await customerCardApi(`/customer/rides/${encodeURIComponent(id)}/cancel`, {}); await refresh();}
    catch {if (alive.current) setError('actionError');}
    finally {locked.current = false; if (alive.current) setBusy(false);}
  }
  return <section><h2>{p.rides}</h2><p>{p.rideHelp}</p>
    {error && <p role="alert" className="cc-error">{p[error]}</p>}
    {loading ? <p role="status">{t('checkingCards')}</p> : !cards.length && <p>{p.noCards}</p>}
    {!!cards.length && <form className="cc-panel" onSubmit={event => {event.preventDefault(); void submit();}}>
      <fieldset disabled={busy || !!pending} className="cc-ride-fields">
        <legend>{p.cards}</legend>
        {cards.map(card => <label key={card.id} className="cc-check"><input type="checkbox" checked={selected.includes(card.id)} onChange={() => setSelected(old => old.includes(card.id) ? old.filter(id => id !== card.id) : [...old, card.id])} /><span>{card.name} · {ageLabels[card.ageBand]}</span></label>)}
        <div className="cc-grid"><label>{p.pickup}<select value={pickup} onChange={event => setPickup(event.target.value)}>{stops.map(stop => <option key={stop} value={stop}>{wt(stop)}</option>)}</select></label>
        <label>{p.destination}<select value={destination} onChange={event => setDestination(event.target.value)}>{stops.map(stop => <option key={stop} value={stop}>{wt(stop)}</option>)}</select></label></div>
        <label>{p.phone}<input type="tel" autoComplete="tel" required maxLength={25} value={phone} onChange={event => setPhone(event.target.value)} placeholder="+351…" /></label>
        <div className="cc-actions">{[0,15].map(value => <label key={value} className="cc-check"><input type="radio" name="ready" checked={minutes === value} onChange={() => setMinutes(value)} />{value ? p.later : p.now}</label>)}</div>
      </fieldset>
      {group.some(card => card.ageBand === 'free') && <p className="cc-note">{p.noTuk}</p>}
      <button disabled={busy || (!pending && !valid)}>{pending ? p.retry : p.send}</button>
    </form>}
    {!cards.length && pending && <button disabled={busy} onClick={() => void submit()}>{p.retry}</button>}
    <h2>{p.rideHistory}</h2><button className="secondary" disabled={busy} onClick={() => void refresh()}>{p.refresh}</button>
    {!loading && !error && !rides.length && <p>{p.noRides}</p>}
    {rides.map(ride => <article className="cc-panel" key={ride.id}>
      <h3>{wt(ride.pickupLocation)} → {wt(ride.destination)}</h3>
      <p>{t('status', {status: ride.pickedUpAt && ride.status === 'accepted' ? p.pickedUp : ({pending:p.pending,accepted:p.accepted,completed:p.completed,cancelled:p.cancelled} as Record<string,string>)[ride.status] || t('unknownStatus')})}</p>
      {ride.acceptedByName && <p>{ride.acceptedByName}</p>}{ride.nonTukTuk && <p>{p.noTuk}</p>}
      {['pending','accepted'].includes(ride.status) && !ride.pickedUpAt && <button className="secondary" disabled={busy} onClick={() => void cancel(ride.id)}>{p.cancel}</button>}
    </article>)}
  </section>;
}
