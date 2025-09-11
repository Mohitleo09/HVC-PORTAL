import { initializeDatabase, checkDatabaseStatus } from './initDb.js';

let isInitialized = false;
let initPromise = null;

/**
 * Initialize database on server side
 * This should only be called from server-side code
 */
export const initializeServerDatabase = async () => {
  // If already initialized, return immediately
  if (isInitialized) {
    return { success: true, message: 'Database already initialized' };
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      console.log('🚀 Server-side database initialization starting...');
      const result = await initializeDatabase();
      
      if (result.success) {
        isInitialized = true;
        console.log('✅ Server-side database initialization completed');
      } else {
        console.error('❌ Server-side database initialization failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Server-side database initialization error:', error);
      return { success: false, error: error.message };
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

/**
 * Check if database is ready for use
 */
export const isDatabaseReady = () => {
  return isInitialized;
};

/**
 * Get database status
 */
export const getDatabaseStatus = async () => {
  try {
    const status = await checkDatabaseStatus();
    return {
      ready: isInitialized,
      status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Force re-initialization (useful for testing)
 */
export const reinitializeDatabase = async () => {
  isInitialized = false;
  return await initializeServerDatabase();
};

export default initializeServerDatabase;
