import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';

const CATEGORIES = ['fuel', 'maintenance', 'insurance', 'permit', 'tyres', 'other'];
const CAT_BADGE = {
  fuel: 'badge-amber', maintenance: 'badge-blue', insurance: 'badge-purple',
  permit: 'badge-cyan', tyres: 'badge-gray', other: 'badge-gray'
};

function ExpenseModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({
    vehicle_id: '', category: 'other', amount: '',
    date: new Date().toISOString().split('T')[0], description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/expenses', form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input type="number" step="0.01" className="input-field" placeholder="5000" value={form.amount}
                onChange={e => f('amount', e.target.value)} required min={0} />
            </div>
          </div>
          <div>
            <label className="label">Vehicle</label>
            <select className="input-field" value={form.vehicle_id} onChange={e => f('vehicle_id', e.target.value)}>
              <option value="">General (no vehicle)</option>
              {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date}
              onChange={e => f('date', e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={2} placeholder="Details..." value={form.description}
              onChange={e => f('description', e.target.value)} />
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ category: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/vehicles').then(r => setVehicles(r.data.data));
  }, []);

  const total = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'category', label: 'Category', render: v => <span className={CAT_BADGE[v] || 'badge-gray'}>{v}</span> },
    { key: 'registration_number', label: 'Vehicle', render: v => v ? <span className="font-mono text-xs text-primary-light">{v}</span> : '—' },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold text-gray-900">₹{Number(v).toLocaleString('en-IN')}</span> },
    { key: 'description', label: 'Description', render: v => v ? <span className="text-gray-500 text-xs">{v}</span> : '—' },
    { key: 'created_by_name', label: 'Added By', render: v => v || '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total: ₹{total.toLocaleString('en-IN')}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input-field w-40" value={filter.category}
          onChange={e => setFilter(p => ({ ...p, category: e.target.value }))}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div className="card">
        <DataTable columns={columns} data={expenses} loading={loading} emptyMessage="No expenses found" />
      </div>

      {showModal && (
        <ExpenseModal vehicles={vehicles} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
