import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/profile');
      setProfile(res.data.data.user);
      setStats(res.data.data.stats);
      setForm({
        name: res.data.data.user.name || '',
        email: res.data.data.user.email || '',
        phone: res.data.data.user.phone || '',
        address: res.data.data.user.address || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/customer/profile', form);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: '🎫', color: 'bg-blue-500' },
    { label: 'Completed Trips', value: stats?.completed_trips || 0, icon: '✅', color: 'bg-green-500' },
    { label: 'Upcoming Trips', value: stats?.upcoming_trips || 0, icon: '🚌', color: 'bg-amber-500' },
    { label: 'Total Spent', value: `$${stats?.total_spent || 0}`, icon: '💰', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary/80 rounded-[40px] p-10 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-[32px] border border-white/20 flex items-center justify-center text-5xl font-display font-black text-white shadow-2xl">
            {profile?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-display font-black mb-2">{profile?.name}</h1>
            <p className="text-white/60 text-lg">{profile?.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                👤 {profile?.role}
              </span>
              <span className="px-4 py-1.5 bg-green-500/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-green-300 border border-green-400/20">
                ● Active Member
              </span>
              <span className="text-white/40 text-xs">
                Member since {new Date(profile?.created_at || profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
          >
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 ${stat.color}/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-display font-black text-gray-900">{stat.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold text-center ${
          message.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Details / Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 pb-2 border-b border-gray-50 flex items-center gap-2">
            <span>👤</span> Personal Information
          </h2>
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 resize-none"
                  rows={3}
                  placeholder="Enter your address"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {[
                { label: 'Full Name', value: profile?.name, icon: '👤' },
                { label: 'Email Address', value: profile?.email, icon: '📧' },
                { label: 'Phone', value: profile?.phone || 'Not provided', icon: '📱' },
                { label: 'Address', value: profile?.address || 'Not provided', icon: '📍' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-gray-900 font-semibold mt-1">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 pb-2 border-b border-gray-50 flex items-center gap-2">
              <span>🔒</span> Account Security
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔑</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Password</p>
                    <p className="text-gray-400 text-xs">Last changed 30 days ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Two-Factor Auth</p>
                    <p className="text-gray-400 text-xs">Not enabled</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Email Verified</p>
                    <p className="text-green-600 text-xs font-medium">{profile?.email}</p>
                  </div>
                </div>
                <span className="text-green-500 text-lg">✓</span>
              </div>
            </div>
          </div>

          {/* Travel Preferences */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 pb-2 border-b border-gray-50 flex items-center gap-2">
              <span>⚙️</span> Preferences
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Booking confirmations & updates', enabled: true },
                { label: 'SMS Alerts', desc: 'Trip reminders & tracking alerts', enabled: false },
                { label: 'Promotional Offers', desc: 'Discounts and special deals', enabled: true },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{pref.label}</p>
                    <p className="text-gray-400 text-xs">{pref.desc}</p>
                  </div>
                  <div className={`w-12 h-7 rounded-full flex items-center cursor-pointer transition-colors ${pref.enabled ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
