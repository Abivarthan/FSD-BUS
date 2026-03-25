import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const fmt = (n) => n?.toLocaleString('en-IN') ?? '0';
const fmtCurrency = (n) => `₹${fmt(Math.round(n || 0))}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 text-xs">
        <p className="text-gray-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmtCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      api.get('/analytics/dashboard')
        .then(r => setData(r.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-[#FFFFFF]" />
        ))}
      </div>
    </div>
  );

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-xl font-display font-bold text-gray-900">Welcome to BusMS</h2>
          <p className="text-gray-500 mt-2">Use the sidebar to access your attendance and fuel logs.</p>
        </div>
      </div>
    );
  }

  const { kpis = {}, charts = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vehicles"
          value={kpis.total_vehicles}
          subtitle={`${kpis.active_vehicles} active`}
          color="blue"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>}
        />
        <KPICard
          title="Active Drivers"
          value={kpis.total_drivers}
          subtitle="Currently active"
          color="green"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
        />
        <KPICard
          title="Today's Attendance"
          value={kpis.today_attendance}
          subtitle="Drivers present today"
          color="cyan"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>}
        />
        <KPICard
          title="Fuel Cost Today"
          value={fmtCurrency(kpis.fuel_today)}
          subtitle="Today's total fuel"
          color="amber"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>}
        />
        <KPICard
          title="Monthly Expenses"
          value={fmtCurrency(kpis.monthly_expenses)}
          subtitle="This month total"
          color="purple"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
        />
        <KPICard
          title="Vehicles in Maintenance"
          value={kpis.vehicles_in_maintenance}
          subtitle="Currently being serviced"
          color="red"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>}
        />
        <KPICard
          title="Service Due Soon"
          value={kpis.maintenance_due}
          subtitle="Within next 7 days"
          color="amber"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
        />
        <KPICard
          title="Fleet Utilization"
          value={kpis.total_vehicles ? `${Math.round((kpis.active_vehicles / kpis.total_vehicles) * 100)}%` : '—'}
          subtitle="Active vehicles ratio"
          color="green"
          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly Expense Trend" subtitle="Combined categories">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="fuel" stroke="#10B981" strokeWidth={2} dot={false} name="Fuel" />
              <Line type="monotone" dataKey="maintenance" stroke="#F59E0B" strokeWidth={2} dot={false} name="Maintenance" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance Cost Trend" subtitle="Service expenses">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.maintenanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Fuel Cost by Vehicle" subtitle="This month">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.fuelByVehicle || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Fuel Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Expensive Vehicles" subtitle="Annual total (YTD)">
          <div className="space-y-4 pt-2">
            {(charts.topExpensiveVehicles || []).map((v, i) => {
              const max = charts.topExpensiveVehicles?.[0]?.total_cost || 1;
              const pct = Math.round((v.total_cost / max) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{v.vehicle}</span>
                    <span className="text-gray-500">{fmtCurrency(v.total_cost)}</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Expense Categories" subtitle="Monthly slice">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={charts.expenseByCategory || []}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {(charts.expenseByCategory || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Summary" subtitle="Last 7 days presence">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.attendanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="present" fill="#10B981" radius={[3, 3, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#EF4444" radius={[3, 3, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Driver Salaries" subtitle="Estimated payout (This month)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.salarySummary || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="salary" fill="#10B981" radius={[0, 3, 3, 0]} name="Salary" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
