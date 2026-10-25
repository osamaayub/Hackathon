import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6 55%, #06b6d4)',
        }}
      >
        <div style={{ display: 'flex', position: 'relative', width: 100, height: 100 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 30, height: 100, borderRadius: 15, background: '#fff' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: 30, height: 100, borderRadius: 15, background: '#fff' }} />
          <div style={{ position: 'absolute', left: 20, top: 36, width: 60, height: 30, borderRadius: 15, background: '#fff' }} />
        </div>
      </div>
    ),
    size,
  );
}
