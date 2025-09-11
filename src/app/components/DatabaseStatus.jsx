"use client";
import { useState, useEffect } from 'react';

const DatabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  const checkStatus = async () => {
    try {
      setStatus('checking');
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.success && data.database?.ready) {
        setStatus('connected');
      } else {
        setStatus('initializing');
      }
      
      setLastCheck(new Date());
    } catch (error) {
      setStatus('error');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'initializing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '✅ Database Connected';
      case 'initializing': return '🔄 Database Initializing';
      case 'error': return '❌ Database Error';
      default: return '⏳ Checking Status';
    }
  };

  // Only show if there's an issue or during initialization
  if (status === 'connected' && lastCheck) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg border ${getStatusColor()}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{getStatusText()}</span>
          {status === 'checking' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          )}
        </div>
        {lastCheck && (
          <div className="text-xs opacity-75 mt-1">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}
        <button
          onClick={checkStatus}
          className="text-xs underline mt-1 hover:no-underline"
        >
          Check again
        </button>
      </div>
    </div>
  );
};

export default DatabaseStatus;
