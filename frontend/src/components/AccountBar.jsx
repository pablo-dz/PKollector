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
      setError('El usuario debe tener de 3 a 30 caracteres: letras, números o guion bajo.');
      return;
    }
    if (mode === 'register' && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
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
        <span className='nav-user'>Hola, {username}</span>
        <button className='nav-btn' onClick={() => { logout(); window.location.reload(); }}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className='account'>
      <button className='nav-btn' onClick={() => setMode('login')}>Iniciar sesión</button>
      <button className='nav-btn' onClick={() => setMode('register')}>Crear cuenta</button>
      {mode && (
        <div className='overlay' onClick={close}>
          <form className='auth-box' onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h3>
            <input
              placeholder='Usuario'
              value={form.username}
              autoFocus
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              type='password'
              placeholder='Contraseña'
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {mode === 'register' && (
              <p className='muted'>Las cartas que ya marcaste en este navegador pasarán a tu cuenta.</p>
            )}
            {mode === 'login' && (
              <p className='muted'>
                Verás la colección de tu cuenta. Lo que marcaste sin cuenta en este navegador no se mezcla.
              </p>
            )}
            {error && <p className='error'>{error}</p>}
            <button type='submit' disabled={busy}>
              {busy ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
            <button type='button' onClick={close}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}