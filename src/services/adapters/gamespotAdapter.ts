import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class GameSpotAdapter implements NewsSourceAdapter {
  name = 'GameSpot';
  sourceKey = 'gamespot';

  private rssUrl = 'https://www.gamespot.com/feeds/news/';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'gamespot-update-01'),
        title: 'GameSpot News: Atualização crítica de segurança e desempenho em plataformas digitais',
        summary: 'Desenvolvedoras lançam patches de emergência corrigindo bugs e aprimorando matchmaking online.',
        content: 'Notícias quentes do GameSpot detalham melhorias de estabilidade em servidores e ajustes no passe de batalha.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'Redação GameSpot',
        publishedAt: new Date().toISOString(),
        category: 'PC',
        tags: ['GameSpot', 'Patches', 'Multiplayer'],
        url: 'https://www.gamespot.com',
        readTimeMinutes: 3,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'PC', fallback);
  }
}
