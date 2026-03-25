import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">👤</div>
          <h2 className="text-3xl font-display font-black text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join BusMS for premium travel experiences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
            <input 
              type="text" 
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" 
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" 
              placeholder="john@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" 
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          {error && <div className="text-accent-red text-sm font-medium bg-accent-red/5 p-3 rounded-lg border border-accent-red/10">{error}</div>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
