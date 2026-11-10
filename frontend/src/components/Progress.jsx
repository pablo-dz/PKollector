import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Progress({ refreshKey, onOpenSet }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [onlyStarted, setOnlyStarted] = useState(true);

  useEffect(() => {
    api('/progress').then(setData).catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <p className='error'>Could not load: {error}</p>;
  if (!data) return <p>Loading...</p>;

  const pct = (o, t) => (t ? Math.round((o / t) * 100) : 0);
  const sets = data.sets.filter((s) => !onlyStarted || s.owned > 0);

  return (
    <div>
      <h2>I have {data.owned} of {data.total} cards ({pct(data.owned, data.total)}%)</h2>
      <label>
        <input type='checkbox' checked={onlyStarted} onChange={(e) => setOnlyStarted(e.target.checked)} />{' '}
        Show only sets I've started
      </label>
      {sets.length === 0 && <p className='muted'>You haven't added any cards yet. Add cards from the catalog.</p>}
      {sets.map((s) => (
        <div key={s.id} className='progress-row'>
          <div>
            <button className='link' onClick={() => onOpenSet(s.id)}>{s.name}</button>{' '}
            <span className='muted'>({s.series})</span>: {s.owned}/{s.total} · {s.total - s.owned} missing
          </div>
          <div className='bar'><div style={{ width: pct(s.owned, s.total) + '%' }} /></div>
        </div>
      ))}
    </div>
  );
}