import logo from '../assets/logo_pkollector.png';

export default function Navbar({ tabs, tab, onTab, children }) {
  return (
    <header className='navbar'>
      <button className='nav-logo' onClick={() => onTab(tabs[0][0])} title='Ir al catálogo'>
        <img src={logo} alt='PKollector' />
      </button>
      <nav className='nav-tabs'>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={'nav-tab' + (tab === id ? ' active' : '')}
            onClick={() => onTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className='nav-right'>{children}</div>
    </header>
  );
}