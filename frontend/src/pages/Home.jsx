import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAdmin, isCustomer } = useAuth();
  const [search, setSearch] = useState({ origin: '', destination: '' });
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/routes?origin=${search.origin}&destination=${search.destination}`);
      setRoutes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>B</div>
          <span className="text-2xl font-display font-bold text-gray-900 tracking-tight cursor-pointer" onClick={() => navigate('/')}>BusMS</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <Link 
              to={isAdmin() ? "/dashboard" : "/customer-dashboard"} 
              className="btn-primary px-8 py-2.5 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 font-medium hover:text-primary transition-colors">Login</Link>
              <Link to="/register" className="btn-primary px-8 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-display font-black text-gray-900 mb-6 leading-[1.1]">
              Travel Smarter, <br />
              <span className="text-primary italic">Live Better.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Premium bus booking and fleet management platform. 
              Real-time tracking, secure bookings, and elite comfort.
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 mb-20 animate-fade-in-up">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Origin</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                  <input 
                    type="text" 
                    placeholder="Where from?" 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                    value={search.origin}
                    onChange={e => setSearch(p => ({ ...p, origin: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Destination</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🏁</span>
                  <input 
                    type="text" 
                    placeholder="Where to?" 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                    value={search.destination}
                    onChange={e => setSearch(p => ({ ...p, destination: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {loading ? 'Searching...' : (
                    <>
                      <span>Find Buses</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {routes.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Available Routes</h2>
              {routes.map(route => (
                <div key={route._id} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer" onClick={() => navigate(`/booking/${route._id}`)}>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-primary group-hover:text-white transition-colors">🚌</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{route.name}</h3>
                      <p className="text-gray-500 text-sm">Departure: {route.schedule[0]?.time} | {route.vehicle_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase">Price</p>
                      <p className="text-2xl font-display font-black text-primary">${route.price}</p>
                    </div>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-primary transition-colors">Book Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { icon: '🛡️', title: 'Secure Booking', desc: 'Encrypted payments and guaranteed reservations for your peace of mind.' },
              { icon: '⚡', title: 'Real-time Updates', desc: 'Get live notifications on bus location and arrival times via our app.' },
              { icon: '⭐', title: 'Elite Comfort', desc: 'Our fleet features premium leather seating, climate control, and Wi-Fi.' },
            ].map(f => (
              <div key={f.title} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className="text-5xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
