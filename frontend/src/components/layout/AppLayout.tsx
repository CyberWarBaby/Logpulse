import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/logs', icon: '📋', label: 'Logs' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/api-keys', icon: '🔑', label: 'API Keys' },
  { to: '/users', icon: '👥', label: 'Team' },
];

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const check = () => setWsConnected(getSocket()?.connected ?? false);
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-surface-1 border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-sm font-bold shadow-lg shadow-accent/30">
              ⚡
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm tracking-wide">LogPulse</div>
              <div className="text-xs text-gray-500 truncate max-w-[120px]">{user?.tenantName}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          {/* WS status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2">
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 live-dot' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-500">{wsConnected ? 'Live stream active' : 'Stream offline'}</span>
          </div>

          {/* User */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</div>
            </div>
            <button
              onClick={logout}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-xs"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
