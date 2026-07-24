import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getMessagingInstance } from '../lib/firebase';
import { setDocument } from './firestore';

// Default VAPID Key from environment variable if provided
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission from browser
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this environment.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Get Firebase Cloud Messaging registration token for push notifications
 */
export const getFcmToken = async (vapidKey: string = VAPID_KEY): Promise<string | null> => {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.info('Notification permission was not granted.');
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('Firebase Messaging is not available.');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      console.log('FCM Registration Token received:', token);
      return token;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('Error acquiring FCM token:', error);
    return null;
  }
};

/**
 * Register foreground message handler when the app is active
 */
export const onForegroundMessage = async (
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground Push Notification Received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
};

/**
 * Save FCM token to Firestore so backend or Cloud Functions can send targeted notifications
 */
export const saveFcmTokenToFirestore = async (
  userId: string,
  token: string
): Promise<void> => {
  if (!token) return;
  try {
    await setDocument('fcm_tokens', token, {
      userId,
      token,
      platform: typeof window !== 'undefined' ? window.navigator.userAgent : 'web',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
  }
};
