import { ImageResponse } from 'next/og';

export const alt = 'Hackathon: build, compete, ship it.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          color: '#fff',
          background: 'linear-gradient(135deg, #0b0b1a 0%, #1e1b4b 55%, #0e3a4a 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Hackathon</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>Build. Compete. Ship it.</div>
        <div style={{ marginTop: 24, fontSize: 34, color: '#c7c9ff' }}>
          Join hackathons, form a team, and submit your project.
        </div>
      </div>
    ),
    size,
  );
}
