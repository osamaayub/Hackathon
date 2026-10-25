'use client';

import { useEffect } from 'react';

// Last resort: replaces the root layout when it fails, so it brings its own <html>, <body> and styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#0e0b1f',
          color: '#f5f5fa',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div role="alert" style={{ maxWidth: 440 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              fontSize: 28,
              fontWeight: 800,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6 55%,#06b6d4)',
            }}
          >
            H
          </div>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>The site hit a problem</h1>
          <p style={{ margin: '0 0 24px', color: '#b9b9d0', lineHeight: 1.6 }}>
            Something went wrong while loading Hackathon. Please try again in a moment.
          </p>
          <button
            onClick={() => retry()}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: 0,
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: '#6366f1',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 20, fontSize: 12, color: '#8a8aa5' }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
