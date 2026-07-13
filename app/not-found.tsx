import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-5xl">🎮</div>
      <div>
        <h1 className="text-3xl font-black">This page wandered off</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist, or the link is out of date.</p>
      </div>
      <Link href="/" className="btn-primary-new px-6 py-3 text-sm">
        Back to home
      </Link>
    </main>
  );
}
