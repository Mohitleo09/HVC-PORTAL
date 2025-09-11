'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LanguagesPage from '../components/Configure/Languages/page';
import DepartmentsPage from '../components/Configure/Departments/page';
import QuestionBankPage from '../components/Configure/QuestionBank/page';
import DoctorsPage from '../components/Doctors/page';
import RolesPermissionPage from '../components/Roles&Permission/page';
import SchedulePage from '../components/Schedule/page';
import TrendsPage from '../components/Trends/page';
import ReportsPage from '../components/Reports/page';
import UsersPage from '../components/Employee Weekly Data/page';
import LogoutButton from '../components/LogoutButton';
import Image from 'next/image';
import './nav.css';

// Icon components
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const RolesPermissionsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    {/* User circle */}
    <path
      fillRule="evenodd"
      d="M10 2a4 4 0 100 8 4 4 0 000-8zm-6 14a6 6 0 1112 0H4z"
      clipRule="evenodd"
    />
    {/* Key shape for permissions */}
    <path d="M14.5 11.5a2.5 2.5 0 10-2.5 2.5h.5v1h1v1h1l1.5-1.5a2.5 2.5 0 00-1.5-3z" />
  </svg>
);


const ConfigureIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M11.3 1.046a1 1 0 00-2.6 0l-.25 1.004a1 1 0 01-1.516.61l-.848-.49a1 1 0 00-1.366.366l-.5.866a1 1 0 00.366 1.366l.848.49a1 1 0 01.61 1.516l-1.004.25a1 1 0 000 2.6l1.004.25a1 1 0 01.61 1.516l-.848.49a1 1 0 00-.366 1.366l.5.866a1 1 0 001.366.366l.848-.49a1 1 0 011.516.61l.25 1.004a1 1 0 002.6 0l.25-1.004a1 1 0 011.516-.61l.848.49a1 1 0 001.366-.366l.5-.866a1 1 0 00-.366-1.366l-.848-.49a1 1 0 01-.61-1.516l1.004-.25a1 1 0 000-2.6l-1.004-.25a1 1 0 01-.61-1.516l.848-.49a1 1 0 00.366-1.366l-.5-.866a1 1 0 00-1.366-.366l-.848.49a1 1 0 01-1.516-.61L11.3 1.046zM10 13a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

const DoctorsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    {/* User (doctor head + shoulders) */}
    <path
      fillRule="evenodd"
      d="M10 2a4 4 0 100 8 4 4 0 000-8zm-6 14a6 6 0 1112 0H4z"
      clipRule="evenodd"
    />
    {/* Medical cross */}
    <path d="M14 7h1V5h2V3h-2V1h-2v2h-2v2h2v2z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrendsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 001 1h12a1 1 0 100-2H5.414l3.293-3.293a1 1 0 011.414 0L12 14.586l5.293-5.293a1 1 0 00-1.414-1.414L12 12.586l-1.879-1.879a3 3 0 00-4.242 0L3 13.586V17z"
      clipRule="evenodd"
    />
  </svg>
);

const ReportIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    {/* Document outline */}
    <path
      fillRule="evenodd"
      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 6a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h3a1 1 0 110 2H9a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const EmployeeDataIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    {/* Multiple users icon */}
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path d="M13 8a3 3 0 11-6 0 3 3 0 016 0zM7 8a3 3 0 100 6 3 3 0 000-6z" />
    <path d="M17 8a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const [isDark, setIsDark] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const { data: session } = useSession();
  const [activeContent, setActiveContent] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'roles-permission', label: 'Roles & Permission', icon: RolesPermissionsIcon },
    { id: 'configure', label: 'configure', icon: ConfigureIcon, hasDropdown: true },
    { id: 'doctors', label: 'doctors', icon: DoctorsIcon },
    { id: 'schedule', label: 'schedule', icon: ScheduleIcon },
    { id: 'trends', label: 'trends', icon: TrendsIcon },
    { id: 'report', label: 'report', icon: ReportIcon },
    { id: 'employee-data', label: 'Employee Weekly Report', icon: EmployeeDataIcon },
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
    if (path.startsWith('/admin')) return 'dashboard';
    if (path.startsWith('/roles-permission')) return 'roles-permission';
    if (path.startsWith('/configure')) return 'configure';
    if (path.startsWith('/doctors')) return 'doctors';
    if (path.startsWith('/schedule')) return 'schedule';
    if (path.startsWith('/trends')) return 'trends';
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/employee-data')) return 'employee-data';
    return 'dashboard';
  };

  // Update active item based on activeContent state
  const getActiveItem = () => {
    if (activeContent) return activeContent;
    return routeToId(pathname);
  };

  const activeItem = getActiveItem();

  const activeClasses = isDark
    ? 'bg-blue-900/40 text-blue-300 border-l-4 border-blue-400 active'
    : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 active';
  const inactiveClasses = 'text-white hover:bg-gray-700';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} navbar-container`}>
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white sidebar">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="hvc logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
              priority
            />
            <h1 className="text-xl font-bold"> HVC Portal</h1>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                                 onClick={() => {
                   if (item.hasDropdown) {
                     if (item.id === 'configure') setConfigureOpen(!configureOpen);
                   } else if (item.id === 'dashboard') {
                     setActiveContent(null);
                   } else if (item.id === 'roles-permission') {
                     setActiveContent('roles-permission');
                   } else if (item.id === 'doctors') {
                     setActiveContent('doctors');
                   } else if (item.id === 'schedule') {
                     setActiveContent('schedule');
                   } else if (item.id === 'trends') {
                     setActiveContent('trends');
                   } else if (item.id === 'report') {
                     setActiveContent('report');
                   } else if (item.id === 'employee-data') {
                     setActiveContent('employee-data');
                   }
                 }}
                className={`w-full flex items-center justify-between px-6 py-3 text-left nav-item ${
                  activeItem === item.id ? activeClasses : inactiveClasses
                }`}
              >
                <div className="flex items-center">
                  <item.icon />
                  <span className="ml-3">{item.label}</span>
                </div>
                {item.hasDropdown && (
                  <ChevronDownIcon />
                )}
              </button>
              
              {/* Dropdown items for Configure */}
              {item.id === 'configure' && configureOpen && (
                <div className="bg-gray-900 border-t border-gray-700 dropdown-content">
                  <button onClick={() => { setActiveContent('languages'); }} className="block w-full text-left px-6 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white">
                    Languages
                  </button>
                  <button onClick={() => { setActiveContent('departments'); }} className="block w-full text-left px-6 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white">
                    Departments
                  </button>
                  <button onClick={() => { setActiveContent('questionbank'); }} className="block w-full text-left px-6 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white">
                    Question Bank
                  </button>
                </div>
              )}
              
              
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
              <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Welcome To HVC Portal</h2>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 ml-4">
                <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Admin
                </span>
                <div className={`w-10 h-10 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-full flex items-center justify-center avatar`}>
                  <span className="text-white font-bold">
                    A
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeContent === 'languages' ? (
            <LanguagesPage />
          ) : activeContent === 'departments' ? (
            <DepartmentsPage />
          ) : activeContent === 'questionbank' ? (
            <QuestionBankPage />
          ) : activeContent === 'doctors' ? (
            <DoctorsPage />
          ) : activeContent === 'roles-permission' ? (
            <RolesPermissionPage />
          ) : activeContent === 'schedule' ? (
            <SchedulePage />
          ) : activeContent === 'trends' ? (
            <TrendsPage />
          ) : activeContent === 'report' ? (
            <ReportsPage />
          ) : activeContent === 'employee-data' ? (
            <UsersPage />
          ) : children ? (
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