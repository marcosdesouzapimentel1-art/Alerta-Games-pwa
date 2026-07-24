import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitConstraint,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertCategory, AppNotification, NotificationPreferences } from '../types';
import { getFcmToken, saveFcmTokenToFirestore, requestNotificationPermission } from './messaging';

export const ALERT_CATEGORIES: AlertCategory[] = [
  'Notícias importantes',
  'Lançamentos de jogos',
  'GTA 6',
  'Fortnite',
  'Call of Duty',
  'Promoções Steam',
  'Jogos grátis Epic Games',
  'Game Pass',
  'PS Plus',
  'Cupons e ofertas',
];

export const DEFAULT_NOTIFICATION_PREFERENCES: Record<AlertCategory, boolean> = {
  'Notícias importantes': true,
  'Lançamentos de jogos': true,
  'GTA 6': true,
  'Fortnite': true,
  'Call of Duty': true,
  'Promoções Steam': true,
  'Jogos grátis Epic Games': true,
  'Game Pass': true,
  'PS Plus': true,
  'Cupons e ofertas': true,
};

const USER_PREFS_KEY = 'alerta_game_notification_prefs';
const ANONYMOUS_USER_ID = 'user-guest-default';

class NotificationService {
  private currentUserId: string = ANONYMOUS_USER_ID;

