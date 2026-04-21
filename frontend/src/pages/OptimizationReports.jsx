import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Fuel, Clock, Map, AlertTriangle, Download, Filter, Search
} from 'lucide-react';
import { motion } from 'framer-motion';

const OptimizationReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/tracking/reports/optimization');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = reports.map(r => ({
    name: r.registration_number,
    distance: parseFloat(r.total_distance),
    efficiency: parseFloat(r.fuel_efficiency),
    idle: r.idle_time
  }));

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Generating Optimization Metrics...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Fleet Optimization Reports</h1>
          <p className="text-gray-500 mt-1">Advanced analytics for fuel, efficiency, and route compliance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm hover:shadow-md transition-all font-bold text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-bold text-sm">
            <Filter size={16} /> Filter Date Range
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Avg Efficiency', value: '12.4 km/l', icon: Fuel, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Distance', value: '1,240 km', icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Idle Alerts', value: '12', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Deviation Rate', value: '4.2%', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-5"
          >
            <div className={`${stat.bg} p-4 rounded-xl`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Fuel Efficiency by Vehicle
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="efficiency" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Map size={20} className="text-green-500" /> Distance Travelled (KM)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="distance" stroke="#10b981" fillOpacity={1} fill="url(#colorDist)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Vehicle Performance Breakdown</h3>
          <div className="relative">
            <input type="text" placeholder="Search vehicle..." className="pl-10 pr-4 py-2 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b">
              <th className="px-8 py-4">Registration</th>
              <th className="px-8 py-4">Total Distance</th>
              <th className="px-8 py-4">Fuel Efficiency</th>
              <th className="px-8 py-4">Idle Time</th>
              <th className="px-8 py-4">Route Compliance</th>
              <th className="px-8 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-4 font-bold text-gray-900">{report.registration_number}</td>
                <td className="px-8 py-4 text-sm">{report.total_distance} km</td>
                <td className="px-8 py-4 text-sm font-medium text-green-600">{report.fuel_efficiency} km/l</td>
                <td className="px-8 py-4 text-sm text-gray-500">{report.idle_time} mins</td>
                <td className="px-8 py-4">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${report.route_deviation === 'None' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {report.route_deviation === 'None' ? 'Compliant' : 'Deviation Detected'}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className={`w-2 h-2 rounded-full ${report.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptimizationReports;
