import { db, messaging } from '../firebase';
import { Logger } from '../utils/logger';

export interface NewsNotification {
  newsId: string;
  title: string;
  summary: string;
  category: string;
  url: string;
  image?: string;
}

export async function sendNewsNotification(item: NewsNotification): Promise<void> {
  try {
    // 1. Save global notification in Firestore
    const notificationDoc = {
      userId: 'global',
      type: 'news',
      title: `⚡ ${item.category}: ${item.title}`,
      message: item.summary,
      link: item.url,
      newsId: item.newsId,
      category: item.category,
      createdAt: new Date().toISOString(),
      read: false
    };

    await db.collection('notifications').add(notificationDoc);

    // 2. Query FCM tokens of users interested in this category
    const tokensSnapshot = await db.collection('fcm_tokens').limit(500).get();
    if (tokensSnapshot.empty) {
      Logger.info('No FCM tokens registered for push notification.');
      return;
    }

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) return;

    // Send multicast push via FCM
    const message = {
      notification: {
        title: `⚡ ${item.category}: ${item.title}`,
        body: item.summary,
        imageUrl: item.image || undefined
      },
      data: {
        newsId: item.newsId,
        category: item.category,
        url: item.url,
        type: 'news'
      },
      tokens
    };

    const response = await messaging.sendEachForMulticast(message);
    Logger.info(`Push notification sent to ${response.successCount}/${tokens.length} devices.`);
  } catch (error: any) {
    Logger.error(`Error sending push notification for news ${item.newsId}: ${error.message}`);
  }
}
