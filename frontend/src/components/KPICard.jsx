export default function KPICard({ title, value, subtitle, icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-primary/10 text-primary-light border-primary/20',
    green: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    amber: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    red: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  };

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-[#374151] transition-colors group">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-gray-900">{value ?? '—'}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          <span>{trend > 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
  );
}
