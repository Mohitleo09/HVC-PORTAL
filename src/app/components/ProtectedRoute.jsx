'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const ProtectedRoute = ({ children, requireAdmin = false, fallback = null }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ProtectedRoute - Status:", status);
    console.log("ProtectedRoute - Session:", session);
    console.log("ProtectedRoute - RequireAdmin:", requireAdmin);
    
    // Check authentication status
    if (status === 'loading') {
      console.log("ProtectedRoute - Still loading...");
      return; // Still loading
    }

    if (status === 'unauthenticated') {
      console.log("ProtectedRoute - Unauthenticated, redirecting to login");
      // No session, redirect to login
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session) {
      console.log("ProtectedRoute - Authenticated, checking admin access");
      
      // Check if user is deactivated (this would be handled by the auth system, but double-check)
      if (session.user?.status === 'deactivated') {
        console.log("ProtectedRoute - User is deactivated, redirecting to login");
        router.push('/login');
        return;
      }
      
      // Check if admin access is required
      if (requireAdmin) {
        const isAdmin = session.user?.role === 'admin' || 
                       session.user?.email === 'admin@hvc.com';
        console.log("ProtectedRoute - Is admin:", isAdmin);
        
        if (!isAdmin) {
          console.log("ProtectedRoute - Not admin, redirecting to user dashboard");
          // Not admin, redirect to user dashboard
          router.push('/Userdashboard');
          return;
        }
      }
      
      console.log("ProtectedRoute - User authorized, setting state");
      // User is authorized
      setIsAuthorized(true);
    }

    setLoading(false);
  }, [session, status, requireAdmin, router]);

  // Show loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authorized
  if (!isAuthorized) {
    return fallback || null;
  }

  // Render children if authorized
  return children;
};

export default ProtectedRoute;
