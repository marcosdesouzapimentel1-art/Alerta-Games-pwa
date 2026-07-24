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
import { FreeGame } from '../types';
import { mockFreeGames } from '../data/mockFreeGames';
import { notificationService } from './notificationService';

const LOCAL_FREE_GAMES_KEY = 'alerta_game_free_games_cache';

class FreeGamesService {
  /**
   * Get free games list from Firestore or fallback
   */
  public async getFreeGames(): Promise<FreeGame[]> {
    try {
      const q = query(collection(db, 'free_games'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const list: FreeGame[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            image: d.image || '',
            platform: d.platform || 'PC',
            store: d.store || 'Epic Games Store',
            startDate: d.startDate || '2026-07-22',
            endDate: d.endDate || '2026-07-29',
            url: d.url || 'https://store.epicgames.com',
            affiliateUrl: d.affiliateUrl || d.url || '',
            status: (d.status as 'Disponível' | 'Encerrado') || 'Disponível',
            originalPrice: d.originalPrice || 99.90,
            active: d.active !== false,
            createdAt: d.createdAt || new Date().toISOString(),
          };
        });
        this.saveLocalCache(list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore free games fetch error:', e);
    }

    const cached = this.getLocalCache();
    if (cached && cached.length > 0) return cached;

    // Seed initial mock
    this.seedInitialFreeGames().catch(() => {});
    return mockFreeGames;
  }

  /**
   * Realtime listener for Free Games
   */
  public subscribeFreeGames(onUpdate: (games: FreeGame[]) => void): () => void {
    try {
      const q = query(collection(db, 'free_games'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: FreeGame[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                title: d.title || '',
                description: d.description || '',
                image: d.image || '',
                platform: d.platform || 'PC',
                store: d.store || 'Epic Games Store',
                startDate: d.startDate || '2026-07-22',
                endDate: d.endDate || '2026-07-29',
                url: d.url || 'https://store.epicgames.com',
                affiliateUrl: d.affiliateUrl || d.url || '',
                status: (d.status as 'Disponível' | 'Encerrado') || 'Disponível',
                originalPrice: d.originalPrice || 99.90,
                active: d.active !== false,
                createdAt: d.createdAt || new Date().toISOString(),
              };
            });
            this.saveLocalCache(list);
            onUpdate(list);
          } else {
            onUpdate(mockFreeGames);
          }
        },
        (error) => {
          console.warn('Free games snapshot error:', error);
          onUpdate(mockFreeGames);
        }
      );
    } catch (e) {
      onUpdate(mockFreeGames);
      return () => {};
    }
  }

  /**
   * Sync with live Epic Games Store Free Games API
   */
  public async syncEpicGamesStore(): Promise<void> {
    try {
      // Epic Games free games catalog public API endpoint
      const epicApiUrl =
        'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR';

      const res = await fetch(epicApiUrl);
      if (!res.ok) return;

      const data = await res.json();
      const elements = data?.data?.Catalog?.searchStore?.elements || [];

      for (const item of elements) {
        const promotions = item.promotions;
        const offers =
          promotions?.promotionalOffers?.[0]?.promotionalOffers ||
          promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers;

        if (!offers || offers.length === 0) continue;

        const isFree = item.price?.totalPrice?.discountPrice === 0;
        if (!isFree) continue;

        const startDate = offers[0].startDate ? offers[0].startDate.split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = offers[0].endDate ? offers[0].endDate.split('T')[0] : '2026-12-31';

        const imageObj =
          item.keyImages?.find((img: any) => img.type === 'OfferImageWide') ||
          item.keyImages?.find((img: any) => img.type === 'Thumbnail') ||
          item.keyImages?.[0];

        const gameId = `epic-${item.id || item.productSlug || item.title.replace(/\s+/g, '-').toLowerCase()}`;
        const gameUrl = `https://store.epicgames.com/pt-BR/p/${item.productSlug || item.urlSlug || ''}`;

        const freeGame: FreeGame = {
          id: gameId,
          title: item.title,
          description: item.description || 'Jogo gratuito disponível na Epic Games Store!',
          image: imageObj?.url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          platform: 'PC',
          store: 'Epic Games Store',
          startDate,
          endDate,
          url: gameUrl,
          affiliateUrl: `${gameUrl}?aff=ALERTAGAME`,
          status: 'Disponível',
          originalPrice: (item.price?.totalPrice?.originalPrice || 14990) / 100,
          active: true,
          createdAt: new Date().toISOString(),
        };

        // Save to Firestore and notify if new
        const docRef = doc(db, 'free_games', gameId);
        await setDoc(docRef, freeGame, { merge: true });

        // Trigger alert for new Epic Free Game
        notificationService.createNotification({
          title: `🎮 Jogo Grátis na Epic Games: ${freeGame.title}!`,
          message: `${freeGame.description}. Resgate sem pagar nada até ${freeGame.endDate}!`,
          category: 'Jogos grátis Epic Games',
          image: freeGame.image,
          url: freeGame.affiliateUrl,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Epic Games Store sync error:', err);
    }
  }

  /**
   * Manually add or update a free game
   */
  public async addFreeGame(game: Omit<FreeGame, 'id'> & { id?: string }): Promise<FreeGame> {
    const id = game.id || `fg-${Date.now()}`;
    const newGame: FreeGame = {
      ...game,
      id,
      active: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'free_games', id);
      await setDoc(docRef, newGame, { merge: true });
    } catch (e) {
      console.warn('Aviso: Jogo grátis salvo em fallback local:', e);
    }

    // Trigger Notification
    notificationService.createNotification({
      title: `🎁 Jogo Grátis Liberto: ${newGame.title}!`,
      message: `Disponível na ${newGame.store} para ${newGame.platform}. Resgate até ${newGame.endDate}!`,
      category: 'Jogos grátis Epic Games',
      image: newGame.image,
      url: newGame.affiliateUrl || newGame.url,
    }).catch(() => {});

    return newGame;
  }

  private seedInitialFreeGames() {
    return Promise.all(
      mockFreeGames.map((g) => {
        const docRef = doc(db, 'free_games', g.id);
        return setDoc(docRef, g, { merge: true });
      })
    );
  }

  private getLocalCache(): FreeGame[] | null {
    try {
      const data = localStorage.getItem(LOCAL_FREE_GAMES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }

  private saveLocalCache(list: FreeGame[]) {
    try {
      localStorage.setItem(LOCAL_FREE_GAMES_KEY, JSON.stringify(list));
    } catch (e) {}
  }
}

export const freeGamesService = new FreeGamesService();
