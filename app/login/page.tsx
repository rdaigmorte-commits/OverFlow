'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Guard : si déjà connecté, rediriger vers /matches
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/matches');
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  // Pendant la vérification de session : spinner discret
  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-500 text-sm">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">OverFlow</h1>
          <p className="text-gray-400 mt-2 text-sm">Your gaming community in Utrecht</p>
        </div>

        {sent ? (
          // État : email envoyé
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-white font-semibold text-xl mb-2">Check your inbox!</h2>
            <p className="text-gray-400 text-sm">
              We sent a magic link to <span className="text-white font-medium">{email}</span>.
              Click it to access your profile — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-gray-500 text-xs underline hover:text-gray-300"
            >
              Wrong email? Try again
            </button>
          </div>
        ) : (
          // État : formulaire
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col gap-5"
          >
            <div>
              <h2 className="text-white font-semibold text-xl">Sign in</h2>
              <p className="text-gray-400 text-sm mt-1">
                Enter your email and we&apos;ll send you a magic link.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition"
            >
              {loading ? 'Sending...' : 'Send magic link 🔗'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
