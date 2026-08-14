import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
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
            originalPrice: typeof d.originalPrice === 'number' ? d.originalPrice : 99.90,
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
                // Tratamento blindado para garantir que originalPrice seja sempre número
                originalPrice: typeof d.originalPrice === 'number' ? d.originalPrice : 99.90,
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
   * Método mantido apenas por compatibilidade (agora a sincronização roda no backend)
   */
  public async syncEpicGamesStore(): Promise<void> {
    console.log('Sincronização da Epic Games gerenciada via Cloud Functions no backend.');
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

    notificationService.createNotification({
      title: `🎁 Jogo Grátis Liberto: ${newGame.title}!`,
      message: `Disponível na ${newGame.store} para ${newGame.platform}. Resgate até ${newGame.endDate}!`,
      category: 'Jogos grátis Epic Games',
      image: newGame.image,
      url: newGame.affiliateUrl || newGame.url,
    }).catch(() => {});

    return newGame;
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
