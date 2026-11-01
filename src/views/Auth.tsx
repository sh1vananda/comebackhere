import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 min-h-full">
      <div className="w-16 h-16 bg-accent text-bg rounded-2xl flex items-center justify-center mb-8 shadow-lg">
        <Dumbbell size={32} />
      </div>

      <h1 className="text-4xl font-serif italic mb-2 tracking-tight text-center">Come Back Here</h1>
      <p className="text-muted font-mono text-sm mb-10 text-center">
        Track your progress.<br />Anywhere, anytime.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {error && (
          <div className="text-sm text-center p-3 rounded-xl font-medium bg-danger/10 text-danger border border-danger/20">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-surface hover:bg-surface2 text-tx border border-panel px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="text-sm font-mono text-dim animate-pulse">Connecting to Google...</span>
          ) : (
            <>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.46 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.54 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span className="font-semibold text-sm tracking-wide">Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-muted font-mono text-center mt-3 leading-relaxed">
          Sign in seamlessly with your Google account.<br />
          Your workout routines and logs are safely stored in your private cloud space.
        </p>
      </div>
    </div>
  );
}
