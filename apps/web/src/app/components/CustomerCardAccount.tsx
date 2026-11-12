import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {useEffect, useRef, useState, type ReactNode} from 'react';
import type {User} from '@supabase/supabase-js';
import {Link} from 'react-router';
import {cardSandboxUrl, customerClient} from '../lib/customerCards';
import './CustomerCityCards.css';
import {getProfileCopy} from '../lib/translations/profileCopy';

export function CustomerCardAccount({children}: {children: (user: User) => ReactNode}) {
  const {language, t} = useCardTranslation();
  if (cardSandboxUrl) {
    const fixture: User = {id: '00000000-0000-4000-8000-000000000001', email: 'customer@example.invalid', user_metadata: {full_name: 'Sandbox Customer'}, app_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z'};
    return <main className="customer-cards" lang={language}><div className="cc-error" role="status"><strong>{t('testTitle')}</strong><p>{t('testHelp')}</p></div><nav className="cc-nav" aria-label={t('testCards')}><Link to="/buy-ticket">{t('testBuy')}</Link><Link to="/my-cards">{t('testCards')}</Link></nav>{children(fixture)}</main>;
  }
  return <VerifiedCustomerAccount>{children}</VerifiedCustomerAccount>;
}
function VerifiedCustomerAccount({children}: {children: (user: User) => ReactNode}) {
  const {language, t, error: translateError} = useCardTranslation();
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false);
  const [email, setEmail] = useState(''), [sentTo, setSentTo] = useState(''), [code, setCode] = useState('');
  const [name, setName] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0), [revision, setRevision] = useState(0);
  const locked = useRef(false);
  useEffect(() => {
    let active = true, changed = false;
    setReady(false);
    const {data: {subscription}} = customerClient.auth.onAuthStateChange((_event, session) => {
      changed = true;
      if (active) {setUser(session?.user ?? null); setReady(true);}
    });
    customerClient.auth.getSession().then(({data, error}) => {
      if (!active || changed) return;
      if (error) setError(t('restoreError'));
      else setUser(data.session?.user ?? null);
      setReady(true);
    }).catch(() => {if (active) {setError(t('restoreError')); setReady(true);}});
    return () => {active = false; subscription.unsubscribe();};
  }, [revision]);
  useEffect(() => {if (!cooldown) return; const timer = setTimeout(() => setCooldown(n => n - 1), 1000); return () => clearTimeout(timer);}, [cooldown]);
  async function run(task: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {await task();} catch (e) {setError(translateError(e, 'authError'));}
    finally {locked.current = false; setBusy(false);}
  }
  async function sendCode() {
    if (cooldown) return;
    const address = (sentTo || email).trim().toLowerCase();
    const {error} = await customerClient.auth.signInWithOtp({email: address, options: {shouldCreateUser: true}});
    if (error) throw new Error(error.status === 429 ? t('waitCode') : t('sendError'));
    setSentTo(address); setCode(''); setCooldown(60);
  }
  return <main className="customer-cards" lang={language}>
    <nav className="cc-nav" aria-label={getProfileCopy(language).profile}><Link to="/profile">{getProfileCopy(language).profile}</Link><Link to="/buy-ticket">{t('buy')}</Link><Link to="/manage-booking">{t('existing')}</Link></nav>
    {!ready ? <p role="status">{t('checkingAccount')}</p> : !user ? <section className="cc-panel cc-account">
      <p className="cc-eyebrow">{t('oneAccount')}</p><h1>{t('welcome')}</h1>
      <p>{t('accountIntro')}</p>
      {!sentTo ? <form onSubmit={e => {e.preventDefault(); void run(sendCode);}}>
        <label>{t('email')}<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <p>{t('codeHelp')}</p>
        <button disabled={busy || cooldown > 0}>{busy ? t('sending') : cooldown ? t('tryIn', {seconds: cooldown}) : t('sendCode')}</button>
      </form> : <form onSubmit={e => {e.preventDefault(); void run(async () => {
        const {error} = await customerClient.auth.verifyOtp({email: sentTo, token: code.trim(), type: 'email'});
        if (error) throw new Error(t('invalidCode'));
      });}}>
        <p>{t('codeSent', {email: sentTo})}</p>
        <label>{t('code')}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" required maxLength={8} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label>
        <div className="cc-actions"><button disabled={busy}>{t('verify')}</button><button type="button" className="secondary" disabled={busy || cooldown > 0} onClick={() => void run(sendCode)}>{cooldown ? t('resendIn', {seconds: cooldown}) : t('resend')}</button><button type="button" className="secondary" disabled={busy} onClick={() => {setSentTo(''); setCode('');}}>{t('anotherEmail')}</button></div>
      </form>}
      <p><Link to="/privacy-policy">{t('privacy')}</Link> · <Link to="/">{t('browse')}</Link></p>
    </section> : <>
      <div className="cc-account-bar"><span>{user.email}</span><button className="secondary" disabled={busy} onClick={() => void run(async () => {const {error} = await customerClient.auth.signOut({scope: 'local'}); if (error) throw error; setSentTo(''); setCode('');})}>{t('signOut')}</button></div>
      {!String(user.user_metadata?.full_name || '').trim() ? <section className="cc-panel"><h1>{t('askName')}</h1><p>{t('nameHelp')}</p><form onSubmit={e => {e.preventDefault(); void run(async () => {
        if (!name.trim()) throw new Error(t('enterName'));
        const {error} = await customerClient.auth.updateUser({data: {full_name: name.trim()}}); if (error) throw error;
      });}}><label>{t('name')}<input autoComplete="name" required maxLength={60} value={name} onChange={e => setName(e.target.value)} /></label><button disabled={busy}>{t('saveName')}</button></form></section> : <div key={user.id}>{children(user)}</div>}
    </>}
    {error && <div className="cc-error" role="alert">{translateError(error)} <button className="secondary" onClick={() => {setError(''); setRevision(n => n + 1);}}>{t('retryConnection')}</button></div>}
  </main>;
}
