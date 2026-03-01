import { Outlet, NavLink } from 'react-router-dom';
import { Home, UserPlus, FileCheck, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/business', icon: Home, label: 'Dashboard' },
  { to: '/business/guest-entry', icon: UserPlus, label: 'Guest Entry' },
  { to: '/business/submission', icon: FileCheck, label: 'Submission' },
  { to: '/business/messages', icon: MessageSquare, label: 'Messages' },
];

export default function BusinessLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gov-blue text-white fixed h-full">
        <div className="p-6 border-b border-gov-gold/30">
          <h1 className="text-lg font-bold">San Pablo City</h1>
          <p className="text-xs text-gray-300 mt-0.5">Tourism Demographics</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/business'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-gov-gold text-gov-blue' : 'hover:bg-white/10'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gov-gold/30">
          <div className="px-4 py-2 text-sm text-gray-300 truncate">
            {user?.business?.businessName || user?.email}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gov-blue text-white flex justify-around items-center py-2 px-2 safe-area-pb z-50">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/business'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 px-4 rounded-lg min-w-[64px] ${
                isActive ? 'bg-gov-gold text-gov-blue' : 'text-white'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
