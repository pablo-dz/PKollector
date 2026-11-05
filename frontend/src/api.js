const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export function getUserId() {
  let id = localStorage.getItem('pk_user');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('pk_user', id);
  }
  return id;
}

export async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': getUserId(), ...options.headers },
  });
  if (!res.ok) throw new Error('API ' + res.status);
  return res.json();
}