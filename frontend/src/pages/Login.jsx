import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@fleetms.com', password: 'Admin@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FFFFFF] border-r border-[#E2E8F0] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3m0 0V5l3-2 3 2v2m-6 0h6m0 0h3a2 2 0 012 2v6a2 2 0 01-2 2h-3m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4 leading-tight">
            Bus Management<br />System
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Centralized platform for bus operations, driver management, fuel monitoring, and analytics.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Buses', value: '50+', icon: '🚌' },
              { label: 'Drivers', value: '100+', icon: '👨‍✈️' },
              { label: 'Analytics', value: 'Real-time', icon: '📊' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-lg font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3m0 0V5l3-2 3 2v2m-6 0h6m0 0h3a2 2 0 012 2v6a2 2 0 01-2 2h-3m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">BusMS</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            {/* Quick Fill / Demo Credentials */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForm({ email: 'admin@busms.com', password: 'password123' })}
                className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all flex flex-col items-center gap-1"
              >
                <span>🔑 Admin Role</span>
                <span className="text-[8px] opacity-60 normal-case font-medium">admin@busms.com</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'customer@example.com', password: 'password123' })}
                className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all flex flex-col items-center gap-1"
              >
                <span>👤 Customer Role</span>
                <span className="text-[8px] opacity-60 normal-case font-medium">customer@example.com</span>
              </button>
            </div>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 text-sm text-accent-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-4 text-base shadow-xl shadow-primary/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In to BusMS'}
            </button>
          </form>
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up for free</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
