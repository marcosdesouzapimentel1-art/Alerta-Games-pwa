import * as admin from 'firebase-admin';

export interface CreateNotificationParams {
  title: string;
  body: string;
  image?: string;
  url: string;
  category: string;
  importance: number;
  source: string;
}

export async function createPushNotificationDoc(
  db: admin.firestore.Firestore,
  params: CreateNotificationParams
): Promise<string | null> {
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
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Notificação criada: ${params.title}`);
    return notifRef.id;
  } catch (err: any) {
    console.error('Erro ao registrar notificação push no Firestore:', err.message);
    return null;
  }
}
