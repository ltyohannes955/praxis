'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPlanById } from '@/store/slices/plansSlice';
import { useTheme } from '@/context/ThemeContext';
import { authClient } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { currentPlan, isLoading, error } = useAppSelector(state => state.plans);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (params.id && user) {
      dispatch(fetchPlanById(params.id as string));
    }
  }, [params.id, user, dispatch]);

  const checkSession = async () => {
    try {
      const result = await authClient.getSession();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        router.push('/');
      }
    } catch (e) {
      router.push('/');
    } finally {
      setAuthLoading(false);
    }
  };

  if (authLoading || isLoading) {
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

  if (!currentPlan) {
    return (
      <div className="error-page">
        <p>{error || 'Plan not found'}</p>
        <button className="btn" onClick={() => router.push('/')}>Go Back</button>
        <style>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background: var(--bg-primary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="plan-detail-container">
      <header className="header">
        <div className="header-content">
          <button className="back-btn" onClick={() => router.push('/')}>
            ← Back
          </button>
          <h1 className="logo">PRAXIS</h1>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? '☀' : '☾'}
            </button>
            <button className="btn" onClick={() => { authClient.signOut(); router.push('/'); }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="plan-header-section">
          <div className="plan-title-row">
            <h2>{currentPlan.title}</h2>
            <span className={`status status-${currentPlan.status.toLowerCase()}`}>
              {currentPlan.status}
            </span>
          </div>
          {currentPlan.description && (
            <p className="plan-description">{currentPlan.description}</p>
          )}
          <div className="plan-meta">
            <span>{currentPlan.tasks?.length || 0} tasks</span>
            <span>{currentPlan.xpEarned} XP earned</span>
            <span>Created {new Date(currentPlan.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <section className="tasks-section">
          <h3>Tasks</h3>
          {currentPlan.tasks && currentPlan.tasks.length > 0 ? (
            <div className="tasks-list">
              {currentPlan.tasks.map((task, index) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <span className="task-order">#{task.order}</span>
                    <h4>{task.title}</h4>
                    <span className={`status status-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    <span>+{task.xpValue} XP</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {currentPlan.status === 'PROCESSING' 
                ? 'Tasks are being generated...' 
                : currentPlan.status === 'PENDING'
                ? 'Waiting to start generation...'
                : 'No tasks found for this plan.'}
            </p>
          )}
        </section>
      </main>

      <style>{`
        .plan-detail-container {
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
        .back-btn {
          background: none;
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .back-btn:hover {
          background: var(--bg-secondary);
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
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .plan-header-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .plan-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .plan-title-row h2 {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
        }
        .status {
          font-size: 0.7rem;
          padding: 0.25rem 0.75rem;
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
          background: rgba(239, 68, 68, 0.2);
          color: var(--error);
        }
        .plan-description {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .plan-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .error-banner {
          background: var(--bg-secondary);
          border: 1px solid var(--error);
          color: var(--error);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
        }
        .tasks-section h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .task-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 1.25rem;
          transition: all 0.2s ease;
        }
        .task-card:hover {
          border-color: var(--accent);
        }
        .task-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .task-order {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 600;
        }
        .task-header h4 {
          flex: 1;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }
        .task-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        .task-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .empty-state {
          text-align: center;
          color: var(--text-muted);
          padding: 3rem;
          background: var(--bg-secondary);
          border-radius: var(--radius);
        }
      `}</style>
    </div>
  );
}
