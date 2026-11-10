import { useEffect, useState } from 'react';
import { api } from '../api';
import CardModal from './CardModal';

const STATUS = [['all', 'Todas'], ['owned', 'Las que tengo'], ['missing', 'Me faltan']];

export default function SetView({ setId, onBack, owned, onChangeQty, wishlist = {}, onToggleWish }) {
  const [info, setInfo] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
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
      <button onClick={onBack}>← Todos los sets</button>

      {error && <p className='error'>No se pudo cargar: {error}</p>}
      {loading && <p className='muted'>Cargando...</p>}

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

          <h3>Tengo {ownedCount} de {total} ({pct}%) · faltan {total - ownedCount}</h3>
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
                    title='Lista de deseos'
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
          {visible.length === 0 && <p className='muted'>No hay cartas en esta vista.</p>}
        </>
      )}

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