'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trackLogout, getCurrentSessionInfo } from '../utils/activityTracker';

const LogoutButton = ({ className = '', children }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear storage immediately for faster logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.clear();
      }
      
      // Sign out immediately
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      });
      
      // Redirect to login page immediately
      router.push('/login');
      
      // Track logout activity in background (non-blocking)
      try {
        const sessionInfo = getCurrentSessionInfo();
        if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
          trackLogout(sessionInfo.currentUser.userId, sessionInfo.currentUser.username).catch(error => {
            console.warn('⚠️ Failed to track logout activity:', error);
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to track logout activity:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${className}`}
    >
      {children || (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </>
      )}
    </button>
  );
};

export default LogoutButton;
