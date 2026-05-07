import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({ date: '', seats: [], time: '', meal: 'None' });
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await api.get(`/routes/${id}`);
        setRoute(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  const toggleSeat = (s) => {
    setBookingForm(p => {
      const seats = [...p.seats];
      const idx = seats.indexOf(s);
      if (idx > -1) {
        seats.splice(idx, 1);
      } else {
        seats.push(s);
      }
      return { ...p, seats };
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
        navigate('/login');
        return;
    }
    if (bookingForm.seats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }
    setError('');
    try {
      const res = await api.post('/bookings', {
        routeId: id,
        bookingDate: bookingForm.date,
        seatNumber: bookingForm.seats,
        departureTime: bookingForm.time || route.schedule[0]?.time,
        mealPreference: bookingForm.meal
      });
      setSuccessBooking(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  const downloadTicket = () => {
    const printContent = document.getElementById('ticket-downloadable');
    const WinPrint = window.open('', '', 'width=900,height=650');
    WinPrint.document.write('<html><head><title>BusMS Ticket</title>');
    WinPrint.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
    WinPrint.document.write('<style>.barcode { height: 60px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px); width: 200px; margin: 10px auto; }</style>');
    WinPrint.document.write('</head><body>');
    WinPrint.document.write(printContent.innerHTML);
    WinPrint.document.write('</body></html>');
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 500);
  };

  if (loading) return <div className="min-h-[400px] flex items-center justify-center h-full w-full bg-surface-card rounded-2xl animate-pulse" />;
  if (!route) return <div className="text-center p-20 bg-surface-card rounded-2xl border border-slate-800 shadow-sm text-slate-500 font-bold uppercase tracking-widest">Route not found</div>;

  if (successBooking) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="bg-surface-card rounded-[40px] shadow-2xl overflow-hidden border border-slate-800" id="ticket-downloadable">
          <div className="bg-primary p-8 text-white text-center">
            <h2 className="text-3xl font-display font-black tracking-tight mb-2">E-TICKET</h2>
            <p className="text-white/60 font-medium uppercase tracking-widest text-xs">Thank you for traveling with BusMS</p>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="flex justify-between items-start border-b border-slate-800 pb-8">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Route</p>
                <h3 className="text-xl font-bold text-white">{route.name}</h3>
                <p className="text-sm text-slate-400">{route.origin} → {route.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date & Time</p>
                <p className="font-bold text-white">{new Date(successBooking.booking_date).toLocaleDateString()}</p>
                <p className="text-sm font-black text-primary uppercase">{successBooking.departure_time}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Passenger</p>
                <p className="font-bold text-white text-lg">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Seats {successBooking.meal_preference !== 'None' && '(Incl. Meal)'}</p>
                <p className="font-bold text-white text-lg">{successBooking.seat_number}</p>
                <p className="text-xs text-slate-400">{successBooking.seat_number.split(',').length} Passengers {successBooking.meal_preference !== 'None' && `• ${successBooking.meal_preference}`}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl flex justify-between items-center border border-slate-800">
               <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Paid</p>
                 <p className="text-2xl font-display font-black text-primary">₹{successBooking.price}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">{successBooking.status}</span>
               </div>
            </div>

            <div className="pt-8 border-t border-dashed border-slate-800 text-center">
              <div className="barcode mb-2" style={{ height: '60px', background: 'repeating-linear-gradient(90deg, #fff, #fff 2px, #000 2px, #000 4px)', width: '240px', margin: '0 auto' }}></div>
              <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-[0.5em]">{successBooking._id.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={downloadTicket}
            className="flex-1 py-5 bg-primary text-white rounded-[28px] font-black text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-3"
          >
            <span>Download Ticket</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button 
            onClick={() => navigate('/customer-dashboard')}
            className="flex-1 py-5 bg-gray-900 text-white rounded-[28px] font-black text-lg shadow-xl shadow-gray-900/30 hover:shadow-gray-900/50 transition-all flex items-center justify-center gap-3"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isSleeper = route.bus_type?.includes('Sleeper');

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 text-slate-200">
      {/* Route Info */}
      <div className="flex-1 space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-4xl">🚌</div>
          <div>
            <h1 className="text-4xl font-display font-black text-white leading-tight">{route.name}</h1>
            <p className="text-slate-400 text-lg">{route.origin} → {route.destination}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-card p-8 rounded-[40px] border border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2 flex items-center gap-2"><span>📅</span> Schedule Overview</p>
                <div className="space-y-4">
                    {route.schedule.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl group hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20">
                            <span className="font-bold text-white">{s.day}</span>
                            <span className="px-4 py-2 bg-slate-800 rounded-xl text-primary font-black shadow-sm group-hover:shadow-glow-primary transition-all">{s.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-surface-card p-8 rounded-[40px] border border-slate-800 shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2 flex items-center gap-2"><span>✨</span> Premium Experience</p>
                    <ul className="space-y-4 text-sm text-slate-400 font-medium">
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> High-speed Wi-Fi available</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> Fully air-conditioned cabin</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> Comfortable leather seating</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> 24/7 Roadside assistance</li>
                        {isSleeper && <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">🥗</span> Complimentary Meal Included</li>}
                        <li className="flex items-center gap-3 border-t border-slate-800 pt-2 mt-2"><span className="text-primary text-lg">🛣️</span> Distance: {route.distance || '—'}</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">⏱️</span> Duration: {route.duration || '—'}</li>
                    </ul>
                 </div>
                  <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
                     <div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pricing (Per Seat)</p>
                         <p className="text-3xl font-display font-black text-primary">₹{route.price}</p>
                     </div>
                     {bookingForm.seats.length > 0 && (
                       <div className="text-right">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total ({bookingForm.seats.length} Seats)</p>
                         <p className="text-3xl font-display font-black text-emerald-500">₹{route.price * bookingForm.seats.length}</p>
                       </div>
                     )}
                  </div>
            </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="w-full lg:w-[400px]">
        <div className="bg-surface-card rounded-[48px] p-10 text-white shadow-2xl shadow-slate-950/50 border border-slate-800 sticky top-24 transform hover:-translate-y-1 transition-all duration-500">
          <h2 className="text-2xl font-display font-black mb-8">Reservation Info</h2>
          <form onSubmit={handleBooking} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Travel Date</label>
              <input 
                type="date" 
                className="w-full px-6 py-4 bg-white/10 border-none rounded-2xl focus:ring-2 focus:ring-primary/40 transition-all font-medium text-white placeholder:text-white/20"
                value={bookingForm.date}
                onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Departure Time</label>
               <select 
                className="w-full px-6 py-4 bg-white/10 border-none rounded-2xl focus:ring-2 focus:ring-primary/40 transition-all font-medium text-white appearance-none"
                value={bookingForm.time}
                onChange={e => setBookingForm(p => ({ ...p, time: e.target.value }))}
                required
               >
                 <option value="" disabled className="text-gray-900">Select Time</option>
                 {Array.from({ length: 48 }, (_, i) => {
                   const totalMins = i * 30;
                   const h24 = Math.floor(totalMins / 60);
                   const mins = totalMins % 60;
                   const ampm = h24 < 12 ? 'AM' : 'PM';
                   const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
                   const label = `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
                   return (
                     <option key={i} value={label} className="text-gray-900">{label}</option>
                   );
                 })}
               </select>
            </div>

            {isSleeper && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Complimentary Meal</label>
                <div className="flex gap-3">
                  {['None', 'Veg', 'Non-Veg'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBookingForm(p => ({ ...p, meal: m }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                        bookingForm.meal === m 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1 text-center block">Select Your Seat(s)</label>
              <div className="grid grid-cols-4 gap-3 bg-white/5 p-6 rounded-[32px] border border-white/10">
                {['A1', 'A2', '', 'A3', 'B1', 'B2', '', 'B3', 'C1', 'C2', '', 'C3', 'D1', 'D2', '', 'D3', 'E1', 'E2', '', 'E3'].map((s, i) => (
                  s === '' ? <div key={i} className="h-10" /> : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleSeat(s)}
                      className={`h-10 rounded-xl text-[10px] font-bold transition-all ${
                        bookingForm.seats.includes(s) 
                        ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-2 ring-primary/20 scale-110' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  )
                ))}
              </div>
              <p className="text-[10px] text-center text-white/30 italic">Front of Bus ↑</p>
            </div>

            {error && <div className="text-accent-red text-xs font-bold uppercase tracking-widest bg-accent-red/10 p-4 rounded-2xl text-center border border-accent-red/20">{error}</div>}

            <button type="submit" className="w-full py-5 bg-primary text-white rounded-[28px] font-black text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span>Reserve {bookingForm.seats.length || 0} Seat(s)</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>
          <p className="mt-8 text-center text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Secure Checkout • 24/7 Support</p>
        </div>
      </div>
    </div>
  );
}
