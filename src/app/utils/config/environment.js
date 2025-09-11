// Environment Configuration
// This file centralizes all environment variables and provides fallbacks

export const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Hvcpotal:12345@cluster0.rw8ipin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "12345";

// Use current dev port (updated to 3003)
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:10000";

export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyA5t4d6c-vCkNh-hknavTfAvNroRUI0a2k";

export const SECRET_KEY = process.env.SECRET_KEY || "12345";

export const NODE_ENV = process.env.NODE_ENV || "development";

// Additional configuration values
export const DB_NAME = process.env.DB_NAME || "hcv_portal";
export const DB_TIMEOUT = parseInt(process.env.DB_TIMEOUT) || 30000;
export const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
export const MAX_FILES = parseInt(process.env.MAX_FILES) || 10;
export const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60; // 24 hours

// Validate required configuration
export const validateConfig = () => {
  const required = ['MONGODB_URI', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !process.env[key] && !eval(key));
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing required environment variables: ${missing.join(', ')}`);
    console.warn('Using fallback values. For production, set proper environment variables.');
  }
  
  return missing.length === 0;
};

// Export a config object for convenience
export const config = {
  MONGODB_URI,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  YOUTUBE_API_KEY,
  SECRET_KEY,
  NODE_ENV,
  DB_NAME,
  DB_TIMEOUT,
  API_TIMEOUT,
  MAX_FILE_SIZE,
  MAX_FILES,
  SESSION_MAX_AGE
};

export default config;
