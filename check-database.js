const { MongoClient } = require('mongodb');

async function checkDatabase() {
  console.log('🔍 Checking Database Contents\n');
  
  try {
    // Connect to MongoDB
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('james'); // Replace with your database name
    
    // Check business plans collection
    console.log('📋 Business Plans Collection:');
    const businessPlans = await db.collection('businessPlans').find({}).toArray();
    console.log(`   Found ${businessPlans.length} business plans\n`);
    
    businessPlans.forEach((plan, index) => {
      console.log(`   Plan ${index + 1}:`);
      console.log(`      userId: ${plan.userId}`);
      console.log(`      committed: ${plan.businessPlan?.committed || 'N/A'}`);
      console.log(`      revenueGoal: ${plan.businessPlan?.revenueGoal || 'N/A'}`);
      console.log(`      updatedAt: ${plan.updatedAt}\n`);
    });
    
    // Check users collection
    console.log('👥 Users Collection:');
    const users = await db.collection('users').find({}).toArray();
    console.log(`   Found ${users.length} users in database\n`);
    
    const salesUsers = users.filter(u => u.role === 'sales');
    salesUsers.forEach(user => {
      console.log(`   Sales User: ${user.name} (ID: ${user.id || user._id})`);
    });
    
    await client.close();
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\n💡 Make sure MongoDB is running and the database name is correct');
  }
}

checkDatabase();