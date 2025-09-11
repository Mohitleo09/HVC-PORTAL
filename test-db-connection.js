// Test MongoDB Connection
// Run this with: node test-db-connection.js

const mongoose = require('mongoose');

// Test database connection
async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    const MONGODB_URI = "mongodb+srv://Hvcpotal:12345@cluster0.rw8ipin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    console.log('🔧 Connection string preview:', MONGODB_URI.substring(0, 50) + '...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Test a simple operation
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('❌ Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test
testConnection();
