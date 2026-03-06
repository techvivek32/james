// Run this script to add database indexes for better performance
// Usage: node add-indexes.js

const mongoose = require('mongoose');
require('dotenv').config();

async function addIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Add indexes to courses collection
    const coursesCollection = db.collection('courses');
    
    console.log('Adding indexes to courses collection...');
    
    // Index for status (to quickly filter published courses)
    await coursesCollection.createIndex({ status: 1 });
    console.log('✓ Added index on status');
    
    // Index for order (to quickly sort courses)
    await coursesCollection.createIndex({ order: 1 });
    console.log('✓ Added index on order');
    
    // Index for id (for quick lookups)
    await coursesCollection.createIndex({ id: 1 }, { unique: true });
    console.log('✓ Added index on id');
    
    // Compound index for common queries
    await coursesCollection.createIndex({ status: 1, order: 1 });
    console.log('✓ Added compound index on status + order');
    
    // Add indexes to users collection
    const usersCollection = db.collection('users');
    
    console.log('\nAdding indexes to users collection...');
    
    // Index for id (for quick lookups)
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    console.log('✓ Added index on id');
    
    // Index for email (for login)
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✓ Added index on email');
    
    console.log('\n✅ All indexes added successfully!');
    console.log('\nYou can verify indexes with:');
    console.log('  db.courses.getIndexes()');
    console.log('  db.users.getIndexes()');
    
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

addIndexes();
