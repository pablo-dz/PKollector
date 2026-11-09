import { useEffect, useState } from 'react';
import { api } from '../api';

const PAGE = 20;
const MIN_HALF = 5;
const SECONDS_PER_CARD = 2.5;
const SORTS = [
  ['newest', 'Más nuevos primero'],
  ['oldest', 'Más antiguos primero'],
  ['name_asc', 'Nombre (A-Z)'],
  ['name_desc', 'Nombre (Z-A)'],
  ['cards_desc', 'Más cartas primero'],
  ['cards_asc', 'Menos cartas primero'],
  ['progress_desc', 'Más completos primero'],
  ['progress_asc', 'Menos completos primero'],
];

const plain = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true });
const fmtDate = (iso) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'short' }) : '';

// Duplica las cartas para que el carrusel cierre el bucle sin saltos
function withLoop(s) {
  if (s.cards.length === 0) return { ...s, loop: [], duration: 0 };
  const copies = Math.ceil(MIN_HALF / s.cards.length);
  const half = Array.from({ length: copies }, () => s.cards).flat();
  return { ...s, loop: [...half, ...half], duration: half.length * SECONDS_PER_CARD };
}

// La lista se guarda para no pedirla de nuevo cada vez que vuelves a la pestaña
let setsCache = null;

export default function SetsBrowser({ onOpenSet, refreshKey }) {
  const [sets, setSets] = useState(setsCache || []);
  const [progress, setProgress] = useState({});
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE);
  const [loading, setLoading] = useState(!setsCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (setsCache) return;
    api('/sets')
      .then((d) => {
        const prepared = d.map(withLoop);
        setsCache = prepared;
        setSets(prepared);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api('/progress')
      .then((p) => setProgress(Object.fromEntries(p.sets.map((s) => [s.id, s]))))
      .catch(console.error);
  }, [refreshKey]);

  const pct = (s) => {
    const p = progress[s.id];
    const total = p?.total || s.count || 0;
    return total ? (p?.owned || 0) / total : 0;
  };

  const q = plain(query.trim());
  const list = sets
    .filter((s) => !q || plain(s.name).includes(q) || plain(s.series).includes(q))
    .sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.release_date || '9999').localeCompare(b.release_date || '9999') || byName(a, b);
        case 'name_asc': return byName(a, b);
        case 'name_desc': return byName(b, a);
        case 'cards_desc': return b.count - a.count || byName(a, b);
        case 'cards_asc': return a.count - b.count || byName(a, b);
        case 'progress_desc': return pct(b) - pct(a) || byName(a, b);
        case 'progress_asc': return pct(a) - pct(b) || byName(a, b);
        default:
          return (b.release_date || '').localeCompare(a.release_date || '') || byName(a, b);
      }
    });
  const visible = list.slice(0, shown);

  return (
    <div>
      <div className='sets-toolbar'>
        <input
          placeholder='Buscar set o serie...'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
        />
        <select value={sort} onChange={(e) => { setSort(e.target.value); setShown(PAGE); }} title='Ordenar por'>
          {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      {error && <p className='error'>No se pudo cargar: {error}</p>}
      {loading && <p className='muted'>Cargando sets...</p>}
      {!loading && !error && <p className='count'>{list.length} sets</p>}

      {visible.map((s) => {
        const p = progress[s.id];
        const total = p?.total || s.count;
        const have = p?.owned || 0;
        const percent = total ? Math.round((have / total) * 100) : 0;
        return (
          <section key={s.id} className='set-block' onClick={() => onOpenSet(s.id)}>
            <div className='set-block-head'>
              {s.image_logo ? (
                <img className='set-logo' src={s.image_logo} alt={s.name} loading='lazy' />
              ) : (
                <span className='set-logo set-logo-text'>{s.name}</span>
              )}
              <div className='set-block-info'>
                <h3>{s.name}</h3>
                <p className='muted'>
                  {s.series}{s.release_date && ' · ' + fmtDate(s.release_date)} · {s.count} cartas
                </p>
                <div className='set-progress'>
                  <div className='bar'><div style={{ width: percent + '%' }} /></div>
                  <span className='muted'>{have}/{total}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onOpenSet(s.id); }}>Ver set completo →</button>
            </div>

            {s.loop.length > 0 && (
              <div className='carousel'>
                <div className='carousel-track' style={{ '--dur': s.duration + 's' }}>
                  {s.loop.map((c, k) => (
                    <div key={k + '-' + c.id} className='mini-card' title={c.name}>
                      <img src={c.image_small} alt={c.name} loading='lazy' />
                      <span className='num'>#{c.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {!loading && !error && list.length === 0 && <p className='muted'>No hay sets con esa búsqueda.</p>}

      {list.length > shown && (
        <div className='pager'>
          <button onClick={() => setShown(shown + PAGE)}>
            Mostrar más sets ({list.length - shown} restantes)
          </button>
        </div>
      )}
    </div>
  );
}