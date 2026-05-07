import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Fuel, Users, 
  Settings, Briefcase, IndianRupee, PieChart 
} from 'lucide-react';

const STATUS_BADGE = {
  active: 'badge-green',
  inactive: 'badge-gray',
  maintenance: 'badge-amber',
};

const VEHICLE_TYPES = ['bus', 'car', 'van', 'truck'];
const FUEL_TYPES = ['diesel', 'petrol', 'electric', 'hybrid'];
const STATUSES = ['active', 'inactive', 'maintenance'];

function VehicleModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState(vehicle || {
    vehicle_type: 'bus', registration_number: '', model: '', capacity: '',
    fuel_type: 'diesel', purchase_date: '', status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (vehicle?.vehicle_id) {
        await api.put(`/vehicles/${vehicle.vehicle_id}`, form);
      } else {
        await api.post('/vehicles', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Type</label>
              <select className="input-field" value={form.vehicle_type} onChange={e => f('vehicle_type', e.target.value)}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Registration Number</label>
              <input className="input-field" placeholder="TN01AB1234" value={form.registration_number}
                onChange={e => f('registration_number', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input-field" placeholder="Tata Starbus" value={form.model}
              onChange={e => f('model', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Capacity (seats)</label>
              <input type="number" className="input-field" value={form.capacity}
                onChange={e => f('capacity', e.target.value)} required min={1} />
            </div>
            <div>
              <label className="label">Fuel Type</label>
              <select className="input-field" value={form.fuel_type} onChange={e => f('fuel_type', e.target.value)}>
                {FUEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input-field" value={form.purchase_date || ''}
                onChange={e => f('purchase_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [profitData, setProfitData] = useState(null);

  const loadProfit = async () => {
    try {
      const { data } = await api.get('/analytics/profit-analysis');
      setProfitData(data.data);
    } catch (e) {
      console.error('Profit data load failed', e);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.type) params.type = filter.type;
      const { data } = await api.get('/vehicles', { params });
      setVehicles(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { 
    load(); 
    loadProfit();
  }, [load]);

  const columns = [
    { key: 'registration_number', label: 'Reg. Number', render: v => <span className="font-mono text-primary-light">{v}</span> },
    { key: 'vehicle_type', label: 'Type', render: v => <span className="capitalize">{v}</span> },
    { key: 'model', label: 'Model' },
    { key: 'capacity', label: 'Capacity', render: v => `${v} seats` },
    { key: 'fuel_type', label: 'Fuel', render: v => <span className="capitalize">{v}</span> },
    { key: 'assigned_driver_name', label: 'Driver', render: v => v || <span className="text-gray-600">Unassigned</span> },
    {
      key: 'status', label: 'Status',
      render: v => <span className={STATUS_BADGE[v]}>{v}</span>
    },
    {
      key: 'actions', label: '', width: '80px',
      render: (_, row) => (
        <button
          onClick={() => setModal({ type: 'edit', vehicle: row })}
          className="text-gray-500 hover:text-primary-light transition-colors text-xs"
        >
          Edit
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buses & Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your vehicles and monitor financial performance</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ type: 'add' })}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Financial KPIs */}
      {profitData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-white relative overflow-hidden group hover:shadow-xl transition-all border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-1">
                  <span className="text-primary-light">₹</span>
                  {profitData.summary.totalRevenue.toLocaleString()}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-green-500 text-xs font-bold">
                  <TrendingUp size={14} />
                  <span>Gross Earnings</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white relative overflow-hidden group hover:shadow-xl transition-all border-l-4 border-accent-red">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Expenditure</p>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-1">
                  <span className="text-accent-red">₹</span>
                  {profitData.summary.totalExpenditure.toLocaleString()}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-gray-500 text-xs font-bold">
                  <Fuel size={14} />
                  <span>Fuel + Salary + Misc</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-accent-red/5 rounded-2xl flex items-center justify-center text-accent-red">
                <PieChart size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white relative overflow-hidden group hover:shadow-xl transition-all border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Net Profit</p>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-1">
                  <span className="text-green-500">₹</span>
                  {profitData.summary.totalProfit.toLocaleString()}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-primary text-xs font-bold">
                  <TrendingUp size={14} />
                  <span>{profitData.summary.profitMargin}% Margin</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/5 rounded-2xl flex items-center justify-center text-green-500">
                <IndianRupee size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart size={18} className="text-primary" />
              Profit & Expenditure Analysis
            </h2>
          </div>
          <div className="h-[320px]">
            {profitData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData.profitTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`₹${v.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expenditure" name="Expenditure" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Loading analysis...</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Cost Breakdown
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fuel Cost</span>
                <span className="text-sm font-black text-gray-900">Fixed ₹100/L</span>
              </div>
              <p className="text-[10px] text-gray-400">Based on live fuel logs and odometer data</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Driver Salary</span>
                <span className="text-sm font-black text-gray-900">₹800 - ₹2,000</span>
              </div>
              <p className="text-[10px] text-gray-400">Calculated via biometric attendance sync</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cleaning & Misc</span>
                <span className="text-sm font-black text-gray-900">₹450 / day</span>
              </div>
              <p className="text-[10px] text-gray-400">Daily overhead per active vehicle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          className="input-field w-36"
          value={filter.status}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          className="input-field w-32"
          value={filter.type}
          onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}
        >
          <option value="">All Types</option>
          {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="card">
        <DataTable columns={columns} data={vehicles} loading={loading} emptyMessage="No vehicles found" />
      </div>

      {modal && (
        <VehicleModal
          vehicle={modal.type === 'edit' ? modal.vehicle : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
