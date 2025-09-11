// Test script to debug YouTube links issue
// Run this with: node test-youtube-links.js

const { MongoClient } = require('mongodb');

async function testDatabase() {
  const uri = "mongodb+srv://Hvcpotal:12345@cluster0.rw8ipin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = client.db('test'); // or your actual database name
    const trendsCollection = db.collection('trends');
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    // Check trends collection
    if (collections.some(c => c.name === 'trends')) {
      console.log('✅ Trends collection found!');
      
      // Count total trends
      const totalTrends = await trendsCollection.countDocuments();
      console.log(`📊 Total trends: ${totalTrends}`);
      
      if (totalTrends > 0) {
        // Get sample trend
        const sampleTrend = await trendsCollection.findOne();
        console.log('🔍 Sample trend structure:');
        console.log(JSON.stringify(sampleTrend, null, 2));
        
        // Check if youtubeLink field exists
        const hasYoutubeLinkField = sampleTrend.hasOwnProperty('youtubeLink');
        console.log(`🔗 Has youtubeLink field: ${hasYoutubeLinkField}`);
        
        if (hasYoutubeLinkField) {
          // Count trends with YouTube links
          const trendsWithYoutube = await trendsCollection.countDocuments({
            youtubeLink: { $exists: true, $ne: '' }
          });
          console.log(`📹 Trends with YouTube links: ${trendsWithYoutube}`);
          
          // Count trends without YouTube links
          const trendsWithoutYoutube = await trendsCollection.countDocuments({
            $or: [
              { youtubeLink: { $exists: false } },
              { youtubeLink: '' }
            ]
          });
          console.log(`❌ Trends without YouTube links: ${trendsWithoutYoutube}`);
        } else {
          console.log('⚠️  youtubeLink field is missing from trends!');
          console.log('💡 You need to run the database migration.');
        }
      } else {
        console.log('📝 No trends found in database.');
      }
    } else {
      console.log('❌ Trends collection not found!');
    }
    
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testDatabase();
