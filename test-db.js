// Comprehensive Database Connectivity Test
// This script tests all database models and connections to ensure complete MongoDB integration

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Hvcpotal:12345@cluster0.rw8ipin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Import all models
import User from './src/app/utils/models/User.js';
import Department from './src/app/utils/models/Department.js';
import Doctor from './src/app/utils/models/Doctor.js';
import Language from './src/app/utils/models/Language.js';
import Question from './src/app/utils/models/Question.js';
import Schedule from './src/app/utils/models/Schedule.js';
import Trend from './src/app/utils/models/Trend.js';
import Workflow from './src/app/utils/models/Workflow.js';
import Video from './src/app/utils/models/Video.js';
import Short from './src/app/utils/models/Short.js';
import Thumbnail from './src/app/utils/models/Thumbnail.js';

// All models to test
const models = {
  users: User,
  departments: Department,
  doctors: Doctor,
  languages: Language,
  questions: Question,
  schedules: Schedule,
  trends: Trend,
  workflows: Workflow,
  videos: Video,
  shorts: Short,
  thumbnails: Thumbnail
};

async function testDatabaseConnectivity() {
  console.log('🚀 Starting comprehensive database connectivity test...\n');
  
  try {
    // Test MongoDB connection
    console.log('🔌 Testing MongoDB connection...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      bufferCommands: false,
    });
    console.log('✅ MongoDB connection successful!\n');
    
    // Test each model
    console.log('🔍 Testing all database models...\n');
    const results = {};
    
    for (const [modelName, Model] of Object.entries(models)) {
      try {
        console.log(`📊 Testing ${modelName} model...`);
        
        // Test basic operations
        const count = await Model.countDocuments();
        console.log(`   ✅ Count: ${count} documents`);
        
        // Test find operation
        const sample = await Model.findOne();
        if (sample) {
          console.log(`   ✅ Sample document found with ID: ${sample._id}`);
        } else {
          console.log(`   ℹ️  No documents found (empty collection)`);
        }
        
        // Test model schema
        const schema = Model.schema.obj;
        const fields = Object.keys(schema);
        console.log(`   ✅ Schema: ${fields.length} fields (${fields.join(', ')})`);
        
        results[modelName] = {
          status: 'connected',
          count,
          hasSample: !!sample,
          fieldCount: fields.length,
          fields
        };
        
        console.log(`   🎉 ${modelName} model test passed!\n`);
        
      } catch (error) {
        console.error(`   ❌ ${modelName} model test failed:`, error.message);
        results[modelName] = {
          status: 'error',
          error: error.message
        };
        console.log('');
      }
    }
    
    // Test database operations
    console.log('🔧 Testing database operations...\n');
    
    try {
      // Test aggregation
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log(`✅ Database collections: ${collections.length} found`);
      collections.forEach(col => console.log(`   📁 ${col.name}`));
      console.log('');
      
      // Test indexes
      for (const [modelName, Model] of Object.entries(models)) {
        try {
          const indexes = await Model.collection.indexes();
          console.log(`✅ ${modelName} indexes: ${indexes.length} found`);
        } catch (error) {
          console.log(`⚠️  ${modelName} indexes: Could not retrieve`);
        }
      }
      console.log('');
      
    } catch (error) {
      console.error('❌ Database operations test failed:', error.message);
    }
    
    // Summary
    console.log('📋 CONNECTIVITY TEST SUMMARY');
    console.log('=' .repeat(50));
    
    const totalModels = Object.keys(models).length;
    const connectedModels = Object.values(results).filter(r => r.status === 'connected').length;
    const failedModels = totalModels - connectedModels;
    const successRate = Math.round((connectedModels / totalModels) * 100);
    
    console.log(`Total Models: ${totalModels}`);
    console.log(`Connected: ${connectedModels} ✅`);
    console.log(`Failed: ${failedModels} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');
    
    // Detailed results
    for (const [modelName, result] of Object.entries(results)) {
      if (result.status === 'connected') {
        console.log(`✅ ${modelName}: ${result.count} documents, ${result.fieldCount} fields`);
      } else {
        console.log(`❌ ${modelName}: ${result.error}`);
      }
    }
    
    console.log('');
    if (successRate === 100) {
      console.log('🎉 ALL MODELS SUCCESSFULLY CONNECTED TO MONGODB!');
    } else {
      console.log('⚠️  SOME MODELS FAILED TO CONNECT. CHECK THE ERRORS ABOVE.');
    }
    
    // Environment check
    console.log('\n🔧 ENVIRONMENT CHECK');
    console.log('=' .repeat(30));
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`YOUTUBE_API_KEY: ${process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`SECRET_KEY: ${process.env.SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close connection
    try {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing connection:', error.message);
    }
    
    console.log('\n🏁 Test completed');
    process.exit(0);
  }
}

// Run the test
testDatabaseConnectivity();
