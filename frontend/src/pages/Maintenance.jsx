import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';

const SERVICE_TYPES = ['Oil Change', 'Tyre Rotation', 'Brake Service', 'Engine Tune-up', 'Battery Replacement', 'AC Service', 'General Service'];
const STATUS_BADGE = { scheduled: 'badge-amber', in_progress: 'badge-blue', completed: 'badge-green' };

function MaintenanceModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({
    vehicle_id: '', service_date: new Date().toISOString().split('T')[0],
    service_type: '', cost: '', notes: '', next_service_due: '',
    service_provider: '', status: 'completed'
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
      const { data } = await api.post('/maintenance', form);
      if (billFile && data.data.maintenance_id) {
        const formData = new FormData();
        formData.append('bill', billFile);
        await api.post(`/maintenance/${data.data.maintenance_id}/upload-bill`, formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">Add Maintenance Record</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Type</label>
              <input className="input-field" list="service-types" placeholder="Oil Change" value={form.service_type}
                onChange={e => f('service_type', e.target.value)} required />
              <datalist id="service-types">
                {SERVICE_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Cost (₹)</label>
              <input type="number" className="input-field" placeholder="2500" value={form.cost}
                onChange={e => f('cost', e.target.value)} required min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Date</label>
              <input type="date" className="input-field" value={form.service_date}
                onChange={e => f('service_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Next Service Due</label>
              <input type="date" className="input-field" value={form.next_service_due}
                onChange={e => f('next_service_due', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Provider</label>
              <input className="input-field" placeholder="Service center name" value={form.service_provider}
                onChange={e => f('service_provider', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Service Bill Image</label>
            <input type="file" accept="image/*,application/pdf" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={e => setBillFile(e.target.files[0])} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} placeholder="Notes..." value={form.notes}
              onChange={e => f('notes', e.target.value)} />
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Record'}
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

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [filter, setFilter] = useState({ status: '', overdue: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.overdue) params.overdue = filter.overdue;
      const { data } = await api.get('/maintenance', { params });
      setRecords(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/vehicles').then(r => setVehicles(r.data.data));
  }, []);

  const columns = [
    { key: 'service_date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'registration_number', label: 'Vehicle', render: v => <span className="font-mono text-xs text-primary-light">{v}</span> },
    { key: 'service_type', label: 'Service Type' },
    { key: 'cost', label: 'Cost', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      key: 'next_service_due', label: 'Next Due',
      render: v => {
        if (!v) return '—';
        const due = new Date(v);
        const now = new Date();
        const diff = (due - now) / (1000 * 60 * 60 * 24);
        const cls = diff < 0 ? 'text-accent-red font-bold' : diff < 7 ? 'text-accent-amber' : 'text-gray-500';
        return <span className={cls}>{due.toLocaleDateString('en-IN')}</span>;
      }
    },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_BADGE[v] || 'badge-gray'}>{v?.replace('_', ' ')}</span> },
    {
      key: 'service_bill_image', label: 'Bill',
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
          <h1 className="page-title">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{records.length} records</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Record
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input-field w-40" value={filter.status}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" className="rounded"
            checked={filter.overdue === 'true'}
            onChange={e => setFilter(p => ({ ...p, overdue: e.target.checked ? 'true' : '' }))}
          />
          Show Overdue Only
        </label>
      </div>

      <div className="card">
        <DataTable columns={columns} data={records} loading={loading} emptyMessage="No maintenance records" />
      </div>

      {showModal && (
        <MaintenanceModal
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
