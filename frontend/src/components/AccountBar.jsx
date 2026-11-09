import { useState } from 'react';
import { api, getUserId, getUsername, setSession, logout } from '../api';

export default function AccountBar() {
  const username = getUsername();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setMode(null); setError(null); };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(name)) {
      setError('The username must be 3 to 30 characters long and may contain only letters, numbers, and underscores.');
      return;
    }
    if (mode === 'register' && form.password.length < 6) {
      setError('The password must be at least 6 characters long.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = { username: name, password: form.password };
      if (mode === 'register') body.guest_id = getUserId();
      const res = await api('/auth/' + mode, { method: 'POST', body: JSON.stringify(body) });
      setSession(res.user_id, res.username);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (username) {
    return (
      <div className='account'>
        <span className='nav-user'>Hello, {username}</span>
        <button className='nav-btn nav-logout' onClick={() => { logout(); window.location.reload(); }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className='account'>
      <button className='nav-btn nav-login' onClick={() => setMode('login')}>Iniciar sesión</button>
      <button className='nav-btn' onClick={() => setMode('register')}>Create Account</button>
      {mode && (
        <div className='overlay' onClick={close}>
          <form className='auth-box' onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>{mode === 'login' ? 'Login' : 'Create Account'}</h3>
            <input
              placeholder='Username'
              value={form.username}
              autoFocus
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              type='password'
              placeholder='Password'
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {mode === 'register' && (
              <p className='muted'>The cards you have already marked in this browser will be transferred to your account.</p>
            )}
            {mode === 'login' && (
              <p className='muted'>
                Your account collection will be shown. Cards marked in this browser while logged out won't be merged with it.
              </p>
            )}
            {error && <p className='error'>{error}</p>}
            <button type='submit' className={mode === 'login' ? 'btn-login' : ''} disabled={busy}>
              {busy ? 'Sending...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
            <button type='button' onClick={close}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}