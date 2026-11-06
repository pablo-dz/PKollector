import { useEffect, useState } from 'react';
import { api } from './api';
import Catalog from './components/Catalog';
import Progress from './components/Progress';
import './App.css';
import SetView from './components/SetView';


const TABS = [['catalog', 'Catálogo'], ['sets', 'Sets'], ['mine', 'Mi colección'], ['progress', 'Progreso']];

export default function App() {
  const [tab, setTab] = useState('catalog');
  const [owned, setOwned] = useState({});
  const [version, setVersion] = useState(0);
  const [setId, setSetId] = useState('');

  useEffect(() => {
    api('/collection').then(setOwned).catch(console.error);
  }, []);

  const changeQty = async (cardId, qty) => {
    qty = Math.max(0, qty);
    setOwned((o) => {
      const next = { ...o };
      if (qty) next[cardId] = qty;
      else delete next[cardId];
      return next;
    });
    try {
      await api('/collection/' + cardId, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
      setVersion((v) => v + 1);
    } catch (e) {
      console.error(e);
      api('/collection').then(setOwned).catch(console.error);
    }
  };

  return (
    <div className='app'>
      <h1>PKollector</h1>
      <div className='tabs'>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'catalog' && <Catalog owned={owned} onChangeQty={changeQty} />}
      {tab === 'mine' && <Catalog owned={owned} onChangeQty={changeQty} onlyOwned />}
      {tab === 'sets' && (
        <SetView setId={setId} onChangeSetId={setSetId} owned={owned} onChangeQty={changeQty} />
      )}
      {tab === 'progress' && (
        <Progress
          refreshKey={version}
          onOpenSet={(id) => { setSetId(id); setTab('sets'); }}
        />
      )}    
    </div>
  );
}