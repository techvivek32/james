const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env file manually
let uri = "mongodb://dsatguru:vivekVOra32+@69.62.66.123:27017/millerstorm?authSource=admin";
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match) {
      uri = match[1].trim().replace(/['"]/g, '');
    }
  }
} catch (err) {
  console.log('Using default MongoDB URI');
}

console.log('Using MongoDB URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

async function fixManagerTraining() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log('Connected to database');
    
    // Check courses
    const courses = await mongoose.connection.db.collection('courses').find({}).toArray();
    console.log(`\n=== COURSES (${courses.length}) ===`);
    courses.forEach(c => {
      console.log(`- ${c.title} (${c.id}) - Status: ${c.status}, Access: ${c.accessMode || 'open'}`);
    });
    
    // Check manager users
    const managers = await mongoose.connection.db.collection('users').find({ role: 'manager' }).toArray();
    console.log(`\n=== MANAGERS (${managers.length}) ===`);
    
    for (const manager of managers) {
      console.log(`\nManager: ${manager.name} (${manager.email})`);
      console.log(`  Training Center: ${manager.featureToggles?.trainingCenter ? 'ENABLED' : 'DISABLED'}`);
      
      // Enable training center if not enabled
      if (!manager.featureToggles?.trainingCenter) {
        console.log(`  -> Enabling training center...`);
        await mongoose.connection.db.collection('users').updateOne(
          { _id: manager._id },
          { 
            $set: { 
              'featureToggles.trainingCenter': true 
            } 
          }
        );
        console.log(`  -> ✓ Training center enabled`);
      }
    }
    
    console.log('\n=== DONE ===');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixManagerTraining();
