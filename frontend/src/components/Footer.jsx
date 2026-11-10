const LINKS = {
  github: 'https://github.com/pablo-dz',
  linkedin: 'https://www.linkedin.com/in/paaldz',
};

export default function Footer() {
  return (
    <footer className='footer'>
      <div className='footer-links'>
        <a href={LINKS.github} target='_blank' rel='noopener noreferrer' aria-label='GitHub' title='GitHub'>
          <svg viewBox='0 0 16 16' width='22' height='22' fill='currentColor' aria-hidden='true'>
            <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
          </svg>
        </a>
        <a href={LINKS.linkedin} target='_blank' rel='noopener noreferrer' aria-label='LinkedIn' title='LinkedIn'>
          <svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'>
            <rect x='2' y='2' width='20' height='20' rx='3' fill='currentColor' />
            <g style={{ fill: 'var(--bg)' }}>
              <circle cx='7.2' cy='7.6' r='1.4' />
              <rect x='5.9' y='10' width='2.6' height='8' />
              <path d='M10.3 10h2.5v1.1c.4-.7 1.3-1.3 2.6-1.3 2.5 0 3 1.6 3 3.8V18h-2.6v-3.9c0-.9 0-2.1-1.3-2.1-1.3 0-1.5 1-1.5 2V18h-2.7z' />
            </g>
          </svg>
        </a>
      </div>
      <p>
        PKollector is a non-profit fan project and is not affiliated with Nintendo, Creatures, GAME FREAK, or The
        Pokémon Company. Pokémon and its names are trademarks of their respective owners.
      </p>
    </footer>
  );
}