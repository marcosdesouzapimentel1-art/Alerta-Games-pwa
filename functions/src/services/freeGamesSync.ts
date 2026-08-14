import { db } from '../lib/firebase';

export const runFreeGamesSync = async (): Promise<{ count: number; durationMs: number }> => {
  const startTime = Date.now();
  let count = 0;

  try {
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR'
    );
    const data: any = await response.json();
    const elements = data?.data?.Catalog?.searchStore?.elements || [];

    for (const game of elements) {
      const promotionalOffers = game.promotions?.promotionalOffers;
      
      // Verifica se o jogo está realmente em oferta promocional ativa
      const isFree = game.price?.totalPrice?.discountPrice === 0;
      if (!isFree) continue;

      const title = game.title;
      const description = game.description || 'Resgate este jogo gratuitamente na Epic Games Store.';
      const coverImage = game.keyImages?.find((img: any) => img.type === 'DieselStoreFrontWide')?.url || 
                         game.keyImages?.[0]?.url || '';
      
      const slug = game.catalogNs?.mappings?.[0]?.pageSlug || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const storeUrl = `https://store.epicgames.com/p/${slug}`;

      const gameId = `epic_free_${game.id || Date.now()}`;

      // Tenta pegar a data de término com total segurança para evitar erros de undefined
      let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        const promotionalOffer = promotionalOffers?.[0]?.promotionalOffers?.[0];
        if (promotionalOffer?.endDate) {
          endDate = promotionalOffer.endDate;
        }
      } catch (e) {
        // Mantém a data padrão de 7 dias caso falhe
      }

      await db.collection('free_games').doc(gameId).set({
        id: gameId,
        title: title,
        store: 'Epic Games',
        description: description,
        image: coverImage,
        url: storeUrl,
        originalPrice: 'R$ 0,00',
        currentPrice: 'Grátis',
        endDate: endDate,
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
