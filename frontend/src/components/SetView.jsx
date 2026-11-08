import { useEffect, useState } from 'react';
import { api } from '../api';
import CardModal from './CardModal';

const STATUS = [['all', 'All'], ['owned', 'Owned'], ['missing', 'Missing']];

export default function SetView({ setId, onChangeSetId, owned, onChangeQty, wishlist = {}, onToggleWish }) 
{  const [sets, setSets] = useState([]);
  const [info, setInfo] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api('/filters').then((f) => setSets(f.sets)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!setId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    setCards([]);
    const params = new URLSearchParams({ set_id: setId, sort: 'number', page_size: 1000 });
    Promise.all([api('/sets/' + setId), api('/cards?' + params)])
      .then(([s, c]) => {
        if (cancelled) return;
        setInfo(s);
        setCards(c.items);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setId]);

  const total = cards.length;
  const ownedCount = cards.filter((c) => owned[c.id]).length;
  const pct = total ? Math.round((ownedCount / total) * 100) : 0;
  const visible = cards.filter((c) =>
    status === 'all' ? true : status === 'owned' ? owned[c.id] : !owned[c.id]
  );

  return (
    <div>
      <select
        value={setId || ''}
        onChange={(e) => { onChangeSetId(e.target.value); setStatus('all'); }}
      >
        <option value=''>Choose a set...</option>
        {sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {!setId && <p className='muted'>Choose a set to view its checklist.</p>}
      {error && <p className='error'>Could not load: {error}</p>}
      {loading && <p className='muted'>Loading...</p>}

      {info && (
        <>
          <div className='set-header'>
            {info.image_logo && <img src={info.image_logo} alt={info.name} />}
            <div>
              <h2>{info.name}</h2>
              <p className='muted'>
                {info.series}{info.release_date && ' · ' + info.release_date}
              </p>
            </div>
          </div>

          <h3>I have {ownedCount} of {total} ({pct}%) · {total - ownedCount} missing</h3>
          <div className='bar'><div style={{ width: pct + '%' }} /></div>

          <div className='seg'>
            {STATUS.map(([id, label]) => (
              <button key={id} className={status === id ? 'active' : ''} onClick={() => setStatus(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className='grid'>
            {visible.map((c) => (
              <div key={c.id} className={'tile' + (owned[c.id] ? ' owned' : ' missing')}>
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
                  <span title={c.name}><span className='num'>#{c.number}</span> {c.name}</span>
                  <div className='qty'>
                    <button onClick={() => onChangeQty(c.id, (owned[c.id] || 0) - 1)}>-</button>
                    <b>{owned[c.id] || 0}</b>
                    <button onClick={() => onChangeQty(c.id, (owned[c.id] || 0) + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visible.length === 0 && <p className='muted'>No cards in this view.</p>}
        </>
      )}

      {selected && (
        <CardModal
          card={selected}
          qty={owned[selected.id] || 0}
          onChangeQty={onChangeQty}
          onClose={() => setSelected(null)}
          wanted={!!wishlist[selected.id]}
          onToggleWish={onToggleWish}
        />
      )}
    </div>
  );
}