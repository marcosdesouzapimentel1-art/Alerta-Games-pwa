import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Coupon } from '../types';
import { mockCoupons } from '../data/mockCoupons';
import { notificationService } from './notificationService';

const LOCAL_COUPONS_KEY = 'alerta_game_coupons_cache';

class CouponsService {
  /**
   * Load coupons from Firestore or fallback to local cache/mock
   */
  public async getCoupons(): Promise<Coupon[]> {
    try {
      const q = query(collection(db, 'coupons'), where('active', '==', true));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const list: Coupon[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            store: d.store || d.storeName || 'Loja',
            storeName: d.store || d.storeName || 'Loja',
            title: d.title || '',
            description: d.description || '',
            code: d.code || '',
            discount: d.discount || `${d.discountPercent || 10}% OFF`,
            discountPercent: d.discountPercent || 10,
            category: d.category || 'Games',
            expirationDate: d.expirationDate || d.validUntil || '2026-12-31',
            validUntil: d.expirationDate || d.validUntil || '2026-12-31',
            affiliateUrl: d.affiliateUrl || d.storeUrl || '',
            image: d.image || d.storeLogoUrl || '',
            active: Boolean(d.active),
            isExpiringToday: Boolean(d.isExpiringToday),
            featured: Boolean(d.featured),
            createdAt: d.createdAt || new Date().toISOString(),
            usesCount: d.usesCount || 100,
            verifiedToday: true,
          };
        });
        this.saveLocalCache(list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore coupons fetch failed, using fallback:', e);
    }

    const cached = this.getLocalCache();
    if (cached && cached.length > 0) return cached;

    // First run seed: seed mockCoupons into Firestore
    this.seedInitialCoupons().catch(() => {});
    return mockCoupons;
  }

  /**
   * Realtime subscription for coupons
   */
  public subscribeCoupons(onUpdate: (coupons: Coupon[]) => void): () => void {
    try {
      const q = query(collection(db, 'coupons'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Coupon[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                store: d.store || d.storeName || 'Loja',
                storeName: d.store || d.storeName || 'Loja',
                title: d.title || '',
                description: d.description || '',
                code: d.code || '',
                discount: d.discount || `${d.discountPercent || 10}% OFF`,
                discountPercent: d.discountPercent || 10,
                category: d.category || 'Games',
                expirationDate: d.expirationDate || d.validUntil || '2026-12-31',
                validUntil: d.expirationDate || d.validUntil || '2026-12-31',
                affiliateUrl: d.affiliateUrl || d.storeUrl || '',
                image: d.image || d.storeLogoUrl || '',
                active: Boolean(d.active),
                isExpiringToday: Boolean(d.isExpiringToday),
                featured: Boolean(d.featured),
                createdAt: d.createdAt || new Date().toISOString(),
                usesCount: d.usesCount || 100,
                verifiedToday: true,
              };
            });
            this.saveLocalCache(list);
            onUpdate(list);
          } else {
            onUpdate(mockCoupons);
          }
        },
        (error) => {
          console.warn('Realtime coupons listener warning:', error);
          onUpdate(mockCoupons);
        }
      );
    } catch (err) {
      onUpdate(mockCoupons);
      return () => {};
    }
  }

  /**
   * Save a new coupon and notify users
   */
  public async addCoupon(coupon: Omit<Coupon, 'id'> & { id?: string }): Promise<Coupon> {
    const id = coupon.id || `cup-${Date.now()}`;
    const newCoupon: Coupon = {
      ...coupon,
      id,
      store: coupon.store || coupon.storeName || 'Loja',
      storeName: coupon.store || coupon.storeName || 'Loja',
      discount: coupon.discount || `${coupon.discountPercent || 10}% OFF`,
      expirationDate: coupon.expirationDate || coupon.validUntil || '2026-12-31',
      validUntil: coupon.expirationDate || coupon.validUntil || '2026-12-31',
      active: true,
      createdAt: new Date().toISOString(),
      usesCount: 1,
    };

    try {
      const docRef = doc(db, 'coupons', id);
      await setDoc(docRef, newCoupon, { merge: true });
    } catch (e) {
      console.warn('Aviso: Cupom salvo em fallback local:', e);
    }

    // Trigger notification
    notificationService.createNotification({
      title: `🎟️ Novo Cupom: ${newCoupon.discount} na ${newCoupon.store}!`,
      message: `${newCoupon.title}. Use o código ${newCoupon.code || 'OFERTA'}`,
      category: 'Cupons e ofertas',
      image: newCoupon.image,
      url: newCoupon.affiliateUrl,
    }).catch(() => {});

    return newCoupon;
  }

  private seedInitialCoupons() {
    return Promise.all(
      mockCoupons.map((c) => {
        const docRef = doc(db, 'coupons', c.id);
        return setDoc(docRef, c, { merge: true });
      })
    );
  }

  private getLocalCache(): Coupon[] | null {
    try {
      const data = localStorage.getItem(LOCAL_COUPONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }

  private saveLocalCache(list: Coupon[]) {
    try {
      localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(list));
    } catch (e) {}
  }
}

export const couponsService = new CouponsService();
