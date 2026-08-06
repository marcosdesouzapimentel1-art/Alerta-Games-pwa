"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPushNotificationDoc = createPushNotificationDoc;
const firestore_1 = require("firebase-admin/firestore");
async function createPushNotificationDoc(db, params) {
    try {
        const notifRef = db.collection('notifications').doc();
        await notifRef.set({
            id: notifRef.id,
            title: params.title,
            body: params.body,
            image: params.image || '',
            url: params.url,
            category: params.category,
            importance: params.importance,
            source: params.source,
            read: false,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        console.log(`Notificação criada: ${params.title}`);
        return notifRef.id;
    }
    catch (err) {
        console.error('Erro ao registrar notificação push no Firestore:', err.message);
        return null;
    }
}
//# sourceMappingURL=notifier.js.map