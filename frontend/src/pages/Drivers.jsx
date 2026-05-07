import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';

const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray', suspended: 'badge-red' };

function DriverModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    license_number: '', license_expiry: '', daily_salary: '',
    date_joined: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/drivers', form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">Add Driver</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" placeholder="Rajesh Kumar" value={form.name}
                onChange={e => f('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="driver@email.com" value={form.email}
                onChange={e => f('email', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="+91 9876543210" value={form.phone}
                onChange={e => f('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Daily Salary (₹)</label>
              <input type="number" className="input-field" placeholder="500" value={form.daily_salary}
                onChange={e => f('daily_salary', e.target.value)} required min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">License Number</label>
              <input className="input-field" placeholder="TN1234567890" value={form.license_number}
                onChange={e => f('license_number', e.target.value)} required />
            </div>
            <div>
              <label className="label">License Expiry</label>
              <input type="date" className="input-field" value={form.license_expiry}
                onChange={e => f('license_expiry', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date Joined</label>
              <input type="date" className="input-field" value={form.date_joined}
                onChange={e => f('date_joined', e.target.value)} required />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input-field" placeholder="City, State" value={form.address}
                onChange={e => f('address', e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">Credentials will be generated automatically. Note: Driver login module is disabled.</p>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating...' : 'Create Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      key: 'name', label: 'Driver',
      render: (v, row) => (
        <div>
          <div className="font-bold text-gray-900">{v}</div>
          <div className="text-[10px] text-gray-500 uppercase font-medium">{row.email}</div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: v => v ? <span className="text-sm">{v}</span> : '—' },
    { key: 'daily_salary', label: 'Daily Rate', render: v => <span className="font-bold text-primary">₹{v || 0}</span> },
    {
      key: 'license_expiry', label: 'License Expiry',
      render: v => {
        if (!v) return '—';
        const expiry = new Date(v);
        const now = new Date();
        const diff = (expiry - now) / (1000 * 60 * 60 * 24);
        const cls = diff < 0 ? 'text-accent-red font-bold' : diff < 30 ? 'text-accent-amber' : 'text-gray-500';
        return <span className={`text-xs ${cls}`}>{new Date(v).toLocaleDateString('en-IN')}</span>;
      }
    },
    { key: 'assigned_vehicle', label: 'Vehicle', render: v => v ? <span className="font-mono text-primary-light text-xs font-bold">{v}</span> : <span className="text-gray-700">—</span> },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_BADGE[v] || 'badge-gray'}>{v}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drivers Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{drivers.length} registered personnel</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={drivers} loading={loading} emptyMessage="No drivers found" />
      </div>
      {showModal && (
        <DriverModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
