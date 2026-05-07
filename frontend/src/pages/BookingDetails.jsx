import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/tracking/${id}/details`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading booking details...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center p-20 bg-gray-50 rounded-[32px] border border-gray-100">
      <p className="text-gray-500 font-bold uppercase tracking-widest">Booking not found</p>
    </div>
  );

  const { booking, route, vehicle, driver } = data;

  const statusColors = {
    Confirmed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    Completed: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customer-dashboard')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Bookings
      </button>

      {/* Booking Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary/60 rounded-[40px] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[booking.status] || statusColors.Pending}`}>
                  {booking.status}
                </span>
                <span className="text-white/40 text-xs">ID: {booking.id?.slice(-8)}</span>
              </div>
              <h1 className="text-4xl font-display font-black mb-2">{route.name}</h1>
              <p className="text-white/60 text-lg">{route.origin} → {route.destination}</p>
            </div>
            {booking.status === 'Confirmed' && (
              <>
              <Link
                to={`/track/${id}`}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 active:scale-[0.98] transition-all flex items-center gap-3 group"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                Track Live
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <button
                onClick={() => {
                  const WinPrint = window.open('', '', 'width=900,height=650');
                  WinPrint.document.write('<html><head><title>BusMS Ticket</title>');
                  WinPrint.document.write('<style>body{font-family:sans-serif;padding:40px}.barcode{height:60px;background:repeating-linear-gradient(90deg,#000,#000 2px,#fff 2px,#fff 4px);width:240px;margin:10px auto}</style>');
                  WinPrint.document.write('</head><body>');
                  WinPrint.document.write(`<div style="max-width:500px;margin:0 auto;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden"><div style="background:#2563eb;color:white;padding:32px;text-align:center"><h2 style="font-size:28px;font-weight:900;margin:0">E-TICKET</h2><p style="margin:4px 0 0;opacity:.6;font-size:11px;text-transform:uppercase;letter-spacing:2px">BusMS Travel</p></div><div style="padding:40px"><h3 style="font-size:18px;font-weight:700;margin:0 0 4px">${route.name}</h3><p style="color:#6b7280;margin:0 0 24px">${route.origin} &rarr; ${route.destination}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid #f3f4f6;padding-top:24px;margin-bottom:24px"><div><p style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">Travel Date</p><p style="font-weight:600;margin:0">${new Date(booking.booking_date).toLocaleDateString()}</p></div><div><p style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">Departure</p><p style="font-weight:600;margin:0">${booking.departure_time}</p></div><div><p style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">Seat(s)</p><p style="font-weight:600;margin:0">${booking.seat_number}</p></div><div><p style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">Total Paid</p><p style="font-weight:800;color:#2563eb;font-size:18px;margin:0">₹${booking.price}</p></div></div><div style="text-align:center;border-top:1px dashed #d1d5db;padding-top:24px"><div class="barcode"></div><p style="font-size:9px;font-family:monospace;color:#9ca3af;letter-spacing:.3em;text-transform:uppercase;margin:8px 0 0">${booking.id || booking._id}</p></div></div></div>`);
                  WinPrint.document.write('</body></html>');
                  WinPrint.document.close();
                  WinPrint.focus();
                  setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 500);
                }}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Ticket
              </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Info */}
        <div className="bg-surface-card p-8 rounded-[32px] border border-slate-800 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>🎫</span> Booking Information
          </h2>
          <div className="space-y-5">
            {[
              { label: 'Travel Date', value: new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
              { label: 'Departure Time', value: booking.departure_time, icon: '🕐' },
              { label: 'Seat Number', value: booking.seat_number, icon: '💺' },
              { label: 'Price', value: `₹${booking.price}`, icon: '💰' },
              { label: 'Meal Preference', value: booking.meal_preference || 'None', icon: '🥗' },
              { label: 'Payment Status', value: booking.payment_status, icon: '💳' },
              { label: 'Bus Type', value: route.bus_type || 'Bus', icon: '🚌' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-2xl hover:bg-slate-800/50 transition-colors">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <p className="text-white font-semibold text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-surface-card p-8 rounded-[32px] border border-slate-800 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>🚌</span> Vehicle Details
          </h2>
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto bg-primary/5 rounded-[28px] flex items-center justify-center text-5xl mb-4">
              🚌
            </div>
            <h3 className="text-xl font-display font-black text-white">{vehicle.model}</h3>
            <p className="text-primary font-bold text-sm mt-1">{vehicle.registration_number}</p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Type', value: vehicle.vehicle_type?.charAt(0).toUpperCase() + vehicle.vehicle_type?.slice(1) },
              { label: 'Capacity', value: `${vehicle.capacity} seats` },
              { label: 'Fuel Type', value: vehicle.fuel_type?.charAt(0).toUpperCase() + vehicle.fuel_type?.slice(1) },
              { label: 'Status', value: vehicle.status?.charAt(0).toUpperCase() + vehicle.status?.slice(1) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">✓ Safety Inspected</p>
            <p className="text-xs text-emerald-500/60 mt-1">Last inspection: 3 days ago</p>
          </div>
        </div>

        {/* Driver Info */}
        <div className="bg-surface-card p-8 rounded-[32px] border border-slate-800 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>👨‍✈️</span> Driver Details
          </h2>
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-[28px] flex items-center justify-center text-4xl font-display font-black text-white mb-4 shadow-xl shadow-primary/20">
              {driver.name?.charAt(0)}
            </div>
            <h3 className="text-xl font-display font-black text-white">{driver.name}</h3>
            <p className="text-slate-400 text-sm mt-1">Professional Driver</p>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < Math.floor(parseFloat(driver.rating)) ? 'text-amber-400' : 'text-slate-800'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm font-bold text-white ml-1">{driver.rating}</span>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Phone', value: driver.phone, icon: '📱' },
              { label: 'License No.', value: driver.license_number, icon: '🪪' },
              { label: 'Total Trips', value: driver.total_trips, icon: '🛣️' },
              { label: 'Status', value: driver.status?.charAt(0).toUpperCase() + driver.status?.slice(1), icon: '🟢' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <p className="text-white font-semibold text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
            📞 Contact Driver
          </button>
        </div>
      </div>

      {/* Route Stops */}
      {route.stops?.length > 0 && (
        <div className="bg-surface-card p-8 rounded-[32px] border border-slate-800 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>📍</span> Route Stops
          </h2>
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            <div className="flex-shrink-0 px-5 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20">
              📍 {route.origin}
            </div>
            {route.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-4 flex-shrink-0">
                <div className="w-8 border-t-2 border-dashed border-slate-800" />
                <div className="px-5 py-3 bg-slate-900/50 rounded-2xl text-slate-300 font-semibold text-sm border border-slate-800">
                  {stop}
                </div>
              </div>
            ))}
            <div className="w-8 border-t-2 border-dashed border-slate-800 flex-shrink-0" />
            <div className="flex-shrink-0 px-5 py-3 bg-slate-950 text-white rounded-2xl font-bold text-sm shadow-lg">
              🏁 {route.destination}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
