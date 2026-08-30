import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OverFlow — Find your squad. Play IRL.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#E9E5DD',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 64,
            right: 96,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: '#FFC83D',
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 260,
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: '#46C93A',
            opacity: 0.5,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#7C5CFF',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '6px solid #FFFFFF',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                display: 'flex',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#46C93A',
                border: '2px solid #7C5CFF',
              }}
            />
          </div>
          <span style={{ fontSize: 34, fontWeight: 800, color: '#1B1B23' }}>OverFlow</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#1B1B23',
            }}
          >
            <span>Find your</span>
            <span style={{ color: '#7C5CFF' }}>squad.</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#1B1B23',
            }}
          >
            <span>Play</span>
            <span style={{ color: '#46C93A' }}>IRL.</span>
          </div>
        </div>

        <span style={{ marginTop: 32, fontSize: 30, color: '#8A8578', maxWidth: 820 }}>
          Gamers in Utrecht, teaming up for real.
        </span>
      </div>
    ),
    { ...size }
  );
}
