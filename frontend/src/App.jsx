import { useEffect, useState } from 'react';
import { api } from './api';
import AccountBar from './components/AccountBar';
import Catalog from './components/Catalog';
import Navbar from './components/Navbar';
import Progress from './components/Progress';
import SetView from './components/SetView';
import './App.css';

const TABS = [
  ['catalog', 'Catálogo'], ['sets', 'Sets'], ['mine', 'Mi colección'],
  ['dups', 'Repetidas'], ['wishlist', 'Deseos'], ['progress', 'Progreso'],
];

const idsToMap = (ids) => Object.fromEntries(ids.map((id) => [id, true]));

export default function App() {
  const [tab, setTab] = useState('catalog');
  const [owned, setOwned] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [version, setVersion] = useState(0);
  const [setId, setSetId] = useState('');

  useEffect(() => {
    api('/collection').then(setOwned).catch(console.error);
    api('/wishlist').then((ids) => setWishlist(idsToMap(ids))).catch(console.error);
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

  const toggleWish = async (cardId) => {
    const wanted = !wishlist[cardId];
    setWishlist((w) => {
      const next = { ...w };
      if (wanted) next[cardId] = true;
      else delete next[cardId];
      return next;
    });
    try {
      await api('/wishlist/' + cardId, { method: 'PUT', body: JSON.stringify({ wanted }) });
    } catch (e) {
      console.error(e);
      api('/wishlist').then((ids) => setWishlist(idsToMap(ids))).catch(console.error);
    }
  };

  const dupCards = Object.values(owned).filter((q) => q > 1).length;
  const extraCopies = Object.values(owned).reduce((s, q) => s + Math.max(q - 1, 0), 0);
  const shared = { owned, onChangeQty: changeQty, wishlist, onToggleWish: toggleWish };

  return (
    <>
      <Navbar tabs={TABS} tab={tab} onTab={setTab}>
        <AccountBar />
      </Navbar>

      <main className='app'>
        <h1 className='sr-only'>PKollector</h1>

        {tab === 'catalog' && <Catalog {...shared} />}
        {tab === 'sets' && <SetView {...shared} setId={setId} onChangeSetId={setSetId} />}
        {tab === 'mine' && <Catalog {...shared} onlyOwned />}
        {tab === 'dups' && (
          <>
            <p className='muted'>
              Tienes {dupCards} cartas con copias de sobra ({extraCopies} copias para intercambiar).
            </p>
            <Catalog {...shared} fixed={{ duplicates: 'true' }} showExtras />
          </>
        )}
        {tab === 'wishlist' && (
          <>
            <p className='muted'>{Object.keys(wishlist).length} cartas en tu lista de deseos.</p>
            <Catalog {...shared} fixed={{ wanted: 'true' }} />
          </>
        )}
        {tab === 'progress' && (
          <Progress
            refreshKey={version}
            onOpenSet={(id) => { setSetId(id); setTab('sets'); }}
          />
        )}
      </main>

      <footer className='footer'>
        PKollector es un proyecto fan sin fines de lucro, no afiliado a Nintendo, Creatures, GAME FREAK ni The
        Pokémon Company. Pokémon y sus nombres son marcas de sus respectivos dueños.
      </footer>
    </>
  );
}