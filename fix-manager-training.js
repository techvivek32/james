const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

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
