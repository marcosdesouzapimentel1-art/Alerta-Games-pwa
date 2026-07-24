import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class PlayStationAdapter implements NewsSourceAdapter {
  name = 'PlayStation Blog';
  sourceKey = 'playstation';

  private rssUrl = 'https://blog.playstation.com/feed/';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'ps-blog-01'),
        title: 'PlayStation Blog: Atualização do PS5 traz novos recursos de áudio 3D e resposta tátil',
        summary: 'A Sony Interactive Entertainment anuncia novidades de firmware e adições ao catálogo do PS Plus.',
        content: 'O novo firmware do PlayStation 5 aprimora o controle DualSense com melhorias de feedback tátil e perfis de áudio personalizados.',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'PlayStation Team',
        publishedAt: new Date().toISOString(),
        category: 'PlayStation',
        tags: ['PlayStation', 'PS5', 'PS Plus', 'Sony'],
        url: 'https://blog.playstation.com',
        readTimeMinutes: 4,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'PlayStation', fallback);
  }
}
