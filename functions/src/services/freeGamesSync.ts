import { db } from '../lib/firebase';

interface EpicGameItem {
  title: string;
  description: string;
  price: {
    totalPrice: {
      discountPrice: number;
    };
  };
  keyImages: { type: string; url: string }[];
  promotions?: {
    promotionalOffers: {
      promotionalOffer: {
        startDate: string;
        endDate: string;
      }[];
    }[];
  }[];
  catalogNs: { mappings: { pageSlug: string }[] };
}

export const runFreeGamesSync = async (): Promise<{ count: number; durationMs: number }> => {
  const startTime = Date.now();
  let count = 0;

  try {
    // API pública oficial da Epic Games Store
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR'
    );
    const data: any = await response.json();
    const elements = data?.data?.Catalog?.searchStore?.elements || [];

    for (const game of elements) {
      const promotionalOffers = game.promotions?.promotionalOffers;
      if (!promotionalOffers || promotionalOffers.length === 0) continue;

      const isFree = game.price?.totalPrice?.discountPrice === 0;
      if (!isFree) continue;

      const title = game.title;
      const description = game.description;
      const coverImage = game.keyImages?.find((img: any) => img.type === 'DieselStoreFrontWide')?.url || 
                         game.keyImages?.[0]?.url || '';
      
      const slug = game.catalogNs?.mappings?.[0]?.pageSlug || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const storeUrl = `https://store.epicgames.com/p/${slug}`;

      const gameId = `epic_free_${game.id || Date.now()}`;

      // Salva ou atualiza automaticamente na coleção 'free_games' do Firestore
      await db.collection('free_games').doc(gameId).set({
        id: gameId,
        title: title,
        store: 'Epic Games',
        description: description,
        image: coverImage,
        url: storeUrl,
        originalPrice: 'R$ 0,00',
        currentPrice: 'Grátis',
        endDate: promotionalOffers[0]?.promotionalOffer[0]?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      count++;
    }

    const durationMs = Date.now() - startTime;
    return { count, durationMs };
  } catch (error: any) {
    console.error('Erro ao sincronizar jogos grátis da Epic:', error);
    throw new Error(error.message);
  }
};
