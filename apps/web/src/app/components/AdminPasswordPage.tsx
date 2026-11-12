import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { adminClient } from '../lib/adminClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function AdminPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('Checking your secure link…');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    // Remove recovery tokens from the address bar before rendering other links.
    window.history.replaceState(null, '', window.location.pathname);
    void (async () => {
      try {
        if (access_token && refresh_token && ['recovery','invite'].includes(params.get('type') || '')) {
          const { error } = await adminClient.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }
        const { data, error } = await adminClient.auth.getUser();
        if (error || data.user?.app_metadata?.role !== 'admin') throw new Error('Invalid session');
        if (active) { setReady(true); setMessage('Choose a unique password of at least 12 characters.'); }
      } catch {
        if (active) setMessage('This link is invalid or expired. Request a new password reset from the admin login page.');
      }
    })();
    return () => { active = false; };
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !ready) return;
    if (password.length < 12 || password !== confirmation) {
      setMessage('Use at least 12 characters and enter the same password twice.'); return;
    }
    setBusy(true);
    try {
      const { error } = await adminClient.auth.updateUser({ password });
      if (error) throw error;
      await adminClient.auth.signOut();
      setReady(false); setMessage('Password saved. Sign in as vascotimm with your new password.');
    } catch {
      setMessage('Unable to update your password. Request a fresh reset link and try again.');
    } finally { setPassword(''); setConfirmation(''); setBusy(false); }
  };
  return <main className="mx-auto max-w-md px-6 py-16">
    <h1 className="mb-4 text-2xl">Set administrator password</h1>
    <p role="status" className="mb-6">{message}</p>
    {ready && <form onSubmit={save} className="space-y-4">
      <Label htmlFor="new-password">New password</Label>
      <Input id="new-password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} />
      <Label htmlFor="confirm-password">Confirm password</Label>
      <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={e=>setConfirmation(e.target.value)} />
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button>
    </form>}
    <Link to="/admin" className="mt-6 block underline">Back to admin sign-in</Link>
  </main>;
}
