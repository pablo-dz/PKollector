import { useEffect, useState } from 'react';
import { api } from '../api';
import CardModal from './CardModal';

const PAGE_SIZE = 40;
const EMPTY = {
  q: '', set_id: '', series: '', type: '', subtype: '', rarity: '', supertype: '',
  hp_min: '', hp_max: '', owned: '', sort: 'name',
};
const SORTS = [
  ['name', 'Name (A-Z)'],
  ['newest', 'Newest First'],
  ['oldest', 'Oldest First'],
  ['hp_desc', 'HP Highest to Lowest'],
  ['hp_asc', 'HP Lowest to Highest'],
  ['number', 'Card Number'],
];

function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Catalog({
  owned = {}, onChangeQty, onlyOwned = false,
  wishlist = {}, onToggleWish, fixed = {}, showExtras = false,
}) {
  const [filters, setFilters] = useState(EMPTY);
  const [options, setOptions] = useState({
    sets: [], series: [], rarities: [], supertypes: [], subtypes: [], types: [],
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const q = useDebounce(filters.q);
  const hpMin = useDebounce(filters.hp_min);
  const hpMax = useDebounce(filters.hp_max);

  const applied = { ...filters, q, hp_min: hpMin, hp_max: hpMax, ...fixed };
  if (onlyOwned) applied.owned = 'true';
  const queryKey = JSON.stringify(applied);

  useEffect(() => {
    api('/filters').then(setOptions).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
    Object.entries(applied).forEach(([k, v]) => {
      if (v !== '' && v != null) params.set(k, v);
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
  // When the series changes, clear the selected set in case it belongs to another series.
  const updateSeries = (e) => {
    setFilters((f) => ({ ...f, series: e.target.value, set_id: '' }));
    setPage(1);
  };
  const clear = () => {
    setFilters(EMPTY);
    setPage(1);
  };

  const setsShown = filters.series
    ? options.sets.filter((s) => s.series === filters.series)
    : options.sets;
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <div className='filters'>
        <input placeholder='Search by name...' value={filters.q} onChange={update('q')} />
        <select value={filters.series} onChange={updateSeries}>
          <option value=''>All Series</option>
          {options.series.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.set_id} onChange={update('set_id')}>
          <option value=''>All Sets</option>
          {setsShown.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.supertype} onChange={update('supertype')}>
          <option value=''>All Categories</option>
          {options.supertypes.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.subtype} onChange={update('subtype')}>
          <option value=''>All Subtypes</option>
          {options.subtypes.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.type} onChange={update('type')}>
          <option value=''>All Types</option>
          {options.types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.rarity} onChange={update('rarity')}>
          <option value=''>All Rarities</option>
          {options.rarities.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input
          className='small-input' type='number' min='0' placeholder='Min HP'
          value={filters.hp_min} onChange={update('hp_min')}
        />
        <input
          className='small-input' type='number' min='0' placeholder='Max HP'
          value={filters.hp_max} onChange={update('hp_max')}
        />
        {onChangeQty && !onlyOwned && (
          <select value={filters.owned} onChange={update('owned')}>
            <option value=''>Owned and missing</option>
            <option value='true'>Only cards I own</option>
            <option value='false'>Only cards I'm missing</option>
          </select>
        )}
        <select value={filters.sort} onChange={update('sort')} title='Sort by'>
          {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        {hasFilters && <button onClick={clear}>Clear filters</button>}
      </div>

      {error ? (
        <p className='error'>Failed to load: {error}</p>
      ) : (
        <p className='count'>{loading ? 'Loading...' : data.total + ' cards'}</p>
      )}

      <div className='grid'>
        {data.items.map((c) => (
          <div key={c.id} className={'tile' + (owned[c.id] ? ' owned' : '')}>
            <img src={c.image_small} alt={c.name} loading='lazy' onClick={() => setSelected(c)} />
            {onToggleWish && (
              <button
                className={'star' + (wishlist[c.id] ? ' on' : '')}
                title='Wishlist'
                onClick={() => onToggleWish(c.id)}
              >
                {wishlist[c.id] ? '★' : '☆'}
              </button>
            )}
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
            {showExtras && owned[c.id] > 1 && <div className='num'>You have {owned[c.id] - 1} extra</div>}
          </div>
        ))}
      </div>

      {!loading && !error && data.items.length === 0 && <p className='muted'>No cards match those filters.</p>}

      <div className='pager'>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {selected && (
        <CardModal
          card={selected}
          qty={owned[selected.id] || 0}
          onChangeQty={onChangeQty}
          wanted={!!wishlist[selected.id]}
          onToggleWish={onToggleWish}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}