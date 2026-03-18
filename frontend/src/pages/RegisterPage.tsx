import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/apiClient';
import { Spinner, InlineAlert } from '../components/ui';

export const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent shadow-lg shadow-accent/30 text-xl mb-4">⚡</div>
          <h1 className="font-display font-bold text-2xl text-white">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your monitoring workspace</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <InlineAlert type="error" message={error} />}

            <div>
              <label className="label">Organization Name</label>
              <input className="input" placeholder="Acme Corp" value={form.organizationName} onChange={set('organizationName')} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Your Name</label>
                <input className="input" placeholder="Alex" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@co.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? <><Spinner size="sm" /> Creating workspace...</> : 'Create workspace'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-white transition-colors font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
