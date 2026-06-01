import * as admin from 'firebase-admin';
import * as fs from 'fs';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    
    // Check if file exists (only needed at runtime, not build time)
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn('⚠️  Firebase service account file not found. Push notifications will not work.');
      return null;
    }
    
    // Read the file content
    const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
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
      console.error('Firebase not initialized');
      return false;
    }

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
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
    console.log(`[PUSH] ✅ Sent to ${fcmToken.substring(0, 10)}... | Title: "${title}" | Msg: "${body.substring(0, 30)}..."`);
    return true;
  } catch (error) {
    console.error(`[PUSH] ❌ Failed to send:`, error.message);
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
      console.error('Firebase not initialized');
      return false;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: fcmTokens,
      android: {
        priority: 'high',
        notification: {
          channelId: 'stormchat_channel',
          sound: 'default',
          priority: 'high',
        },
      },
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
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[PUSH] ✅ Multicast: ${response.successCount} success, ${response.failureCount} failed | Title: "${title}"`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`[PUSH] ❌ Token ${fcmTokens[idx].substring(0, 10)}... error:`, res.error?.message);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`[PUSH] ❌ Multicast critical error:`, error.message);
    return false;
  }
}
