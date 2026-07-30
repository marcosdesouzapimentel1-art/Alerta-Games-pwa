"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewsNotification = sendNewsNotification;
const firebase_1 = require("../firebase");
const logger_1 = require("../utils/logger");
async function sendNewsNotification(item) {
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
        await firebase_1.db.collection('notifications').add(notificationDoc);
        // 2. Query FCM tokens of users interested in this category
        const tokensSnapshot = await firebase_1.db.collection('fcm_tokens').limit(500).get();
        if (tokensSnapshot.empty) {
            logger_1.Logger.info('No FCM tokens registered for push notification.');
            return;
        }
        const tokens = [];
        tokensSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.token) {
                tokens.push(data.token);
            }
        });
        if (tokens.length === 0)
            return;
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
        const response = await firebase_1.messaging.sendEachForMulticast(message);
        logger_1.Logger.info(`Push notification sent to ${response.successCount}/${tokens.length} devices.`);
    }
    catch (error) {
        logger_1.Logger.error(`Error sending push notification for news ${item.newsId}: ${error.message}`);
    }
}
//# sourceMappingURL=notificationService.js.map