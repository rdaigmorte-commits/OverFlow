'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// /login couvre deux cas :
// 1. Sauvegarde — utilisateur qui vient de créer son profil et veut le sécuriser
// 2. Récupération — utilisateur déconnecté qui veut retrouver son profil existant
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">

        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-muted hover:text-text transition flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">Access your profile</h1>
          <p className="text-muted mt-2 text-sm">
            New here? Save your profile to access it from any device.<br />
            Already registered? Use your email to reconnect.
          </p>
        </div>

        {sent ? (
          <div className="bg-panel border border-border rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-text font-semibold text-xl mb-2">Check your inbox!</h2>
            <p className="text-muted text-sm">
              We sent a magic link to <span className="text-text font-medium">{email}</span>.<br />
              Click it to access your profile — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-muted text-xs underline hover:text-text"
            >
              Wrong email? Try again
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-panel border border-border rounded-2xl p-8 flex flex-col gap-5"
          >
            <div>
              <h2 className="text-text font-semibold text-xl">Enter your email</h2>
              <p className="text-muted text-sm mt-1">
                We&apos;ll send you a magic link — no password needed.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-text text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-panel2 border border-border rounded-lg px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-accent transition"
              />
            </div>

            {error && (
              <p className="text-error text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary-new w-full py-3 text-sm disabled:pointer-events-none"
            >
              {loading ? 'Sending…' : 'Send magic link 🔗'}
            </button>

            <p className="text-center text-xs text-muted">
              No account yet?{' '}
              <a href="/onboarding" className="text-accent underline underline-offset-2 hover:opacity-80">
                Create your profile
              </a>
            </p>
            <p className="text-center text-xs text-muted">
              Already have an account? Use the same email you signed up with — entering a different one signs you into a different account, it doesn&apos;t rename your current one. To change your email, sign in and use the profile page instead.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
