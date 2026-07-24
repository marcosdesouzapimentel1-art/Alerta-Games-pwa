import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Promotion } from '../types';
import { mockPromotions } from '../data/mockPromotions';
import { notificationService } from './notificationService';

const LOCAL_PROMOTIONS_KEY = 'alerta_game_promotions_cache';

class PromotionsService {
  /**
   * Load promotions from Firestore or local fallback
   */
  public async getPromotions(): Promise<Promotion[]> {
    try {
      const q = query(collection(db, 'deals'), where('active', '==', true));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const list: Promotion[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            productTitle: d.productTitle || d.gameTitle || 'Produto em Promoção',
            category: d.category || 'Jogos',
            store: d.store || 'Loja Gamer',
            oldPrice: d.oldPrice || d.originalPrice || 100,
            currentPrice: d.currentPrice || d.discountPrice || 50,
            discountPercent:
              d.discountPercent ||
              Math.round(
                (((d.oldPrice || d.originalPrice || 100) - (d.currentPrice || d.discountPrice || 50)) /
                  (d.oldPrice || d.originalPrice || 100)) *
                  100
              ),
            image: d.image || d.imageUrl || '',
            link: d.link || d.dealUrl || '',
            affiliateUrl: d.affiliateUrl || d.link || d.dealUrl || '',
            expirationDate: d.expirationDate || d.expiresAt || '2026-12-31',
            active: d.active !== false,
            createdAt: d.createdAt || new Date().toISOString(),
            featured: Boolean(d.featured),
            code: d.code || d.couponCode || '',
          };
        });
        this.saveLocalCache(list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore deals fetch warning:', e);
    }

    const cached = this.getLocalCache();
    if (cached && cached.length > 0) return cached;

    // Seed mockPromotions
    this.seedInitialPromotions().catch(() => {});
    return mockPromotions;
  }

  /**
   * Subscribe to realtime promotions
   */
  public subscribePromotions(onUpdate: (promos: Promotion[]) => void): () => void {
    try {
      const q = query(collection(db, 'deals'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Promotion[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                productTitle: d.productTitle || d.gameTitle || 'Produto em Promoção',
                category: d.category || 'Jogos',
                store: d.store || 'Loja Gamer',
                oldPrice: d.oldPrice || d.originalPrice || 100,
                currentPrice: d.currentPrice || d.discountPrice || 50,
                discountPercent:
                  d.discountPercent ||
                  Math.round(
                    (((d.oldPrice || d.originalPrice || 100) - (d.currentPrice || d.discountPrice || 50)) /
                      (d.oldPrice || d.originalPrice || 100)) *
                      100
                  ),
                image: d.image || d.imageUrl || '',
                link: d.link || d.dealUrl || '',
                affiliateUrl: d.affiliateUrl || d.link || d.dealUrl || '',
                expirationDate: d.expirationDate || d.expiresAt || '2026-12-31',
                active: d.active !== false,
                createdAt: d.createdAt || new Date().toISOString(),
                featured: Boolean(d.featured),
                code: d.code || d.couponCode || '',
              };
            });
            this.saveLocalCache(list);
            onUpdate(list);
          } else {
            onUpdate(mockPromotions);
          }
        },
        (error) => {
          console.warn('Promotions snapshot error:', error);
          onUpdate(mockPromotions);
        }
      );
    } catch (e) {
      onUpdate(mockPromotions);
      return () => {};
    }
  }

  /**
   * Add a new promotion and trigger notification if discount >= 30%
   */
  public async addPromotion(promo: Omit<Promotion, 'id'> & { id?: string }): Promise<Promotion> {
    const id = promo.id || `promo-${Date.now()}`;
    const newPromo: Promotion = {
      ...promo,
      id,
      active: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'deals', id);
      await setDoc(docRef, newPromo, { merge: true });
    } catch (e) {
      console.warn('Aviso: Promoção salva em cache local:', e);
    }

    if (newPromo.discountPercent >= 30) {
      notificationService.createNotification({
        title: `🔥 Super Oferta: ${newPromo.discountPercent}% OFF em ${newPromo.productTitle}!`,
        message: `De R$ ${newPromo.oldPrice.toFixed(2)} por apenas R$ ${newPromo.currentPrice.toFixed(2)} na ${newPromo.store}!`,
        category: 'Cupons e ofertas',
        image: newPromo.image,
        url: newPromo.affiliateUrl || newPromo.link,
      }).catch(() => {});
    }

    return newPromo;
  }

  private seedInitialPromotions() {
    return Promise.all(
      mockPromotions.map((p) => {
        const docRef = doc(db, 'deals', p.id);
        return setDoc(docRef, p, { merge: true });
      })
    );
  }

  private getLocalCache(): Promotion[] | null {
    try {
      const data = localStorage.getItem(LOCAL_PROMOTIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }

  private saveLocalCache(list: Promotion[]) {
    try {
      localStorage.setItem(LOCAL_PROMOTIONS_KEY, JSON.stringify(list));
    } catch (e) {}
  }
}

export const promotionsService = new PromotionsService();
