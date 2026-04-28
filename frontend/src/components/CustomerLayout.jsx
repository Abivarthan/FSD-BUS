import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatbotWidget from './ChatbotWidget';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Find Routes', icon: '🔍' },
    { to: '/customer-dashboard', label: 'My Bookings', icon: '🎫' },
    { to: '/customer-profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-surface-hover flex flex-col">
      {/* Navbar */}
      <nav className="bg-surface-card/80 backdrop-blur-md border-b border-surface-border px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">B</div>
          <span className="text-xl font-display font-bold text-white tracking-tight">BusMS</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-surface-border">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">{user?.role}</p>
             </div>
             <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/10">
                {user?.name?.charAt(0)}
             </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="text-xs font-bold text-gray-400 hover:text-accent-red uppercase tracking-widest transition-colors">Logout</button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-card border-b border-surface-border px-6 py-4 space-y-2 animate-fade-in">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-8 py-10 animate-fade-in text-white">
        <Outlet />
      </main>

      <ChatbotWidget />
    </div>
  );
}
