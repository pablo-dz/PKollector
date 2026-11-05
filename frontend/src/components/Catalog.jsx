import { useEffect, useState } from 'react';
import { api } from '../api';
import CardModal from './CardModal';

const PAGE_SIZE = 40;
const EMPTY = { q: '', set_id: '', type: '', rarity: '', supertype: '', owned: '' };

function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Catalog({ owned = {}, onChangeQty, onlyOwned = false }) {
  const [filters, setFilters] = useState(EMPTY);
  const [options, setOptions] = useState({ sets: [], rarities: [], supertypes: [], types: [] });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const q = useDebounce(filters.q);
  const queryKey = JSON.stringify([q, filters.set_id, filters.type, filters.rarity, filters.supertype, filters.owned, onlyOwned]);

  useEffect(() => {
    api('/filters').then(setOptions).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
    const f = { ...filters, q };
    if (onlyOwned) f.owned = 'true';
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setLoading(true);
    setError(null);
    api('/cards?' + params)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, queryKey]);

  const update = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <div className='filters'>
        <input placeholder='Buscar por nombre...' value={filters.q} onChange={update('q')} />
        <select value={filters.set_id} onChange={update('set_id')}>
          <option value=''>Todos los sets</option>
          {options.sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.type} onChange={update('type')}>
          <option value=''>Todos los tipos</option>
          {options.types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.rarity} onChange={update('rarity')}>
          <option value=''>Todas las rarezas</option>
          {options.rarities.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={filters.supertype} onChange={update('supertype')}>
          <option value=''>Todas las categorías</option>
          {options.supertypes.map((s) => <option key={s}>{s}</option>)}
        </select>
        {onChangeQty && !onlyOwned && (
          <select value={filters.owned} onChange={update('owned')}>
            <option value=''>Tengo y me faltan</option>
            <option value='true'>Solo las que tengo</option>
            <option value='false'>Solo las que me faltan</option>
          </select>
        )}
      </div>

      {error ? (
        <p className='error'>No se pudo cargar: {error}</p>
      ) : (
        <p className='count'>{loading ? 'Cargando...' : data.total + ' cartas'}</p>
      )}

      <div className='grid'>
        {data.items.map((c) => (
        <div key={c.id} className={'tile' + (owned[c.id] ? ' owned' : '')}>
            <img src={c.image_small} alt={c.name} loading='lazy' onClick={() => setSelected(c)} />
            <div className='tile-info'>
              <span title={c.name}>{c.name}</span>
              {onChangeQty && (
                <div className='qty'>
                  <button onClick={() => onChangeQty(c.id, (owned[c.id] || 0) - 1)}>-</button>
                  <b>{owned[c.id] || 0}</b>
                  <button onClick={() => onChangeQty(c.id, (owned[c.id] || 0) + 1)}>+</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && data.items.length === 0 && <p className='muted'>No hay cartas con esos filtros.</p>}

      <div className='pager'>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>

      {selected && (
        <CardModal
          card={selected}
          qty={owned[selected.id] || 0}
          onChangeQty={onChangeQty}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}