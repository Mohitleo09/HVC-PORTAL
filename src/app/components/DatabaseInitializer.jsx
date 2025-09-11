"use client";
import { useEffect, useState } from 'react';

const DatabaseInitializer = () => {
  const [dbStatus, setDbStatus] = useState('checking');
  const [initStatus, setInitStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setDbStatus('checking');
      setError(null);

      // First check if database is already initialized
      const statusResponse = await fetch('/api/init');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        if (statusData.success && statusData.status.connected) {
          // Check if we have data in collections
          const collections = statusData.status.collections;
          const hasData = Object.values(collections).some(col => col.exists && col.count > 0);
          
          if (hasData) {
            setDbStatus('connected');
            setInitStatus('completed');
            console.log('✅ Database already initialized with data');
            return;
          }
        }
      }

      // Database needs initialization
      setInitStatus('initializing');
      console.log('🚀 Initializing database...');
      
      const initResponse = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (initResponse.ok) {
        const initData = await initResponse.json();
        if (initData.success) {
          setDbStatus('connected');
          setInitStatus('completed');
          console.log('✅ Database initialized successfully');
        } else {
          throw new Error(initData.error || 'Initialization failed');
        }
      } else {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || 'Initialization request failed');
      }
    } catch (err) {
      console.error('❌ Database initialization error:', err);
      setDbStatus('error');
      setInitStatus('failed');
      setError(err.message);
    }
  };

  const resetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all data.')) {
      return;
    }

    try {
      setInitStatus('resetting');
      console.log('🗑️ Resetting database...');
      
      const response = await fetch('/api/init', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Database reset successfully');
          // Re-initialize after reset
          await initializeDatabase();
        } else {
          throw new Error(data.error || 'Reset failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reset request failed');
      }
    } catch (err) {
      console.error('❌ Database reset error:', err);
      setError(err.message);
      setInitStatus('failed');
    }
  };

  // Don't render anything if everything is working
  if (dbStatus === 'connected' && initStatus === 'completed') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {dbStatus === 'checking' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Checking Database</h3>
              <p className="text-gray-600">Verifying database connection and status...</p>
            </>
          )}

          {initStatus === 'initializing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Initializing Database</h3>
              <p className="text-gray-600">Setting up collections and default data...</p>
            </>
          )}

          {dbStatus === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Database Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={initializeDatabase}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Retry Initialization
                </button>
                <button
                  onClick={resetDatabase}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Reset Database
                </button>
              </div>
            </>
          )}

          {initStatus === 'resetting' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resetting Database</h3>
              <p className="text-gray-600">Clearing all data and reinitializing...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseInitializer;
