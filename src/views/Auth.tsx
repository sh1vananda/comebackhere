import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 min-h-full">
      <div className="w-16 h-16 bg-accent text-bg rounded-2xl flex items-center justify-center mb-8 shadow-lg">
        <Dumbbell size={32} />
      </div>
      
      <h1 className="text-4xl font-serif italic mb-2 tracking-tight">Come Back Here</h1>
      <p className="text-muted font-mono text-sm mb-10 text-center">Track your progress.<br/>Anywhere, anytime.</p>
      
      <form onSubmit={handleAuth} className="w-full max-w-sm flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Email address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-panel px-4 py-3 rounded-xl outline-none focus:border-accent transition-colors"
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-panel px-4 py-3 rounded-xl outline-none focus:border-accent transition-colors"
          required
        />
        
        {message && (
          <div className={`text-sm text-center p-3 rounded-xl font-medium ${message.includes('error') || message.includes('Invalid') || message.includes('already') ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            {message}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-transform disabled:opacity-50 mt-2"
        >
          {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <button 
        onClick={() => {
          setIsSignUp(!isSignUp);
          setMessage('');
        }}
        className="mt-6 text-sm text-muted hover:text-tx transition-colors font-medium underline underline-offset-4"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  );
}
