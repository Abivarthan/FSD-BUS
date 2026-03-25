import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';

const REPORTS = [
  { id: 'fuel', label: 'Fuel Report', icon: '⛽', endpoint: '/reports/fuel' },
  { id: 'attendance', label: 'Attendance Report', icon: '📋', endpoint: '/reports/attendance' },
  { id: 'expenses', label: 'Expense Report', icon: '💰', endpoint: '/reports/expenses' },
  { id: 'vehicle_monthly', label: 'Vehicle Monthly', icon: '🚐', endpoint: '/reports/vehicle-monthly' },
];

const FUEL_COLS = [
  { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
  { key: 'registration_number', label: 'Vehicle' },
  { key: 'fuel_quantity_liters', label: 'Liters', render: v => `${Number(v).toFixed(1)} L` },
  { key: 'fuel_cost', label: 'Cost', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
  { key: 'fuel_station', label: 'Station', render: v => v || '—' },
];

const ATTENDANCE_COLS = [
  { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
  { key: 'driver_name', label: 'Driver' },
  { key: 'status', label: 'Status', render: v => <span className={`badge ${v === 'present' ? 'badge-green' : v === 'absent' ? 'badge-red' : 'badge-amber'}`}>{v}</span> },
  { key: 'check_in_time', label: 'Check In', render: v => v || '—' },
  { key: 'check_out_time', label: 'Check Out', render: v => v || '—' },
];

const EXPENSE_COLS = [
  { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
  { key: 'category', label: 'Category', render: v => <span className="capitalize">{v}</span> },
  { key: 'registration_number', label: 'Vehicle', render: v => v || '—' },
  { key: 'amount', label: 'Amount', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
  { key: 'description', label: 'Description', render: v => v || '—' },
];

const COLS_MAP = { fuel: FUEL_COLS, attendance: ATTENDANCE_COLS, expenses: EXPENSE_COLS };

export default function Reports() {
  const [activeReport, setActiveReport] = useState('fuel');
  const [filter, setFilter] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [data, setData] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get('/vehicles?status=active').then(r => setVehicles(r.data.data));
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const report = REPORTS.find(r => r.id === activeReport);
      const params = activeReport === 'vehicle_monthly'
        ? { vehicle_id: filter.vehicle_id, month: filter.month, year: filter.year }
        : filter;
      
      const { data: res } = await api.get(report.endpoint, { params });
      
      if (activeReport === 'vehicle_monthly') {
        setData([res.data]); // Wrap in array for consistency if needed, though we render differently
        setSummary({
          vehicle: res.data.vehicle.registration_number,
          fuel_cost: res.data.fuel.cost,
          fuel_liters: res.data.fuel.liters,
          maint_cost: res.data.maintenance.cost,
          total_expense: res.data.total_cost
        });
      } else {
        setData(res.data);
        setSummary(res.summary);
      }
      setGenerated(true);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data.length || activeReport === 'vehicle_monthly') return;
    const cols = COLS_MAP[activeReport];
    const headers = cols.map(c => c.label).join(',');
    const rows = data.map(row =>
      cols.map(c => {
        const val = row[c.key];
        return typeof val === 'string' ? `"${val}"` : val ?? '';
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${filter.start_date || filter.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFile = async (type) => {
    if (!filter.vehicle_id) return alert('Please select a vehicle');
    try {
      const params = new URLSearchParams({ 
        vehicle_id: filter.vehicle_id, 
        month: filter.month, 
        year: filter.year 
      }).toString();
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${baseUrl}/api/reports/vehicle-monthly/${type}?${params}`;
      
      // Use hidden anchor to trigger download
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `vehicle-report-${filter.month}-${filter.year}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Intelligence & Reports</h1>
        <p className="text-gray-500 text-sm">Generate and export system-wide operational reports</p>
      </div>

      <div className="card p-5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">Select Report Category</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {REPORTS.map(r => (
            <button
              key={r.id}
              onClick={() => { setActiveReport(r.id); setGenerated(false); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                activeReport === r.id
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                  : 'border-[#F1F5F9] hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-3xl mb-3">{r.icon}</div>
              <div className={`text-sm font-bold ${activeReport === r.id ? 'text-primary' : 'text-gray-700'}`}>{r.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end bg-[#F8FAFC] p-4 rounded-xl">
          {activeReport === 'vehicle_monthly' ? (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="label">Select Vehicle</label>
                <select className="input-field" value={filter.vehicle_id}
                  onChange={e => setFilter(p => ({ ...p, vehicle_id: e.target.value }))}>
                  <option value="">Choose vehicle...</option>
                  {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <select className="input-field" value={filter.month}
                  onChange={e => setFilter(p => ({ ...p, month: e.target.value }))}>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', {month:'long'})}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select className="input-field" value={filter.year}
                  onChange={e => setFilter(p => ({ ...p, year: e.target.value }))}>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input-field w-40" value={filter.start_date}
                  onChange={e => setFilter(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input-field w-40" value={filter.end_date}
                  onChange={e => setFilter(p => ({ ...p, end_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Vehicle (Optional)</label>
                <select className="input-field w-48" value={filter.vehicle_id}
                  onChange={e => setFilter(p => ({ ...p, vehicle_id: e.target.value }))}>
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number}</option>)}
                </select>
              </div>
            </>
          )}
          <button onClick={generateReport} disabled={loading} className="btn-primary h-[42px] px-8">
            {loading ? 'Processing...' : 'Generate report'}
          </button>
        </div>
      </div>

      {generated && summary && activeReport !== 'vehicle_monthly' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="card p-4 border-l-4 border-l-primary">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
              <p className="text-xl font-display font-black text-gray-900">
                {typeof val === 'number' && (key.includes('cost') || key.includes('total'))
                  ? `₹${Math.round(val).toLocaleString('en-IN')}`
                  : typeof val === 'number' && key.includes('liter')
                  ? `${Number(val).toFixed(1)} L`
                  : val?.toLocaleString?.() ?? val}
              </p>
            </div>
          ))}
        </div>
      )}

      {generated && activeReport === 'vehicle_monthly' && data[0] && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-gray-900 lg:col-span-1">
            <h3 className="font-display font-bold text-xl mb-4">Monthly Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/20">
                <span className="text-gray-900/70 text-sm">Vehicle</span>
                <span className="font-bold">{data[0].vehicle.registration_number}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/20">
                <span className="text-gray-900/70 text-sm">Fuel Cost</span>
                <span className="font-bold">₹{data[0].fuel.cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/20">
                <span className="text-gray-900/70 text-sm">Maintenance</span>
                <span className="font-bold">₹{data[0].maintenance.cost.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <p className="text-gray-900/60 text-xs uppercase tracking-tighter">Total Monthly Expense</p>
                <p className="text-4xl font-display font-black mt-1">₹{data[0].total_cost.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col justify-center gap-4">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Ready for export</h3>
              <p className="text-gray-500 text-sm mb-6">Download the comprehensive financial report for this vehicle.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => exportFile('pdf')} className="btn-primary space-x-2">
                  <span className="text-[10px] bg-red-500 text-gray-900 px-1 rounded">PDF</span>
                  <span>Export PDF</span>
                </button>
                <button onClick={() => exportFile('excel')} className="btn-secondary space-x-2">
                  <span className="text-[10px] bg-green-500 text-gray-900 px-1 rounded">XLS</span>
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {generated && activeReport !== 'vehicle_monthly' && (
        <div className="card">
          <div className="p-4 border-b border-[#F1F5F9] flex justify-between items-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.length} entries matching criteria</p>
            <button onClick={exportCSV} className="text-primary hover:underline text-xs font-bold flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Quick Export CSV
            </button>
          </div>
          <DataTable
            columns={COLS_MAP[activeReport]}
            data={data}
            loading={loading}
            emptyMessage="No records for selected period"
          />
        </div>
      )}
    </div>
  );
}

