import { Component } from 'react';

// App-level crash guard. A render error anywhere below this boundary would
// otherwise white-screen the whole app — instead we show a branded recovery
// panel so a single bad component can't take down the beta. Reusing the design
// tokens (dark forest green + accent) keeps it on-brand; no new dependencies.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surfaced to the console for diagnostics; no external reporting yet.
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--color-surface, #f6f6f4)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0d2a1a',
              color: '#6ecf94',
            }}
            aria-hidden="true"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'Manrope, system-ui, sans-serif',
              fontSize: 22,
              fontWeight: 800,
              color: '#1a1a1a',
              margin: '0 0 8px',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#555', margin: '0 0 24px' }}>
            An unexpected error interrupted the page. Reload to get back to the bazaar.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: '#1a6b45',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
}
