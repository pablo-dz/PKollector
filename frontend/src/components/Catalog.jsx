import { useEffect, useState } from 'react';
import { api } from '../api';
import CardModal from './CardModal';
import { EnergyIcon } from './EnergyIcon';

const PAGE_SIZE = 40;
const EMPTY = {
  q: '', set_id: '', series: '', type: '', subtype: '', rarity: '', supertype: '',
  hp_min: '', hp_max: '', owned: '', sort: 'name',
};
const SORTS = [
  ['name', 'Name (A-Z)'],
  ['newest', 'Newest First'],
  ['oldest', 'Oldest First'],
  ['hp_desc', 'Highest HP First'],
  ['hp_asc', 'Lowest HP First'],
  ['number', 'Card Number'],
];
const OWNED = [['', 'All Cards'], ['true', 'Owned'], ['false', 'Missing']];
const OWNED_LABEL = { true: 'Owned only', false: 'Missing only' };

function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Field({ label, children }) {
  return (
    <div className='field'>
      <span className='field-title'>{label}</span>
      {children}
    </div>
  );
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
  const [open, setOpen] = useState(false);

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

  const change = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const update = (key) => (e) => change({ [key]: e.target.value });
  const clearChips = () => {
    setFilters((f) => ({ ...EMPTY, q: f.q, sort: f.sort }));
    setPage(1);
  };

  const setsShown = filters.series
    ? options.sets.filter((s) => s.series === filters.series)
    : options.sets;
  const setName = options.sets.find((s) => s.id === filters.set_id)?.name;

  const chips = [];
  if (filters.series) chips.push({ key: 'series', label: 'Series: ' + filters.series, patch: { series: '' } });
  if (filters.set_id) chips.push({ key: 'set', label: 'Set: ' + (setName || filters.set_id), patch: { set_id: '' } });
  if (filters.supertype) chips.push({ key: 'supertype', label: 'Category: ' + filters.supertype, patch: { supertype: '' } });
  if (filters.subtype) chips.push({ key: 'subtype', label: 'Subtype: ' + filters.subtype, patch: { subtype: '' } });
  if (filters.type) chips.push({ key: 'type', label: 'Type: ' + filters.type, icon: filters.type, patch: { type: '' } });
  if (filters.rarity) chips.push({ key: 'rarity', label: 'Rarity: ' + filters.rarity, patch: { rarity: '' } });
  if (filters.hp_min || filters.hp_max) {
    chips.push({
      key: 'hp',
      label: 'HP ' + (filters.hp_min || '0') + '–' + (filters.hp_max || '∞'),
      patch: { hp_min: '', hp_max: '' },
    });
  }
  if (filters.owned && !onlyOwned) chips.push({ key: 'owned', label: OWNED_LABEL[filters.owned], patch: { owned: '' } });

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <div className='toolbar'>
        <input className='search' placeholder='Search by name...' value={filters.q} onChange={update('q')} />
        <select className='select sort' value={filters.sort} onChange={update('sort')} title='Sort by'>
          {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <button className='filters-toggle' aria-expanded={open} onClick={() => setOpen(!open)}>
          Filters
          {chips.length > 0 && <span className='badge'>{chips.length}</span>}
        </button>
      </div>

      {chips.length > 0 && (
        <div className='chips'>
          {chips.map((c) => (
            <button key={c.key} className='chip' title='Remove filter' onClick={() => change(c.patch)}>
              {c.icon && <EnergyIcon type={c.icon} size={16} />}
              {c.label}
              <span className='x'>✕</span>
            </button>
          ))}
          <button className='link' onClick={clearChips}>Clear all</button>
        </div>
      )}

      {open && (
        <div className='panel'>
          <Field label='Type'>
            <div className={'types' + (filters.type ? ' has-active' : '')}>
              {options.types.map((t) => (
                <button
                  key={t}
                  className={'type-btn' + (filters.type === t ? ' on' : '')}
                  title={t}
                  aria-pressed={filters.type === t}
                  onClick={() => change({ type: filters.type === t ? '' : t })}
                >
                  <EnergyIcon type={t} size={28} />
                </button>
              ))}
            </div>
          </Field>

          <div className='panel-grid'>
            <Field label='Series'>
              <select
                className='select' aria-label='Series' value={filters.series}
                onChange={(e) => change({ series: e.target.value, set_id: '' })}
              >
                <option value=''>All Series</option>
                {options.series.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label='Set'>
              <select className='select' aria-label='Set' value={filters.set_id} onChange={update('set_id')}>
                <option value=''>All Sets</option>
                {setsShown.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label='Category'>
              <select className='select' aria-label='Category' value={filters.supertype} onChange={update('supertype')}>
                <option value=''>All Categories</option>
                {options.supertypes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label='Subtype'>
              <select className='select' aria-label='Subtype' value={filters.subtype} onChange={update('subtype')}>
                <option value=''>All Subtypes</option>
                {options.subtypes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label='Rarity'>
              <select className='select' aria-label='Rarity' value={filters.rarity} onChange={update('rarity')}>
                <option value=''>All Rarities</option>
                {options.rarities.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label='HP'>
              <div className='range'>
                <input
                  type='number' min='0' placeholder='Min' aria-label='Minimum HP'
                  value={filters.hp_min} onChange={update('hp_min')}
                />
                <input
                  type='number' min='0' placeholder='Max' aria-label='Maximum HP'
                  value={filters.hp_max} onChange={update('hp_max')}
                />
              </div>
            </Field>
            {onChangeQty && !onlyOwned && (
              <Field label='Collection Status'>
                <div className='seg'>
                  {OWNED.map(([value, label]) => (
                    <button
                      key={value}
                      className={filters.owned === value ? 'active' : ''}
                      onClick={() => change({ owned: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className='error'>Could not load: {error}</p>
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
            {showExtras && owned[c.id] > 1 && <div className='num'>{owned[c.id] - 1} extra copies</div>}
          </div>
        ))}
      </div>

      {!loading && !error && data.items.length === 0 && <p className='muted'>No cards match these filters.</p>}

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