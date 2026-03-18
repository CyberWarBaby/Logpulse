import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/apiClient';
import { Spinner, InlineAlert } from '../components/ui';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent shadow-lg shadow-accent/30 text-xl mb-4">
            ⚡
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your LogPulse account</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <InlineAlert type="error" message={error} />}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <><Spinner size="sm" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          No account?{' '}
          <Link to="/register" className="text-accent hover:text-white transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};
