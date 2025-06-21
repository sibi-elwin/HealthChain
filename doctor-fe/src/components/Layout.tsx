import { ReactNode, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  LayoutDashboard as DashboardIcon,
  Stethoscope as MedicalIcon,
  Bell as NotificationsIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  LogOut as LogoutIcon,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, path: '/dashboard' },
    { text: 'Medical Records Access', icon: <MedicalIcon className="w-5 h-5" />, path: '/medical-records-access' },
    { text: 'Notifications', icon: <NotificationsIcon className="w-5 h-5" />, path: '/notifications' },
    { text: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, path: '/settings' },
    { text: 'About', icon: <InfoIcon className="w-5 h-5" />, path: '/about' },
  ];

  const drawer = (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h1 className="text-xl font-bold">HealthChain (Doctor)</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-4 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="ml-3 text-base">{item.text}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogoutIcon className="w-5 h-5" />
          <span className="ml-3 text-base">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleDrawerToggle}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-primary-700">HealthChain</h1>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {drawer}
        </aside>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={handleDrawerToggle}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 