
import React from 'react'
import {auth} from './auth'
import { redirect } from 'next/navigation';
import Navbar from './navbar/navbar';
import AdminPage from './admin/page';
import UserLogin from './loginRegister/UserLogin';
import LandingPage from './components/LandingPage';

const HomePage = async() => {
  let session;
  let dbError = null;
  
  try {
    // Try to get the session
    session = await auth();
    console.log("Session check successful:", session ? "YES" : "NO");
    if (session) {
      console.log("Session details:", {
        role: session?.user?.role || session?.role,
        username: session?.user?.username || session?.username
      });
    }
  } catch (error) {
    console.error("Session check failed:", error);
    dbError = error.message;
  }

  // If no session and there's a database error, show a helpful message
  if (!session && dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Initializing</h1>
          <p className="text-gray-600 mb-6">
            The system is currently setting up the database. This may take a few moments.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Page
            </button>
            
            <a
              href="/login"
              className="block w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Try Login
            </a>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">What's happening?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Database connection is being established</li>
              <li>• Collections and indexes are being created</li>
              <li>• Default data is being populated</li>
              <li>• This is normal on first startup</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // If no session or invalid session, show landing page first
  if (!session || !session.user || (!session.user.role && !session.role)) {
    console.log("No valid session found, showing landing page");
    return <LandingPage />;
  }

  // Get role and username from session
  const userRole = session.user?.role || session.role;
  const username = session.user?.username || session.username;

  console.log("User authenticated - Role:", userRole, "Username:", username);

  // If user is authenticated, show appropriate content
  if (userRole === 'user') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar username={username}/>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Home Page</h1>
          <p className="text-gray-600">Hello, {username}! You are logged in as a user.</p>
        </div>
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminPage/>;
  }

  // If role is neither user nor admin, show landing page
  console.log("Invalid role detected, showing landing page");
  return <LandingPage />;
}

export default HomePage