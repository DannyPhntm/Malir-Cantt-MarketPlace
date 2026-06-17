import './LoadingState.css';

// Reusable centered loading indicator (spinner + label). Used by the listing
// pages while backend data is in flight.
export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-state__spinner" aria-hidden="true" />
      <p className="loading-state__text">{label}</p>
    </div>
  );
}
