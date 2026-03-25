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
  const [bookingForm, setBookingForm] = useState({ date: '', seat: '', time: '' });
  const [error, setError] = useState('');

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

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
        navigate('/login');
        return;
    }
    setError('');
    try {
      await api.post('/bookings', {
        routeId: id,
        bookingDate: bookingForm.date,
        seatNumber: bookingForm.seat,
        departureTime: bookingForm.time || route.schedule[0]?.time
      });
      navigate('/customer-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  if (loading) return <div className="min-h-[400px] flex items-center justify-center h-full w-full bg-gray-50 rounded-2xl animate-pulse" />;
  if (!route) return <div className="text-center p-20 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm text-gray-500 font-bold uppercase tracking-widest">Route not found</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 text-gray-900">
      {/* Route Info */}
      <div className="flex-1 space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-4xl">🚌</div>
          <div>
            <h1 className="text-4xl font-display font-black text-gray-900 leading-tight">{route.name}</h1>
            <p className="text-gray-500 text-lg">{route.origin} → {route.destination}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2"><span>📅</span> Schedule Overview</p>
                <div className="space-y-4">
                    {route.schedule.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-all">
                            <span className="font-bold text-gray-900">{s.day}</span>
                            <span className="px-4 py-2 bg-white rounded-xl text-primary font-black shadow-sm group-hover:shadow-md transition-all">{s.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2"><span>✨</span> Premium Experience</p>
                    <ul className="space-y-4 text-sm text-gray-500 font-medium">
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> High-speed Wi-Fi available</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> Fully air-conditioned cabin</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> Comfortable leather seating</li>
                        <li className="flex items-center gap-3"><span className="text-primary text-lg">✓</span> 24/7 Roadside assistance</li>
                    </ul>
                 </div>
                 <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</p>
                        <p className="text-3xl font-display font-black text-primary">${route.price}</p>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="w-full lg:w-[400px]">
        <div className="bg-gray-900 rounded-[48px] p-10 text-white shadow-2xl shadow-gray-900/30 sticky top-24 transform hover:-translate-y-1 transition-all duration-500">
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
                 {route.schedule.map((s, i) => (
                    <option key={i} value={s.time} className="text-gray-900">{s.time} ({s.day})</option>
                 ))}
               </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1 text-center block">Select Your Seat</label>
              <div className="grid grid-cols-4 gap-3 bg-white/5 p-6 rounded-[32px] border border-white/10">
                {['A1', 'A2', '', 'A3', 'B1', 'B2', '', 'B3', 'C1', 'C2', '', 'C3', 'D1', 'D2', '', 'D3', 'E1', 'E2', '', 'E3'].map((s, i) => (
                  s === '' ? <div key={i} className="h-10" /> : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBookingForm(p => ({ ...p, seat: s }))}
                      className={`h-10 rounded-xl text-[10px] font-bold transition-all ${
                        bookingForm.seat === s 
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
              <span>Reserve Seat {bookingForm.seat}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>
          <p className="mt-8 text-center text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Secure Checkout • 24/7 Support</p>
        </div>
      </div>
    </div>
  );
}
