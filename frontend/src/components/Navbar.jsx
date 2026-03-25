import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Buses',
  '/drivers': 'Drivers',
  '/attendance': 'Attendance',
  '/fuel': 'Fuel Logs',
  '/expenses': 'Expenses',
  '/maintenance': 'Maintenance',
  '/reports': 'Reports',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Bus Management';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-[#FFFFFF]/80 backdrop-blur flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1">
        <h1 className="text-base font-display font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          <span className="text-xs text-accent-green font-medium">System Online</span>
        </div>
      </div>
    </header>
  );
}
