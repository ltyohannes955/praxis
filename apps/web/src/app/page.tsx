'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPlans, generatePlan } from '@/store/slices/plansSlice';
import { useTheme } from '@/context/ThemeContext';
import { authClient } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { plans, isLoading, error } = useAppSelector(state => state.plans);
  const [prompt, setPrompt] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const result = await authClient.getSession();
      if (result.success && result.data) {
        setUser(result.data);
        dispatch(fetchPlans({ page: 1, limit: 10 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) return;
    await dispatch(generatePlan(prompt));
    setPrompt('');
    dispatch(fetchPlans({ page: 1, limit: 10 }));
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
          }
          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(u) => { setUser(u); dispatch(fetchPlans({ page: 1, limit: 10 })); }} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">PRAXIS</h1>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? '☀' : '☾'}
            </button>
            <button className="btn" onClick={() => { authClient.signOut(); setUser(null); }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero animate-fade-in">
          <h2>Generate Your Plan</h2>
          <p>Describe what you want to achieve and let AI create a structured plan for you.</p>
          <div className="generator">
            <textarea
              className="input generator-input"
              placeholder="I want to learn Python in 3 months..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleGeneratePlan}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </section>

        {error && (
          <div className="error-banner animate-fade-in">
            {error}
          </div>
        )}

        <section className="plans-section animate-fade-in">
          <h3>Your Plans</h3>
          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div 
                key={plan.id} 
                className="card plan-card clickable"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => router.push(`/plans/${plan.id}`)}
              >
                <div className="plan-header">
                  <h4>{plan.title}</h4>
                  <span className={`status status-${plan.status.toLowerCase()}`}>
                    {plan.status}
                  </span>
                </div>
                {plan.description && (
                  <p className="plan-description">{plan.description}</p>
                )}
                <div className="plan-meta">
                  <span>{plan.tasks?.length || 0} tasks</span>
                  <span>{plan.xpEarned} XP</span>
                </div>
              </div>
            ))}
            {plans.length === 0 && !isLoading && (
              <p className="empty-state">No plans yet. Generate one above!</p>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .header {
          position: sticky;
          top: 0;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          z-index: 100;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.1em;
        }
        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .theme-toggle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .theme-toggle:hover {
          background: var(--bg-tertiary);
        }
        .main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .hero {
          margin-bottom: 3rem;
          text-align: center;
        }
        .hero h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .hero p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        .generator {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .generator-input {
          resize: vertical;
          min-height: 100px;
        }
        .error-banner {
          background: var(--bg-secondary);
          border: 1px solid var(--error);
          color: var(--error);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
        }
        .plans-section h3 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .plan-card {
          opacity: 0;
          animation: fadeIn 0.4s ease forwards;
        }
        .plan-card.clickable {
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .plan-card.clickable:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }
        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 1rem;
        }
        .plan-header h4 {
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 1rem;
        }
        .status {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .status-pending {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
        .status-processing {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
        .status-completed {
          background: var(--accent);
          color: var(--bg-primary);
        }
        .status-failed {
          color: var(--error);
        }
        .plan-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .plan-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          color: var(--text-muted);
          padding: 3rem;
        }
      `}</style>
    </div>
  );
}

function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (user: User) => void }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await authClient.signUp(email, password, name);
      }
      const result = await authClient.signIn(email, password);
      if (result.success && result.data) {
        onAuthSuccess(result.data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <h1 className="auth-logo">PRAXIS</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          {isSignUp && (
            <input
              type="text"
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        
        <button
          className="theme-toggle-auth"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
      
      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: var(--bg-primary);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
        }
        .auth-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          text-align: center;
          margin-bottom: 2rem;
          letter-spacing: 0.15em;
        }
        .auth-form h2 {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .auth-error {
          background: var(--bg-tertiary);
          color: var(--error);
          padding: 0.75rem;
          border-radius: var(--radius);
          font-size: 0.875rem;
        }
        .auth-submit {
          margin-top: 0.5rem;
        }
        .auth-toggle {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .auth-toggle button {
          background: none;
          border: none;
          color: var(--text-primary);
          font-weight: 600;
          text-decoration: underline;
        }
        .theme-toggle-auth {
          display: block;
          margin: 1.5rem auto 0;
          background: none;
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
