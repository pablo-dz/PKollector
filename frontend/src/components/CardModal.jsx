import { useEffect, useState } from 'react';
import { api } from '../api';
import { EnergyIcon, EnergyList } from './EnergyIcon';

const EMPTY = { rules: [], abilities: [], attacks: [], weaknesses: [], resistances: [], retreat_cost: [] };

export default function CardModal({ card: summary, qty = 0, onChangeQty, wanted = false, onToggleWish, onClose }) {
  const [full, setFull] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api('/cards/' + summary.id)
      .then((c) => { if (!cancelled) setFull(c); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [summary.id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const card = full ?? { ...EMPTY, ...summary };

  const matchups = (label, list) => list.length > 0 && (
    <p className='stat-line'>
      {label}:
      {list.map((x) => (
        <span key={x.type} className='stat'>
          <EnergyIcon type={x.type} /> {x.value}
        </span>
      ))}
    </p>
  );

  return (
    <div className='overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <img src={card.image_large} alt={card.name} />
        <div className='modal-body'>
          <h2>{card.name}</h2>
            <p className='muted set-line'>
              <span>{card.set_name}</span>
              {card.set_symbol && <img className='set-symbol' src={card.set_symbol} alt='' />}
              <span>· #{card.number} · {card.rarity || 'No rarity'}</span>
            </p>
          <p className='type-line'>
            {card.supertype}
            {card.subtypes?.length > 0 && ' · ' + card.subtypes.join(', ')}
            {card.hp && ' · HP ' + card.hp}
            {card.types?.length > 0 && (
              <>
                {' · '}
                <EnergyList types={card.types} />
              </>
            )}
          </p>

          {!full && !error && <p className='muted'>Loading details...</p>}
          {error && <p className='error'>Could not load details: {error}</p>}

          {card.evolves_from && <p>Evolves from: {card.evolves_from}</p>}
          {card.rules.map((r, i) => <p key={i}><i>{r}</i></p>)}
          {card.abilities.map((a, i) => (
            <p key={a.name + i}><b>{a.type}: {a.name}</b><br />{a.text}</p>
          ))}

          {card.attacks.map((a, i) => (
            <div key={a.name + i} className='attack'>
              <div className='attack-head'>
                <EnergyList types={a.cost} />
                <b>{a.name}</b>
                {a.damage && <span className='dmg'>{a.damage}</span>}
              </div>
              {a.text && <p className='muted'>{a.text}</p>}
            </div>
          ))}

          {matchups('Weakness', card.weaknesses)}
          {matchups('Resistance', card.resistances)}
          {card.retreat_cost.length > 0 && (
            <p className='stat-line'>
              Retreat cost: <EnergyList types={card.retreat_cost} />
            </p>
          )}

          {card.flavor_text && <p className='muted'><i>{card.flavor_text}</i></p>}
          {card.artist && <p className='muted'>Artist: {card.artist}</p>}

          {onChangeQty && (
            <div className='qty'>
              <button onClick={() => onChangeQty(card.id, qty - 1)}>-</button>
              <b>{qty} in my collection</b>
              <button onClick={() => onChangeQty(card.id, qty + 1)}>+</button>
            </div>
          )}
          <p>
            {onToggleWish && (
              <button onClick={() => onToggleWish(card.id)}>
                {wanted ? '★ In my wishlist' : '☆ Add to wishlist'}
              </button>
            )}{' '}
            <button onClick={onClose}>Close</button>
          </p>
        </div>
      </div>
    </div>
  );
}