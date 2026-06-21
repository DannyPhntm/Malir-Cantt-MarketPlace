import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <main style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
        padding: 'var(--space-10) var(--space-6)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '72px', fontWeight: 800, color: 'var(--color-surface-raised)', lineHeight: 1 }}>
            404
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-ink)' }}>
            Page not found
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--color-secondary)', maxWidth: '320px' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', height: '44px',
            padding: '0 var(--space-6)', marginTop: 'var(--space-2)',
            background: 'var(--color-primary)', color: 'var(--color-white)',
            borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
          }}>
            Back to Home
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}
