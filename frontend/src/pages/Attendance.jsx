import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  present: 'badge-green', absent: 'badge-red', leave: 'badge-amber', holiday: 'badge-purple'
};
const STATUSES = ['present', 'absent', 'leave', 'holiday'];

function AttendanceModal({ drivers, vehicles, onClose, onSave }) {
  const [form, setForm] = useState({
    driver_id: '', vehicle_id: '', date: new Date().toISOString().split('T')[0],
    status: 'present', check_in_time: '', check_out_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/attendance', form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-display font-bold text-gray-900">Add Daily Attendance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Driver</label>
              <select className="input-field" value={form.driver_id} onChange={e => f('driver_id', e.target.value)} required>
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.driver_id} value={d.driver_id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vehicle (Optional)</label>
              <select className="input-field" value={form.vehicle_id} onChange={e => f('vehicle_id', e.target.value)}>
                <option value="">Select bus...</option>
                {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={e => f('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check In</label>
              <input type="time" className="input-field" value={form.check_in_time}
                onChange={e => f('check_in_time', e.target.value)} />
            </div>
            <div>
              <label className="label">Check Out</label>
              <input type="time" className="input-field" value={form.check_out_time}
                onChange={e => f('check_out_time', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month: filter.month, year: filter.year };
      const { data } = await api.get('/attendance', { params });
      setRecords(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/drivers?status=active').then(r => setDrivers(r.data.data));
    api.get('/vehicles?status=active').then(r => setVehicles(r.data.data));
  }, []);

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'driver_name', label: 'Driver', render: v => <span className="font-semibold">{v}</span> },
    { key: 'registration_number', label: 'Vehicle', render: v => v ? <span className="font-mono text-xs text-primary-light">{v}</span> : '—' },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_BADGE[v] || 'badge-gray'}>{v}</span> },
    { key: 'check_in_time', label: 'Check In', render: v => v || '—' },
    { key: 'check_out_time', label: 'Check Out', render: v => v || '—' },
  ];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' })
  }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{records.length} records</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Attendance
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input-field w-44" value={filter.month}
          onChange={e => setFilter(p => ({ ...p, month: e.target.value }))}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input-field w-28" value={filter.year}
          onChange={e => setFilter(p => ({ ...p, year: e.target.value }))}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="card">
        <DataTable columns={columns} data={records} loading={loading} emptyMessage="No attendance records" />
      </div>

      {showModal && (
        <AttendanceModal
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
