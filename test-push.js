const admin = require('firebase-admin');
const fs = require('fs');
const mongoose = require('mongoose');

// 1. CONFIGURATION
const SERVICE_ACCOUNT_PATH = './firebase-service-account.json';

// Try to get MongoDB URI from .env file or environment variable
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  try {
    const envContent = fs.readFileSync('./.env', 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match) {
      MONGODB_URI = match[1].trim().replace(/["']/g, '');
    }
  } catch (e) {
    // If .env fails, use default
    MONGODB_URI = 'mongodb://localhost:27017/millerstorm';
  }
}

async function testPush() {
  try {
    console.log('🚀 Starting Push Notification Test...');

    // 2. CHECK SERVICE ACCOUNT
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error('❌ Error: firebase-service-account.json not found in current directory.');
      console.log('Please make sure you have the Firebase Service Account JSON file in this folder.');
      return;
    }
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

    // 3. INITIALIZE FIREBASE ADMIN
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin Initialized');
    }

    // 4. CONNECT TO MONGODB TO GET A TOKEN
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get a user with a token (latest one updated)
    const user = await usersCollection.findOne(
      { fcmToken: { $exists: true, $ne: '', $ne: null } },
      { sort: { updatedAt: -1 } }
    );

    if (!user) {
      console.error('❌ Error: No user found in database with an FCM token.');
      console.log('Please log in to the app on a physical device first so the token gets saved.');
      return;
    }

    console.log(`📱 Found Token for User: ${user.name} (${user.email})`);
    console.log(`Token: ${user.fcmToken.substring(0, 25)}...`);

    // 5. SEND TEST MESSAGE WITH ENHANCED IOS PAYLOAD
    const message = {
      notification: {
        title: '🔥 Test Notification',
        body: 'If you see this, push notifications are WORKING!',
      },
      data: {
        type: 'test',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: user.fcmToken,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
            'mutable-content': 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'stormchat_channel',
        }
      }
    };

    console.log('📡 Sending to Firebase...');
    const response = await admin.messaging().send(message);
    console.log('✅ SUCCESS! Firebase Response:', response);
    console.log('\n--- CHECK YOUR DEVICE NOW ---');
    console.log('If you still don\'t see it on your iPhone:');
    console.log('1. Check Settings > Miller Storm > Notifications (Must be ON)');
    console.log('2. Ensure you are using a PHYSICAL iPhone (not simulator)');
    console.log('3. Verify aps-environment in Runner.entitlements matches your build (development vs production)');

  } catch (error) {
    console.error('❌ FAILED to send notification:');
    console.error(error);
    
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('\n💡 TIP: The token in the database is no longer valid. Log out and log back in on the app.');
    }
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testPush();
