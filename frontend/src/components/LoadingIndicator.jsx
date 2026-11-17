export default function LoadingIndicator({ children }) {
  return (
    <div className='loading-indicator' role='status'>
      <span className='loading-spinner' aria-hidden='true' />
      <span>{children}</span>
    </div>
  );
}
