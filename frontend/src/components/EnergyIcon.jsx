const TYPES = {
  Colorless: {
    bg: '#9ca3af', edge: '#6b7280',
    glyph: <path d='M12 4.5l2.2 4.8 5.2.6-3.9 3.5 1.1 5.1L12 16l-4.6 2.5 1.1-5.1-3.9-3.5 5.2-.6z' fill='#fff' />,
  },
  Darkness: {
    bg: '#3f3a5a', edge: '#1f1b33',
    glyph: <path d='M15.5 5.5a7 7 0 1 0 3 11.5 5.5 5.5 0 0 1-3-11.5z' fill='#e5e7eb' />,
  },
  Dragon: {
    bg: '#c58a0a', edge: '#8a5e00',
    glyph: (
      <path
        d='M7 6.5c3.2.2 5 2.2 5 5.5l-2 6c-3-1-4.8-3.8-4.8-7.4zM17 6.5c-3.2.2-5 2.2-5 5.5l2 6c3-1 4.8-3.8 4.8-7.4z'
        fill='#fff'
      />
    ),
  },
  Fairy: {
    bg: '#ec7fb8', edge: '#b85088',
    glyph: <path d='M12 3.5l1.9 6.6 6.6 1.9-6.6 1.9L12 20.5l-1.9-6.6L3.5 12l6.6-1.9z' fill='#fff' />,
  },
    Fighting: {
    bg: '#c2571a', edge: '#8f3d0f',
    glyph: (
      <g transform='translate(0 -1)'>
        <g fill='#fff'>
          <rect x='6.4' y='7' width='2.45' height='6' rx='1.225' />
          <rect x='9.4' y='6' width='2.45' height='6.5' rx='1.225' />
          <rect x='12.4' y='6' width='2.45' height='6.5' rx='1.225' />
          <rect x='15.4' y='7' width='2.45' height='6' rx='1.225' />
          <path d='M6.4 11.5h11.45v3.5a2.5 2.5 0 0 1-2.5 2.5h-6.45a2.5 2.5 0 0 1-2.5-2.5z' />
          <rect x='8.4' y='18' width='7.5' height='2' rx='0.8' />
        </g>
        <rect x='7.3' y='11.6' width='7.7' height='2.9' rx='1.45' fill='#fff' stroke='#c2571a' strokeWidth='0.9' />
      </g>
    ),
  },
  Fire: {
    bg: '#ef4444', edge: '#b91c1c',
    glyph: (
      <path
        d='M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2 0 1.6.8 2.4 1.6 2.6C10.2 9 11 6 12 3z'
        fill='#fff'
      />
    ),
  },
  Grass: {
    bg: '#22a45a', edge: '#15703c',
    glyph: (
      <>
        <path d='M5 19C5 10 10 5 19 5c0 9-5 14-14 14z' fill='#fff' />
        <path d='M5.5 18.5L14 10' stroke='#22a45a' strokeWidth='1.6' strokeLinecap='round' fill='none' />
      </>
    ),
  },
  Lightning: {
    bg: '#f5c518', edge: '#b8900c',
    glyph: <path d='M13.5 3L6 13.5h5l-1.5 7.5L18 10.5h-5z' fill='#3b2f00' />,
  },
  Metal: {
    bg: '#8b9bb0', edge: '#5f6e82',
    glyph: (
      <>
        <path d='M12 4.5l6.5 3.75v7.5L12 19.5l-6.5-3.75v-7.5z' fill='#fff' />
        <circle cx='12' cy='12' r='2.8' fill='#8b9bb0' />
      </>
    ),
  },
  Psychic: {
    bg: '#a855f7', edge: '#7a35b8',
    glyph: (
      <>
        <path d='M3.5 12C6 7.5 18 7.5 20.5 12 18 16.5 6 16.5 3.5 12z' fill='#fff' />
        <circle cx='12' cy='12' r='2.7' fill='#a855f7' />
      </>
    ),
  },
  Water: {
    bg: '#3b82f6', edge: '#1d56b8',
    glyph: <path d='M12 4c3 4.2 5.5 7 5.5 10.2A5.5 5.5 0 0 1 6.5 14.2C6.5 11 9 8.2 12 4z' fill='#fff' />,
  },
};

export function EnergyIcon({ type, size = 18 }) {
  const t = TYPES[type];
  if (!t) return <span>{type}</span>;
  return (
    <svg className='energy' viewBox='0 0 24 24' width={size} height={size} role='img' aria-label={type}>
      <title>{type}</title>
      <circle cx='12' cy='12' r='11' fill={t.bg} stroke={t.edge} strokeWidth='1' />
      {t.glyph}
    </svg>
  );
}

export function EnergyList({ types = [], size = 18 }) {
  return (
    <span className='energy-list'>
      {types.map((t, i) => <EnergyIcon key={t + i} type={t} size={size} />)}
    </span>
  );
}