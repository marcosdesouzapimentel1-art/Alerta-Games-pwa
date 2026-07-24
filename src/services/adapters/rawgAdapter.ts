import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchWithTimeout, generateArticleId, categorizeArticle } from './base';

export class RawgAdapter implements NewsSourceAdapter {
  name = 'RAWG API';
  sourceKey = 'rawg';

  async fetchArticles(): Promise<NewsArticle[]> {
    const apiKey = import.meta.env.VITE_RAWG_API_KEY || 'c5307246763e45db871180ba31454652';
    const url = `https://api.rawg.io/api/games?key=${apiKey}&page_size=8&ordering=-released`;

    try {
      const response = await fetchWithTimeout(url, {}, 8000);
      if (!response.ok) {
        throw new Error(`Status ${response.status}: Limite de requisições ou erro RAWG`);
      }

      const data = await response.json();
      if (Array.isArray(data.results)) {
        return data.results.map((game: any) => {
          const title = `Lançamento: ${game.name} ganha destaque na comunidade de PC e consoles`;
          const platforms = game.platforms?.map((p: any) => p.platform?.name).join(', ') || 'Multiplataforma';
          const summary = `O título ${game.name} recebeu nota ${game.rating || 'N/A'}/5 e está disponível nas plataformas: ${platforms}.`;
          
          return {
            id: generateArticleId(this.sourceKey, game.name),
            title,
            summary,
            content: `${summary}\n\nLançado originalmente em ${game.released || 'data recente'}.\nGêneros: ${game.genres?.map((g: any) => g.name).join(', ') || 'Ação/Aventura'}.\n\nAcompanhe as novidades e avaliações dos jogadores no Alerta Game!`,
            image: game.background_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
            source: this.name,
            author: 'RAWG Gaming Intelligence',
            publishedAt: new Date(game.released || Date.now()).toISOString(),
            category: categorizeArticle(game.name, platforms, 'PC'),
            tags: ['RAWG', 'Lançamento', 'Games'],
            url: `https://rawg.io/games/${game.slug || game.id}`,
            readTimeMinutes: 3,
          };
        });
      }
    } catch (error) {
      console.warn(`[RAWG API] Erro ao buscar dados (${error}). Ativando fallback de contingência.`);
    }

    // Fallback sample
    return [
      {
        id: generateArticleId(this.sourceKey, 'rawg-trending-01'),
        title: 'RAWG Radar: Novos jogos em alta para PC, PlayStation 5 e Xbox Series X',
        summary: 'Mapeamento de tendências indica alta procura por novos títulos independentes e remasters de grande porte.',
        content: 'A base de dados do RAWG registrou aumento vertiginoso no interesse por RPGs orientais e simuladores de nova geração.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'RAWG Gaming Intelligence',
        publishedAt: new Date().toISOString(),
        category: 'PC',
        tags: ['RAWG', 'Tendências', 'Lançamentos'],
        url: 'https://rawg.io',
        readTimeMinutes: 3,
      },
    ];
  }
}
