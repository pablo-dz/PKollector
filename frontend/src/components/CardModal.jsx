import { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY = { rules: [], abilities: [], attacks: [], weaknesses: [], resistances: [], retreat_cost: [] };

export default function CardModal({ card: summary, qty = 0, onChangeQty, onClose }) {
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
  const pair = (list) => list.map((x) => x.type + ' ' + x.value).join(', ');

  return (
    <div className='overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <img src={card.image_large} alt={card.name} />
        <div className='modal-body'>
          <h2>{card.name}</h2>
          <p className='muted'>
            {card.set_name} · N° {card.number} · {card.rarity || 'Sin rareza'}
          </p>
          <p>
            {card.supertype}
            {card.subtypes?.length > 0 && ' · ' + card.subtypes.join(', ')}
            {card.hp && ' · HP ' + card.hp}
            {card.types?.length > 0 && ' · ' + card.types.join(', ')}
          </p>

          {!full && !error && <p className='muted'>Cargando detalle...</p>}
          {error && <p className='error'>No se pudo cargar el detalle: {error}</p>}

          {card.evolves_from && <p>Evoluciona de: {card.evolves_from}</p>}
          {card.rules.map((r, i) => <p key={i}><i>{r}</i></p>)}
          {card.abilities.map((a) => (
            <p key={a.name}><b>{a.type}: {a.name}</b><br />{a.text}</p>
          ))}
          {card.attacks.map((a) => (
            <p key={a.name}>
              <b>{a.name}</b> {a.damage && ' · ' + a.damage}
              <br /><span className='muted'>{a.cost.join(' ')}</span>
              {a.text && <><br />{a.text}</>}
            </p>
          ))}

          {card.weaknesses.length > 0 && <p>Debilidad: {pair(card.weaknesses)}</p>}
          {card.resistances.length > 0 && <p>Resistencia: {pair(card.resistances)}</p>}
          {card.retreat_cost.length > 0 && <p>Retirada: {card.retreat_cost.length}</p>}

          {card.flavor_text && <p className='muted'><i>{card.flavor_text}</i></p>}
          {card.artist && <p className='muted'>Ilustrador: {card.artist}</p>}

          {onChangeQty && (
            <div className='qty'>
              <button onClick={() => onChangeQty(card.id, qty - 1)}>-</button>
              <b>{qty} en mi colección</b>
              <button onClick={() => onChangeQty(card.id, qty + 1)}>+</button>
            </div>
          )}
          <p><button onClick={onClose}>Cerrar</button></p>
        </div>
      </div>
    </div>
  );
}