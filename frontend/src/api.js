const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export function getUserId() {
  let id = localStorage.getItem('pk_user');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('pk_user', id);
  }
  return id;
}

export const getUsername = () => localStorage.getItem('pk_name');

export function setSession(userId, username) {
  localStorage.setItem('pk_user', userId);
  localStorage.setItem('pk_name', username);
}

export function logout() {
  localStorage.removeItem('pk_name');
  localStorage.setItem('pk_user', crypto.randomUUID());
}

export async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': getUserId(), ...options.headers },
  });
  if (!res.ok) {
    let msg = 'Error ' + res.status;
    try {
      const data = await res.json();
      if (typeof data.detail === 'string') msg = data.detail;
    } catch {
      // la respuesta no traía detalle
    }
    throw new Error(msg);
  }
  return res.json();
}