import DBConnection from './db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';
import Language from '../models/Language.js';
import Question from '../models/Question.js';
import Schedule from '../models/Schedule.js';
import Trend from '../models/Trend.js';
import Workflow from '../models/Workflow.js';

/**
 * Initialize database with default data and ensure collections exist
 */
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing database...');
    
    // Connect to database
    await DBConnection();
    
    // Create collections if they don't exist
    await createCollections();
    
    // Create default data if collections are empty
    await createDefaultData();
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log('✅ Database initialization completed successfully');
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create collections if they don't exist
 */
const createCollections = async () => {
  console.log('📚 Creating collections...');
  
  try {
    // Force collection creation by inserting and removing a dummy document
    const collections = [
      { model: User, name: 'users' },
      { model: Department, name: 'departments' },
      { model: Doctor, name: 'doctors' },
      { model: Language, name: 'languages' },
      { model: Question, name: 'questions' },
      { model: Schedule, name: 'schedules' },
      { model: Trend, name: 'trends' },
      { model: Workflow, name: 'workflows' }
    ];
    
    for (const collection of collections) {
      try {
        // Check if collection exists by trying to count documents
        await collection.model.countDocuments();
        console.log(`✅ Collection '${collection.name}' exists`);
      } catch (error) {
        console.log(`📝 Creating collection '${collection.name}'...`);
        // Create collection by inserting a dummy document
        const dummyDoc = new collection.model({});
        await dummyDoc.save();
        await collection.model.findByIdAndDelete(dummyDoc._id);
        console.log(`✅ Collection '${collection.name}' created`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating collections:', error);
    throw error;
  }
};

/**
 * Create default data if collections are empty
 */
const createDefaultData = async () => {
  console.log('📝 Creating default data...');
  
  try {
    // Create default admin user if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('👤 Creating default admin user...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 12);
      
      await User.create({
        username: 'admin',
        email: 'admin@hvc.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Default admin user created');
    }
    
    // Create default departments if none exist
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      console.log('🏥 Creating default departments...');
      const defaultDepartments = [
        { name: 'Cardiology', status: 'Active' },
        { name: 'Neurology', status: 'Active' },
        { name: 'Orthopedics', status: 'Active' },
        { name: 'Pediatrics', status: 'Active' },
        { name: 'General Medicine', status: 'Active' }
      ];
      
      for (const dept of defaultDepartments) {
        await Department.create(dept);
      }
      console.log('✅ Default departments created');
    }
    
    // Create default languages if none exist
    const langCount = await Language.countDocuments();
    if (langCount === 0) {
      console.log('🌍 Creating default languages...');
      const defaultLanguages = [
        { name: 'English', status: 'Active' },
        { name: 'Hindi', status: 'Active' },
        { name: 'Spanish', status: 'Active' },
        { name: 'French', status: 'Active' },
        { name: 'German', status: 'Active' }
      ];
      
      for (const lang of defaultLanguages) {
        await Language.create(lang);
      }
      console.log('✅ Default languages created');
    }
    
    // Create default questions if none exist
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      console.log('❓ Creating default questions...');
      const defaultQuestions = [
        {
          text: 'What are the common symptoms of heart disease?',
          department: 'Cardiology',
          languages: ['English', 'Hindi'],
          status: 'Active'
        },
        {
          text: 'How to maintain a healthy lifestyle?',
          department: 'General Medicine',
          languages: ['English', 'Hindi'],
          status: 'Active'
        }
      ];
      
      for (const question of defaultQuestions) {
        await Question.create(question);
      }
      console.log('✅ Default questions created');
    }
    
    // Create default trends if none exist
    const trendCount = await Trend.countDocuments();
    if (trendCount === 0) {
      console.log('📈 Creating default trends...');
      const defaultTrends = [
        {
          topic: 'Heart Health Awareness',
          views: 1500,
          description: 'Increasing awareness about cardiovascular health',
          status: 'Active'
        },
        {
          topic: 'Mental Health Support',
          views: 1200,
          description: 'Supporting mental health during challenging times',
          status: 'Active'
        }
      ];
      
      for (const trend of defaultTrends) {
        await Trend.create(trend);
      }
      console.log('✅ Default trends created');
    }
    
  } catch (error) {
    console.error('❌ Error creating default data:', error);
    throw error;
  }
};

/**
 * Create database indexes for better performance
 */
const createIndexes = async () => {
  console.log('🔍 Creating database indexes...');
  
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ status: 1 });
    
    // Department indexes
    await Department.collection.createIndex({ name: 1 }, { unique: true });
    await Department.collection.createIndex({ status: 1 });
    
    // Doctor indexes
    await Doctor.collection.createIndex({ name: 1 });
    await Doctor.collection.createIndex({ department: 1 });
    await Doctor.collection.createIndex({ status: 1 });
    await Doctor.collection.createIndex({ 'contact.email': 1 });
    
    // Language indexes
    await Language.collection.createIndex({ name: 1 }, { unique: true });
    await Language.collection.createIndex({ status: 1 });
    
    // Question indexes
    await Question.collection.createIndex({ text: 1 });
    await Question.collection.createIndex({ department: 1 });
    await Question.collection.createIndex({ status: 1 });
    
    // Schedule indexes
    await Schedule.collection.createIndex({ date: 1 });
    await Schedule.collection.createIndex({ doctor: 1 });
    await Schedule.collection.createIndex({ department: 1 });
    await Schedule.collection.createIndex({ status: 1 });
    
    // Trend indexes
    await Trend.collection.createIndex({ topic: 1 });
    await Trend.collection.createIndex({ status: 1 });
    await Trend.collection.createIndex({ createdAt: -1 });
    
    // Workflow indexes
    await Workflow.collection.createIndex({ scheduleId: 1 });
    await Workflow.collection.createIndex({ doctorName: 1 });
    await Workflow.collection.createIndex({ workflowStatus: 1 });
    await Workflow.collection.createIndex({ lastUpdated: -1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

/**
 * Check database health and return status
 */
export const checkDatabaseStatus = async () => {
  try {
    await DBConnection();
    
    const collections = [
      { name: 'users', model: User },
      { name: 'departments', model: Department },
      { name: 'doctors', model: Doctor },
      { name: 'languages', model: Language },
      { name: 'questions', model: Question },
      { name: 'schedules', model: Schedule },
      { name: 'trends', model: Trend },
      { name: 'workflows', model: Workflow }
    ];
    
    const status = {};
    
    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        status[collection.name] = { exists: true, count };
      } catch (error) {
        status[collection.name] = { exists: false, error: error.message };
      }
    }
    
    return {
      connected: true,
      collections: status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default initializeDatabase;
