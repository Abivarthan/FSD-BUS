import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

function FuelModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({
    vehicle_id: '', date: new Date().toISOString().split('T')[0],
    fuel_quantity_liters: '', fuel_cost: '', odometer_reading: '', fuel_station: ''
  });
  const [billFile, setBillFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/fuel', form);
      if (billFile && data.data.fuel_id) {
        const formData = new FormData();
        formData.append('bill', billFile);
        await api.post(`/fuel/${data.data.fuel_id}/upload-bill`, formData);
      }
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
          <div>
            <label className="label">Vehicle</label>
            <select className="input-field" value={form.vehicle_id} onChange={e => f('vehicle_id', e.target.value)} required>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date}
              onChange={e => f('date', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fuel (Liters)</label>
              <input type="number" step="0.01" className="input-field" placeholder="45.5" value={form.fuel_quantity_liters}
                onChange={e => f('fuel_quantity_liters', e.target.value)} required min={0} />
            </div>
            <div>
              <label className="label">Cost (₹)</label>
              <input type="number" step="0.01" className="input-field" placeholder="3500" value={form.fuel_cost}
                onChange={e => f('fuel_cost', e.target.value)} required min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Odometer (km)</label>
              <input type="number" className="input-field" placeholder="45200" value={form.odometer_reading}
                onChange={e => f('odometer_reading', e.target.value)} />
            </div>
            <div>
              <label className="label">Fuel Station</label>
              <input className="input-field" placeholder="HP Petrol, Salem" value={form.fuel_station}
                onChange={e => f('fuel_station', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Fuel Bill Image</label>
            <input type="file" accept="image/*,application/pdf" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={e => setBillFile(e.target.files[0])} />
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BillViewer = ({ url, onClose }) => (
  <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
    <div className="max-w-4xl w-full p-4 flex flex-col items-center">
      <button className="self-end mb-2 text-gray-900 bg-black/40 rounded-full p-2 hover:bg-gray-900/40 transition-colors" onClick={onClose}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {url.endsWith('.pdf') ? (
        <iframe src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`} className="w-full h-[80vh] bg-white rounded-lg shadow-2xl" />
      ) : (
        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white" alt="Bill" />
      )}
    </div>
  </div>
);

export default function FuelLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewBill, setViewBill] = useState(null);
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

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'registration_number', label: 'Vehicle', render: v => <span className="font-mono text-xs text-primary-light">{v}</span> },
    { key: 'fuel_quantity_liters', label: 'Liters', render: v => `${Number(v).toFixed(1)} L` },
    { key: 'fuel_cost', label: 'Cost', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      key: 'fuel_cost', label: '₹/Ltr',
      render: (v, row) => row.fuel_quantity_liters > 0
        ? `₹${(Number(v) / Number(row.fuel_quantity_liters)).toFixed(1)}`
        : '—'
    },
    { key: 'fuel_station', label: 'Station', render: v => v || '—' },
    {
      key: 'fuel_bill_image', label: 'Bill',
      render: v => v ? (
        <button onClick={() => setViewBill(v)} className="text-primary hover:text-primary-dark transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      ) : <span className="text-gray-700">—</span>
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Entries</p>
          <p className="text-2xl font-display font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="card p-4 text-accent-green bg-green-50/10 border-green-100/20">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Liters</p>
          <p className="text-2xl font-display font-bold text-green-700">{totalLiters.toFixed(0)} L</p>
        </div>
        <div className="card p-4 text-primary bg-primary/5 border-primary/10">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Cost</p>
          <p className="text-2xl font-display font-bold text-primary-dark">₹{totalCost.toLocaleString('en-IN')}</p>
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

      {viewBill && (
        <BillViewer url={viewBill} onClose={() => setViewBill(null)} />
      )}
    </div>
  );
}
