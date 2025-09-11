import mongoose from "mongoose";
import { MONGODB_URI, DB_TIMEOUT, DB_NAME, validateConfig } from "./environment.js";

let isConnected = false;
let connectionPromise = null;

const DBConnection = async () => {
  // Check if MONGODB_URI is available
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is not set");
    console.error("❌ Please check your .env file and ensure MONGODB_URI is set correctly");
    throw new Error("MONGODB_URI environment variable is not set");
  }
  
  // Validate configuration first
  validateConfig();
  
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return;
  }

  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    console.log("⏳ Waiting for existing connection attempt...");
    return connectionPromise;
  }

  // Debug environment variables
  console.log("🔧 Environment check:", {
    hasMongoURI: !!MONGODB_URI,
    mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
    nodeEnv: process.env.NODE_ENV
  });

  // Create connection promise
  connectionPromise = (async () => {
    try {
      console.log("🔌 Connecting to MongoDB...");
      console.log("🔌 Connection string preview:", MONGODB_URI.substring(0, 50) + "...");
      
      // Configure mongoose options (updated for newer versions)
      const mongooseOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: DB_TIMEOUT,
        socketTimeoutMS: DB_TIMEOUT,
        connectTimeoutMS: DB_TIMEOUT,
        retryWrites: true,
        w: 'majority',
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        },
        // Remove deprecated options
        bufferCommands: false
      };

      // Connect to MongoDB with retry logic
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          await mongoose.connect(MONGODB_URI, mongooseOptions);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          retries--;
          console.log(`❌ Connection attempt failed. Retries left: ${retries}`);
          
          if (retries > 0) {
            console.log("⏳ Waiting 2 seconds before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (retries === 0) {
        throw new Error(`Failed to connect after 3 attempts. Last error: ${lastError.message}`);
      }
      
      // Set up connection event handlers
      mongoose.connection.on('connected', () => {
        console.log("✅ MongoDB connected successfully");
        isConnected = true;
        connectionPromise = null;
      });

      mongoose.connection.on('error', (err) => {
        console.error("❌ MongoDB connection error:", err);
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log("🔌 MongoDB disconnected");
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log("🔄 MongoDB reconnected");
        isConnected = true;
        connectionPromise = null;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log("✅ MongoDB connection closed through app termination");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error closing MongoDB connection:", err);
          process.exit(1);
        }
      });

      return mongoose.connection;
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      console.error("❌ Connection details:", {
        uri: MONGODB_URI ? `${MONGODB_URI.substring(0, 30)}...` : 'undefined',
        timeout: DB_TIMEOUT,
        nodeEnv: process.env.NODE_ENV
      });
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
};

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    if (!isConnected) {
      await DBConnection();
    }
    
    // Test the connection with a simple query
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', connected: true };
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message };
  }
};

// Close database connection
export const closeDatabaseConnection = async () => {
  try {
    if (isConnected && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      isConnected = false;
      connectionPromise = null;
      console.log("✅ MongoDB connection closed");
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
  }
};

export default DBConnection;
