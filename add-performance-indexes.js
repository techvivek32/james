const { MongoClient } = require('mongodb');
require('dotenv').config();

async function addPerformanceIndexes() {
  console.log('🔧 Adding performance indexes...');
  
  const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/millerstorm');
  const db = client.db('millerstorm');
  
  try {
    // Add compound index for faster progress queries
    console.log('📊 Creating UserProgress indexes...');
    await db.collection('userprogresses').createIndex(
      { userId: 1, courseId: 1 },
      { unique: true, background: true }
    );
    console.log('✅ UserProgress compound index created');
    
    // Add index for faster course filtering
    console.log('📚 Creating Course indexes...');
    await db.collection('courses').createIndex(
      { status: 1, accessMode: 1 },
      { background: true }
    );
    console.log('✅ Course compound index created');
    
    // Add index for user feature toggles
    console.log('👤 Creating User indexes...');
    await db.collection('users').createIndex(
      { id: 1, 'featureToggles.trainingCenter': 1 },
      { background: true }
    );
    console.log('✅ User feature toggle index created');
    
    // List all indexes
    console.log('\n📋 Current indexes:');
    const progressIndexes = await db.collection('userprogresses').indexes();
    console.log('UserProgress:', progressIndexes.map(i => i.name).join(', '));
    
    const courseIndexes = await db.collection('courses').indexes();
    console.log('Courses:', courseIndexes.map(i => i.name).join(', '));
    
    const userIndexes = await db.collection('users').indexes();
    console.log('Users:', userIndexes.map(i => i.name).join(', '));
    
    console.log('\n✅ All performance indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await client.close();
  }
}

addPerformanceIndexes();
