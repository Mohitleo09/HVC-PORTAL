'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AuthCheck = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (requireAuth && status === 'unauthenticated') {
      // Not authenticated, redirect to login
      router.push('/login');
      return;
    }

    if (requireAdmin && session?.user) {
      const isAdmin = session.user.role === 'admin' || 
                     session.user.email === 'admin@hvc.com';
      
      if (!isAdmin) {
        // Not admin, redirect to user dashboard
        router.push('/Userdashboard');
        return;
      }
    }
  }, [session, status, requireAuth, requireAdmin, router]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show children if all checks pass
  return children;
};

export default AuthCheck;
