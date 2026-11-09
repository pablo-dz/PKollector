import { useEffect, useState } from 'react';
import { api } from './api';
import AccountBar from './components/AccountBar';
import Catalog from './components/Catalog';
import Navbar from './components/Navbar';
import Progress from './components/Progress';
import SetView from './components/SetView';
import './App.css';
import SetsBrowser from './components/SetsBrowser';

const TABS = [
  ['catalog', 'Catalog'], ['sets', 'Sets'], ['mine', 'My Collection'],
  ['dups', 'Duplicates'], ['wishlist', 'Wishlist'], ['progress', 'Progress'],
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
      <Navbar
        tabs={TABS}
        tab={tab}
        onTab={(id) => {
          if (id === 'sets' && tab === 'sets') setSetId('');
          setTab(id);
        }}
      >
        <AccountBar />
      </Navbar>

      <main className='app'>
        <h1 className='sr-only'>PKollector</h1>

        {tab === 'catalog' && <Catalog {...shared} />}
        {tab === 'sets' && (
          setId ? (
            <SetView {...shared} setId={setId} onBack={() => setSetId('')} />
          ) : (
            <SetsBrowser onOpenSet={setSetId} refreshKey={version} />
          )
        )}
        {tab === 'mine' && <Catalog {...shared} onlyOwned />}
        {tab === 'dups' && (
          <>
            <p className='muted'>
              You have {dupCards} duplicate cards ({extraCopies} copies to trade).
            </p>
            <Catalog {...shared} fixed={{ duplicates: 'true' }} showExtras />
          </>
        )}
        {tab === 'wishlist' && (
          <>
            <p className='muted'>{Object.keys(wishlist).length} cards in your wishlist.</p>
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
        PKollector is a fan project without profit motive, not affiliated with Nintendo, Creatures, GAME FREAK or The
        Pokémon Company. Pokémon and its names are trademarks of their respective owners.
      </footer>
    </>
  );
}