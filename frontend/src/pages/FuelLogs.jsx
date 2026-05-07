import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

function FuelModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({
    vehicle_id: '', date: new Date().toISOString().split('T')[0],
    fuel_quantity_liters: '', fuel_cost: 0, odometer_reading: '', fuel_station: 'HP Petrol, Salem'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-calculate cost based on fixed ₹100/L price
  useEffect(() => {
    const liters = parseFloat(form.fuel_quantity_liters) || 0;
    setForm(p => ({ ...p, fuel_cost: (liters * 100).toFixed(0) }));
  }, [form.fuel_quantity_liters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/fuel', form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fuel log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">Add Fuel Log</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle</label>
              <select className="input-field" value={form.vehicle_id} onChange={e => f('vehicle_id', e.target.value)} required>
                <option value="">Select Bus...</option>
                {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={e => f('date', e.target.value)} required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fuel (Liters)</label>
              <input type="number" step="0.01" className="input-field" placeholder="e.g. 57" value={form.fuel_quantity_liters}
                onChange={e => f('fuel_quantity_liters', e.target.value)} required min={0} />
            </div>
            <div>
              <label className="label text-primary">Cost (₹) - Fixed ₹100/L</label>
              <input type="number" className="input-field bg-primary/5 font-black text-primary border-primary/20" value={form.fuel_cost} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Odometer (KM)</label>
              <input type="number" className="input-field" placeholder="e.g. 45200" value={form.odometer_reading}
                onChange={e => f('odometer_reading', e.target.value)} required />
            </div>
            <div>
              <label className="label">Fuel Station</label>
              <input list="stations" className="input-field" placeholder="Select or type..." value={form.fuel_station}
                onChange={e => f('fuel_station', e.target.value)} />
              <datalist id="stations">
                <option value="HP Petrol, Salem" />
                <option value="BPCL, Chennai" />
                <option value="Indian Oil, Coimbatore" />
                <option value="Reliance BP, Madurai" />
                <option value="Shell, Vellore" />
              </datalist>
            </div>
          </div>

          {error && <p className="text-accent-red text-sm font-bold">{error}</p>}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-4 text-base shadow-xl shadow-primary/30">
              {loading ? 'Processing...' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FuelLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ vehicle_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.vehicle_id) params.vehicle_id = filter.vehicle_id;
      const { data } = await api.get('/fuel', { params });
      setLogs(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/vehicles?status=active').then(r => setVehicles(r.data.data));
  }, []);

  const totalCost = logs.reduce((a, b) => a + Number(b.fuel_cost || 0), 0);
  const totalLiters = logs.reduce((a, b) => a + Number(b.fuel_quantity_liters || 0), 0);
  const totalKm = logs.reduce((a, b) => a + Number(b.km_driven || 0), 0);
  const totalDailyCost = logs.reduce((a, b) => a + Number(b.daily_total_cost || 0), 0);
  const totalRevenue = logs.reduce((a, b) => a + Number(b.financials?.revenue || 0), 0);
  const totalProfit = logs.reduce((a, b) => a + Number(b.financials?.profit || 0), 0);

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'registration_number', label: 'Vehicle', render: v => <span className="font-mono text-xs text-primary-light">{v}</span> },
    { key: 'fuel_quantity_liters', label: 'Liters', render: v => `${Number(v).toFixed(1)} L` },
    { key: 'fuel_cost', label: 'Fuel Cost', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      key: 'daily_total_cost', label: 'Daily Total',
      render: (v, row) => {
        const b = row.cost_breakdown;
        if (!b) return '—';
        return (
          <div className="relative group cursor-help">
            <span className="font-bold text-orange-600">₹{Number(v).toLocaleString('en-IN')}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 pointer-events-none">
              <div style={{
                background: '#1e293b', color: '#f8fafc', borderRadius: '10px',
                padding: '12px 14px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                lineHeight: '1.7'
              }}>
                <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '13px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                  💰 Cost Breakdown
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>⛽ Fuel</span><span>₹{Number(b.fuel).toLocaleString('en-IN')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>👨‍✈️ Driver Salary</span><span>₹{Number(b.driver_salary).toLocaleString('en-IN')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🧹 Cleaning</span><span>₹{Number(b.cleaning).toLocaleString('en-IN')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📦 Misc/Tolls</span><span>₹{Number(b.misc).toLocaleString('en-IN')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '4px', color: '#fbbf24' }}>
                  <span>Total</span><span>₹{Number(b.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b', margin: '0 auto' }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'revenue', label: 'Revenue',
      render: (_, row) => {
        const r = row.financials?.revenue || 0;
        const p = row.financials?.passengers || 0;
        return (
          <div>
            <div className="font-bold text-gray-900">₹{Number(r).toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-gray-500">{p} Pax</div>
          </div>
        );
      }
    },
    {
      key: 'profit', label: 'Profit',
      render: (_, row) => {
        const p = row.financials?.profit || 0;
        const isPositive = p >= 0;
        return (
          <span className={`font-black ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-md`}>
            {isPositive ? '+' : ''}₹{Number(p).toLocaleString('en-IN')}
          </span>
        );
      }
    },
    { key: 'fuel_station', label: 'Station', render: v => v || '—' },
    {
      key: 'km_driven', label: 'KM Driven',
      render: v => v != null && v > 0
        ? <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">{Number(v).toLocaleString('en-IN')} km</span>
        : <span className="text-gray-400">—</span>
    }
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} entries</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Fuel Log
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Entries</p>
          <p className="text-2xl font-display font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="card p-4 text-accent-green bg-green-50/10 border-green-100/20">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Liters</p>
          <p className="text-2xl font-display font-bold text-green-700">{totalLiters.toFixed(0)} L</p>
        </div>
        <div className="card p-4 text-primary bg-primary/5 border-primary/10">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fuel Cost</p>
          <p className="text-2xl font-display font-bold text-primary-dark">₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="card p-4" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.15)' }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Daily Ops Cost</p>
          <p className="text-2xl font-display font-bold" style={{ color: '#ea580c' }}>₹{totalDailyCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="card p-4 bg-purple-50/50 border-purple-100/50">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="text-2xl font-display font-bold text-purple-700">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className={`card p-4 ${totalProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Net Profit</p>
          <p className={`text-2xl font-display font-bold ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="card p-4" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total KM Driven</p>
          <p className="text-2xl font-display font-bold" style={{ color: '#2563eb' }}>{totalKm > 0 ? `${totalKm.toLocaleString('en-IN')} km` : '—'}</p>
        </div>
      </div>

      <div className="card p-4">
        <select className="input-field w-52" value={filter.vehicle_id}
          onChange={e => setFilter(p => ({ ...p, vehicle_id: e.target.value }))}>
          <option value="">All Vehicles</option>
          {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>)}
        </select>
      </div>

      <div className="card">
        <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No fuel logs found" />
      </div>

      {showModal && (
        <FuelModal
          vehicles={vehicles}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
