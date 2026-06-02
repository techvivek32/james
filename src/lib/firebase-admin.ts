import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    const absolutePath = path.resolve(serviceAccountPath);
    
    // Check if file exists (only needed at runtime, not build time)
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️  Firebase service account file not found at ${absolutePath}. Push notifications will not work.`);
      return null;
    }
    
    console.log(`[PUSH-DEBUG] Initializing Firebase Admin with: ${absolutePath}`);
    
    // Read the file content
    const serviceAccountContent = fs.readFileSync(absolutePath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountContent);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    return null;
  }
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: { [key: string]: string }
) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    if (!firebaseApp) {
      console.error('[PUSH-DEBUG] Firebase not initialized');
      return false;
    }

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: {
        ...(data || {}),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          channelId: 'stormchat_channel',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
            'mutable-content': 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[PUSH-DEBUG] ✅ Sent to ${fcmToken.substring(0, 15)}... | Title: "${title}"`);
    return true;
  } catch (error: any) {
    console.error(`[PUSH-DEBUG] ❌ Failed to send:`, error.message);
    return false;
  }
}

export async function sendPushNotificationToMultiple(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: { [key: string]: string }
) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    if (!firebaseApp) {
      console.error('[PUSH-DEBUG] Firebase not initialized');
      return false;
    }

    console.log(`[PUSH-DEBUG] 📡 Attempting multicast to ${fcmTokens.length} tokens`);
    
    // Use individual sends in a loop to match test-push.js which is working
    const results = await Promise.all(fcmTokens.map(token => 
      sendPushNotification(token, title, body, data)
    ));

    const successCount = results.filter(r => r === true).length;
    const failureCount = results.length - successCount;

    console.log(`[PUSH-DEBUG] ✅ Batch result: ${successCount} success, ${failureCount} failed | Title: "${title}"`);
    
    return true;
  } catch (error: any) {
    console.error(`[PUSH-DEBUG] ❌ Multicast critical error:`, error.message);
    return false;
  }
}
