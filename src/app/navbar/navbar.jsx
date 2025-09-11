'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '../components/LogoutButton';
import { trackPageNavigation, getCurrentSessionInfo } from '../utils/activityTracker';
import './navbar.css';

// Icon components
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ThumbnailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const Navbar = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    console.log("Navbar - Session:", session);
  }, [session]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/Userdashboard' },
    { id: 'thumbnail', label: 'Thumbnail', icon: ThumbnailIcon, path: '/thumbnail' },
    { id: 'schedule', label: 'Schedule', icon: ScheduleIcon, path: '/schedule' },
  ];

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = stored ? stored === 'dark' : prefersDark;
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      } catch {}
      return next;
    });
  };

  const routeToId = (path) => {
    if (!path) return 'dashboard';
    if (path.startsWith('/Userdashboard')) return 'dashboard';
    if (path.startsWith('/thumbnail')) return 'thumbnail';
    if (path.startsWith('/schedule')) return 'schedule';
    return 'dashboard';
  };

  const activeItem = routeToId(pathname);

  const activeClasses = isDark
    ? 'bg-blue-900/40 text-blue-300 border-l-4 border-blue-400 active'
    : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 active';
  const inactiveClasses = 'text-white hover:bg-gray-700';

  const handleNavClick = async (item) => {
    // Track navigation activity
    try {
      const sessionInfo = getCurrentSessionInfo();
      if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
        await trackPageNavigation(
          sessionInfo.currentUser.userId,
          sessionInfo.currentUser.username,
          item.label,
          activeItem
        );
      }
    } catch (error) {
      console.warn('⚠ Failed to track navigation activity:', error);
    }
    
    router.push(item.path);
  };

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} navbar-container`}>
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white sidebar">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt ="HVC Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
              priority
            />
            <h1 className="text-xl font-bold">HVC Portal</h1>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center px-6 py-3 text-left nav-item ${
                  activeItem === item.id ? activeClasses : inactiveClasses
                }`}
              >
                <div className="flex items-center">
                  <item.icon />
                  <span className="ml-3">{item.label}</span>
                </div>
              </button>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6">
          <LogoutButton className="w-full">
            <div className="logout">
              Logout
            </div>
          </LogoutButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col main-content">
        {/* Top Navigation Bar */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                Welcome To HVC Portal
              </h2>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme} 
                aria-label="Toggle theme" 
                className={`p-2 rounded-full icon-button ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
              >
                {isDark ? <MoonIcon /> : <SunIcon />}
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3 ml-4">
                <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {session?.user?.username || session?.user?.name || 'User'}
                </span>
                <div className={`w-10 h-10 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-full flex items-center justify-center avatar`}>
                  <span className="text-white font-bold">
                    {(() => {
                      const displayName = session?.user?.username || session?.user?.name;
                      return displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : 'U';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {children ? (
            children
          ) : (
            <div className={`${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} rounded-lg shadow p-6`}>
              <h3 className="text-lg font-semibold mb-4">Dashboard Content</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                This is the main content area.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;