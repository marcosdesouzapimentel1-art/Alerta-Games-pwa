import axios from 'axios';
import { NewsArticleInput } from '../utils/deduplicate';

const RAWG_API_KEY = process.env.RAWG_API_KEY || 'a71e624c478841a18bc0093ecbe35c6e';

export async function fetchRawgNews(): Promise<NewsArticleInput[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const response = await axios.get('https://api.rawg.io/api/games', {
      params: {
        key: RAWG_API_KEY,
        ordering: '-released',
        page_size: 10,
        dates: `${thirtyDaysAgo},${today}`
      },
      timeout: 10000
    });

    const games = response.data?.results || [];
    const articles: NewsArticleInput[] = [];

    for (const game of games) {
      if (!game.name) continue;

      const title = `Lançamento: ${game.name}`;
      const summary = `Saiba mais sobre o lançamento de ${game.name}. Avaliação: ${game.rating || 'N/A'}/5. Plataformas: ${
        game.platforms?.map((p: any) => p.platform?.name).filter(Boolean).join(', ') || 'Geral'
      }.`;

      let category = 'Geral';
      const platformsStr = game.platforms?.map((p: any) => p.platform?.name).join(' ').toLowerCase() || '';
      if (platformsStr.includes('playstation')) category = 'PlayStation';
      else if (platformsStr.includes('xbox')) category = 'Xbox';
      else if (platformsStr.includes('nintendo') || platformsStr.includes('switch')) category = 'Nintendo';
      else if (platformsStr.includes('pc')) category = 'PC';

      const imageUrl = game.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';

      articles.push({
        title,
        summary,
        content: summary,
        url: `https://rawg.io/games/${game.slug || game.id}`,
        imageUrl,
        image: imageUrl,
        source: 'RAWG API',
        category,
        publishedAt: game.released ? new Date(game.released).toISOString() : new Date().toISOString(),
        readTimeMinutes: 3
      });
    }

    return articles;
  } catch (error: any) {
    console.error('Erro ao buscar notícias do RAWG API:', error.message);
    throw error;
  }
}