  public setUserId(uid: string) {
    this.currentUserId = uid || ANONYMOUS_USER_ID;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  /**
   * Request browser push permission and save FCM token to Firestore
   */
  public async setupFcmNotifications(userId: string = this.currentUserId): Promise<{
    permission: NotificationPermission;
    token: string | null;
  }> {
    const permission = await requestNotificationPermission();

    if (permission === 'granted') {
      const token = await getFcmToken();
      if (token) {
        await saveFcmTokenToFirestore(userId, token);
      }
      return { permission, token };
    }

    return { permission, token: null };
  }

  /**
   * Cleans up expired/stale FCM tokens from Firestore
   */
  public async cleanupExpiredTokens(userId: string = this.currentUserId): Promise<void> {
    try {
      const q = query(collection(db, 'fcm_tokens'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updatedAt = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
        if (now - updatedAt > THIRTY_DAYS_MS) {
          await deleteDoc(docSnap.ref);
        }
      }
    } catch (error) {
      console.warn('Erro ao limpar tokens expirados FCM:', error);
    }
  }

  /**
   * Load user alert preferences from Firestore or localStorage fallback
   */
  public async loadPreferences(userId: string = this.currentUserId): Promise<NotificationPreferences> {
    try {
      const docRef = doc(db, 'notification_preferences', userId);
      const docSnap = await getDocs(query(collection(db, 'notification_preferences'), where('userId', '==', userId)));

      if (!docSnap.empty) {
        const data = docSnap.docs[0].data() as NotificationPreferences;
        return data;
      }
    } catch (err) {
      // Offline or network error -> use local storage
    }

    try {
      const local = localStorage.getItem(USER_PREFS_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      // ignore
    }

    return {
      userId,
      fcmEnabled: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
      categories: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Save user alert category preferences to Firestore and localStorage
   */
  public async savePreferences(
    prefs: NotificationPreferences,
    userId: string = this.currentUserId
  ): Promise<void> {
    const updated: NotificationPreferences = {
      ...prefs,
      userId,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(updated));

    try {
      const docRef = doc(db, 'notification_preferences', userId);
      await setDoc(docRef, updated, { merge: true });
    } catch (error) {
      console.warn('Erro ao salvar preferências no Firestore (offline):', error);
    }
  }

  /**
   * Subscribe to real-time notification collection changes
   */
  public subscribeNotifications(
    userId: string = this.currentUserId,
    onUpdate: (notifications: AppNotification[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [userId, 'all', ANONYMOUS_USER_ID]),
        orderBy('createdAt', 'desc'),
        limitConstraint(30)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AppNotification[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId || userId,
              title: data.title || '',
              message: data.message || '',
              image: data.image || '',
              category: data.category || 'Notícias importantes',
              createdAt: data.createdAt || new Date().toISOString(),
              read: Boolean(data.read),
              url: data.url || '',
            };
          });
          onUpdate(list);
        },
        (error) => {
          console.warn('Realtime notifications listener error:', error);
          // Fallback to offline local notifications if any
          this.getLocalNotifications().then(onUpdate);
        }
      );

      return unsubscribe;
    } catch (error) {
      this.getLocalNotifications().then(onUpdate);
      return () => {};
    }
  }

  /**
   * Get offline local notifications fallback from localStorage
   */
  private async getLocalNotifications(): Promise<AppNotification[]> {
    try {
      const local = localStorage.getItem('alerta_game_local_notifications');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return [];
  }

  /**
   * Save local fallback notifications
   */
  private saveLocalNotifications(list: AppNotification[]) {
    try {
      localStorage.setItem('alerta_game_local_notifications', JSON.stringify(list.slice(0, 30)));
    } catch (e) {}
  }

  /**
   * Create and send a new notification to Firestore and trigger native browser notification if allowed
   */
  public async createNotification(
    params: {
      title: string;
      message: string;
      category: AlertCategory | string;
      image?: string;
      url?: string;
      userId?: string;
    }
  ): Promise<AppNotification> {
    const targetUserId = params.userId || this.currentUserId;
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newNotif: AppNotification = {
      id: notificationId,
      userId: targetUserId,
      title: params.title,
      message: params.message,
      category: params.category,
      image: params.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      createdAt: new Date().toISOString(),
      read: false,
      url: params.url || '',
    };

    // Save in Firestore
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await setDoc(docRef, newNotif, { merge: true });
    } catch (error) {
      console.warn('Aviso: Notificação salva em fallback local (offline).');
      const locals = await this.getLocalNotifications();
      this.saveLocalNotifications([newNotif, ...locals]);
    }

    // Trigger browser native Notification API if allowed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifOptions: any = {
          body: params.message,
          icon: '/icon-192.png',
          image: params.image,
          tag: params.category,
        };
        new Notification(params.title, notifOptions);
      } catch (e) {
        console.warn('Native browser notification trigger failed:', e);
      }
    }

    return newNotif;
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      // Local fallback
      const locals = await this.getLocalNotifications();
      const updated = locals.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      this.saveLocalNotifications(updated);
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  public async markAllAsRead(userId: string = this.currentUserId): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [userId, 'all', ANONYMOUS_USER_ID]),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        await updateDoc(docSnap.ref, { read: true });
      }
    } catch (err) {
      const locals = await this.getLocalNotifications();
      const updated = locals.map((n) => ({ ...n, read: true }));
      this.saveLocalNotifications(updated);
    }
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (err) {
      const locals = await this.getLocalNotifications();
      const updated = locals.filter((n) => n.id !== notificationId);
      this.saveLocalNotifications(updated);
    }
  }

  /**
   * Delete old notifications (> 14 days)
   */
  public async clearOldNotifications(userId: string = this.currentUserId): Promise<number> {
    let deletedCount = 0;
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [userId, 'all', ANONYMOUS_USER_ID])
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const created = new Date(data.createdAt || 0).getTime();
        if (now - created > FOURTEEN_DAYS_MS) {
          await deleteDoc(docSnap.ref);
          deletedCount++;
        }
      }
    } catch (err) {
      const locals = await this.getLocalNotifications();
      const filtered = locals.filter((n) => now - new Date(n.createdAt).getTime() <= FOURTEEN_DAYS_MS);
      deletedCount = locals.length - filtered.length;
      this.saveLocalNotifications(filtered);
    }

    return deletedCount;
  }

  /**
   * Automatic Notification Generator for News, Deals, Free Games, Releases
   */
  public async triggerAutomaticAlertsForNews(article: {
    title: string;
    summary: string;
    category: string;
    image?: string;
    url?: string;
  }): Promise<void> {
    const titleLower = article.title.toLowerCase();

    let alertCat: AlertCategory = 'Notícias importantes';

    if (titleLower.includes('gta 6') || titleLower.includes('grand theft auto')) {
      alertCat = 'GTA 6';
    } else if (titleLower.includes('fortnite')) {
      alertCat = 'Fortnite';
    } else if (titleLower.includes('call of duty') || titleLower.includes('black ops')) {
      alertCat = 'Call of Duty';
    } else if (titleLower.includes('game pass')) {
      alertCat = 'Game Pass';
    } else if (titleLower.includes('ps plus') || titleLower.includes('playstation plus')) {
      alertCat = 'PS Plus';
    } else if (titleLower.includes('grátis') || titleLower.includes('epic games')) {
      alertCat = 'Jogos grátis Epic Games';
    } else if (titleLower.includes('steam') || titleLower.includes('promoção')) {
      alertCat = 'Promoções Steam';
    }

    const prefs = await this.loadPreferences();
    if (prefs.categories[alertCat] !== false) {
      await this.createNotification({
        title: `⚡ [${alertCat}] ${article.title.slice(0, 60)}...`,
        message: article.summary.slice(0, 120),
        category: alertCat,
        image: article.image,
        url: article.url,
      });
    }
  }

  public async triggerAutomaticAlertForDeal(deal: {
    gameTitle: string;
    discountPercent: number;
    store: string;
    imageUrl?: string;
    dealUrl?: string;
  }): Promise<void> {
    let category: AlertCategory = 'Cupons e ofertas';
    if (deal.store.toLowerCase().includes('epic') || deal.discountPercent === 100) {
      category = 'Jogos grátis Epic Games';
    } else if (deal.store.toLowerCase().includes('steam')) {
      category = 'Promoções Steam';
    }

    const prefs = await this.loadPreferences();
    if (prefs.categories[category] !== false) {
      await this.createNotification({
        title: `🔥 ${deal.discountPercent}% OFF: ${deal.gameTitle}`,
        message: `Super desconto detectado na loja ${deal.store}! Aproveite antes que expire.`,
        category,
        image: deal.imageUrl,
        url: deal.dealUrl,
      });
    }
  }

  public async triggerAutomaticAlertForRelease(release: {
    title: string;
    releaseDate: string;
    imageUrl?: string;
  }): Promise<void> {
    const prefs = await this.loadPreferences();
    if (prefs.categories['Lançamentos de jogos'] !== false) {
      await this.createNotification({
        title: `🎮 Lançamento Próximo: ${release.title}`,
        message: `O aguardado jogo ${release.title} chega oficialmente em ${release.releaseDate}!`,
        category: 'Lançamentos de jogos',
        image: release.imageUrl,
      });
    }
  }
}

export const notificationService = new NotificationService();
