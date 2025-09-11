// Test script to populate sample video and short data
// Run this with: node test-media.js

const mongoose = require('mongoose');

// Sample data for videos
const sampleVideos = [
  {
    title: "Introduction to Cardiology",
    doctorName: "Dr. Smith",
    departmentName: "Cardiology",
    status: "completed",
    completedAt: new Date(),
    duration: 45,
    description: "Basic introduction to cardiology concepts",
    tags: ["cardiology", "basics", "introduction"]
  },
  {
    title: "Advanced Heart Surgery Techniques",
    doctorName: "Dr. Johnson",
    departmentName: "Cardiology",
    status: "completed",
    completedAt: new Date(),
    duration: 60,
    description: "Advanced surgical procedures in cardiology",
    tags: ["cardiology", "surgery", "advanced"]
  },
  {
    title: "Pediatric Care Fundamentals",
    doctorName: "Dr. Williams",
    departmentName: "Pediatrics",
    status: "completed",
    completedAt: new Date(),
    duration: 30,
    description: "Basic pediatric care principles",
    tags: ["pediatrics", "basics", "care"]
  },
  {
    title: "Emergency Medicine Protocols",
    doctorName: "Dr. Brown",
    departmentName: "Emergency Medicine",
    status: "in_progress",
    duration: 0,
    description: "Emergency medical procedures and protocols",
    tags: ["emergency", "protocols", "medicine"]
  },
  {
    title: "Neurology Case Studies",
    doctorName: "Dr. Davis",
    departmentName: "Neurology",
    status: "pending",
    duration: 0,
    description: "Interesting neurology case studies",
    tags: ["neurology", "case studies", "examples"]
  }
];

// Sample data for shorts
const sampleShorts = [
  {
    title: "Quick Heart Health Tips",
    doctorName: "Dr. Smith",
    departmentName: "Cardiology",
    status: "completed",
    completedAt: new Date(),
    duration: 30,
    description: "Quick tips for maintaining heart health",
    tags: ["cardiology", "tips", "health"]
  },
  {
    title: "Child Safety Guidelines",
    doctorName: "Dr. Williams",
    departmentName: "Pediatrics",
    status: "completed",
    completedAt: new Date(),
    duration: 45,
    description: "Important safety guidelines for children",
    tags: ["pediatrics", "safety", "children"]
  },
  {
    title: "First Aid Basics",
    doctorName: "Dr. Brown",
    departmentName: "Emergency Medicine",
    status: "completed",
    completedAt: new Date(),
    duration: 60,
    description: "Basic first aid procedures",
    tags: ["emergency", "first aid", "basics"]
  },
  {
    title: "Brain Health Tips",
    doctorName: "Dr. Davis",
    departmentName: "Neurology",
    status: "completed",
    completedAt: new Date(),
    duration: 40,
    description: "Tips for maintaining brain health",
    tags: ["neurology", "brain", "health"]
  },
  {
    title: "Diabetes Management",
    doctorName: "Dr. Wilson",
    departmentName: "Endocrinology",
    status: "completed",
    completedAt: new Date(),
    duration: 35,
    description: "Managing diabetes effectively",
    tags: ["endocrinology", "diabetes", "management"]
  },
  {
    title: "Mental Health Awareness",
    doctorName: "Dr. Garcia",
    departmentName: "Psychiatry",
    status: "in_progress",
    duration: 0,
    description: "Understanding mental health",
    tags: ["psychiatry", "mental health", "awareness"]
  }
];

async function populateSampleData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcv_portal';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Import models
    const Video = require('./src/app/utils/models/Video.js').default;
    const Short = require('./src/app/utils/models/Short.js').default;

    // Clear existing data
    await Video.deleteMany({});
    await Short.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample videos
    const videos = await Video.insertMany(sampleVideos);
    console.log(`Inserted ${videos.length} videos`);

    // Insert sample shorts
    const shorts = await Short.insertMany(sampleShorts);
    console.log(`Inserted ${shorts.length} shorts`);

    // Get counts
    const completedVideos = await Video.countDocuments({ status: 'completed' });
    const completedShorts = await Short.countDocuments({ status: 'completed' });
    const totalVideos = await Video.countDocuments();
    const totalShorts = await Short.countDocuments();

    console.log('\n=== Sample Data Summary ===');
    console.log(`Total Videos: ${totalVideos}`);
    console.log(`Completed Videos: ${completedVideos}`);
    console.log(`Total Shorts: ${totalShorts}`);
    console.log(`Completed Shorts: ${completedShorts}`);

    console.log('\n✅ Sample data populated successfully!');
    console.log('You can now test the dashboard with these counts.');

  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
populateSampleData();
