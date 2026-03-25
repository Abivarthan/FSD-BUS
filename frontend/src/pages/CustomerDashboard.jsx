import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings');
        setBookings(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings(p => p.map(b => b._id === id ? { ...b, status: 'Cancelled' } : b));
    } catch (err) {
      alert('Cancellation failed');
    }
  };

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
  };

  const filters = [
    { label: 'All', value: 'all', count: stats.total },
    { label: 'Confirmed', value: 'Confirmed', count: stats.confirmed },
    { label: 'Completed', value: 'Completed', count: stats.completed },
    { label: 'Cancelled', value: 'Cancelled', count: stats.cancelled },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-gray-900 mb-1">
            Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-500 text-lg">Manage your trips and track live locations</p>
        </div>
        <Link to="/" className="btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-primary/20 font-bold flex items-center gap-2">
          <span>+</span> Book a Trip
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Bookings', value: stats.total, icon: '🎫', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Upcoming Trips', value: stats.confirmed, icon: '🚌', gradient: 'from-green-500 to-green-600' },
          { label: 'Completed', value: stats.completed, icon: '✅', gradient: 'from-purple-500 to-purple-600' },
          { label: 'Cancelled', value: stats.cancelled, icon: '❌', gradient: 'from-red-400 to-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="relative bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <span className="text-3xl">{stat.icon}</span>
              <p className="text-3xl font-display font-black text-gray-900 mt-3">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl w-fit">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              filter === f.value
                ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              filter === f.value ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] text-center border border-gray-100 shadow-sm">
          <div className="text-6xl mb-6">🎫</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'all' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Ready to start your journey? Explore our routes and book your first trip with BusMS.
          </p>
          <Link to="/" className="btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 inline-flex">
            Find a Bus
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all group">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  {/* Date Badge */}
                  <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-white font-black flex-shrink-0 ${
                    booking.status === 'Cancelled' ? 'bg-gray-400' :
                    booking.status === 'Completed' ? 'bg-green-500' : 'bg-primary'
                  }`}>
                    <span className="text-xs uppercase tracking-tighter opacity-80">
                      {new Date(booking.booking_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl">
                      {new Date(booking.booking_date).getDate()}
                    </span>
                  </div>

                  {/* Route Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{booking.route?.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 items-center">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-lg">📍</span> {booking.route?.origin}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-lg">🏁</span> {booking.route?.destination}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        💺 Seat {booking.seat_number}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        🕐 {booking.departure_time}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        🚌 {booking.route?.vehicle_type || 'Bus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    booking.status === 'Confirmed' ? 'bg-green-50 text-green-600 border-green-200' :
                    booking.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                    booking.status === 'Completed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    {booking.status}
                  </div>
                  <div className="text-2xl font-display font-black text-gray-900">${booking.price}</div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/booking-details/${booking._id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </Link>
                    {booking.status === 'Confirmed' && (
                      <>
                        <Link
                          to={`/track/${booking._id}`}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-lg shadow-primary/20"
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          Track Live
                        </Link>
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
