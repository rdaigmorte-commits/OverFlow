import { ImageResponse } from 'next/og';

export const runtime = 'edge';
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
          background: '#7C5CFF',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 84,
            height: 84,
            borderRadius: '50%',
            border: '20px solid #FFFFFF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 26,
            bottom: 26,
            display: 'flex',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#46C93A',
            border: '6px solid #7C5CFF',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
