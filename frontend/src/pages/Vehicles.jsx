import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';

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

  useEffect(() => { load(); }, [load]);

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
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vehicles.length} buses registered</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ type: 'add' })}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
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
