import { db } from '../lib/firebase';

export const runFreeGamesSync = async (): Promise<{ count: number; durationMs: number }> => {
  const startTime = Date.now();
  let count = 0;

  try {
    // ==========================================
    // 1. SINCRONIZAÇÃO DA EPIC GAMES STORE
    // ==========================================
    try {
      const epicResponse = await fetch(
        'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR'
      );
      const epicData: any = await epicResponse.json();
      const elements = epicData?.data?.Catalog?.searchStore?.elements || [];

      for (const game of elements) {
        const price = game?.price?.totalPrice?.discountPrice;
        const isFree = price === 0;
        if (!isFree) continue;

        const title = game?.title || 'Jogo Grátis Epic';
        const description = game?.description || 'Resgate este jogo gratuitamente na Epic Games Store.';
        
        const images = game?.keyImages || [];
        const coverImage = images.find((img: any) => img?.type === 'DieselStoreFrontWide')?.url || 
                           images[0]?.url || '';
        
        const mappings = game?.catalogNs?.mappings;
        const slug = mappings?.[0]?.pageSlug || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const storeUrl = `https://store.epicgames.com/p/${slug}`;

        const gameId = `epic_free_${game?.id || Date.now()}`;

        let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        try {
          const promotionalOffers = game?.promotions?.promotionalOffers;
          const offer = promotionalOffers?.[0]?.promotionalOffers?.[0];
          if (offer?.endDate) {
            endDate = offer.endDate;
          }
        } catch (e) {}

        await db.collection('free_games').doc(gameId).set({
          id: gameId,
          title: title,
          store: 'Epic Games',
          description: description,
          image: coverImage,
          url: storeUrl,
          originalPrice: 99.90, // Valor padrão ilustrativo
          currentPrice: 'Grátis',
          endDate: endDate,
          platform: 'PC',
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        count++;
      }
    } catch (epicError) {
      console.error('Erro ao sincronizar Epic Games:', epicError);
    }

    // ==========================================
    // 2. SINCRONIZAÇÃO DA STEAM (Via GamerPower API)
    // ==========================================
    try {
      const steamResponse = await fetch('https://www.gamerpower.com/api/giveaways?platform=steam');
      if (steamResponse.ok) {
        const steamData: any = await steamResponse.json();

        for (const game of steamData) {
          // Pega apenas jogos completos e DLCs relevantes na Steam
          if (game.type !== 'Game' && game.type !== 'DLC') continue;

          const title = game.title;
          const description = game.description || 'Resgate gratuitamente na Steam antes que a oferta acabe!';
          const coverImage = game.image || game.thumbnail || '';
          const storeUrl = game.open_giveaway_url;
          
          const gameId = `steam_free_${game.id || Date.now()}`;

          // Tenta converter o valor em Dólar da API para um valor aproximado em Reais
          let originalPrice = 49.90;
          if (game.worth && game.worth !== 'N/A') {
            const numericPrice = parseFloat(game.worth.replace(/[^0-9.]/g, ''));
            if (!isNaN(numericPrice)) {
               originalPrice = numericPrice * 5; // Conversão básica de $ para R$
            }
          }

          const endDate = game.end_date && game.end_date !== 'N/A' 
            ? new Date(game.end_date).toISOString() 
            : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

          await db.collection('free_games').doc(gameId).set({
            id: gameId,
            title: title,
            store: 'Steam',
            description: description,
            image: coverImage,
            url: storeUrl,
            originalPrice: originalPrice,
            currentPrice: 'Grátis',
            endDate: endDate,
            platform: 'PC',
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          count++;
        }
      }
    } catch (steamError) {
      console.error('Erro ao sincronizar Steam:', steamError);
    }

    const durationMs = Date.now() - startTime;
    return { count, durationMs };
  } catch (error: any) {
    console.error('Erro geral ao sincronizar jogos grátis:', error);
    throw new Error(error.message);
  }
};
