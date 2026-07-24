import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class NintendoAdapter implements NewsSourceAdapter {
  name = 'Nintendo';
  sourceKey = 'nintendo';

  private rssUrl = 'https://www.nintendo.com/us/whatsnew/rss.xml';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'nintendo-news-01'),
        title: 'Nintendo News: Promoções na eShop e novos eventos em jogos do Switch',
        summary: 'A Nintendo destaca ofertas de indie games e torneios comunitários para donos de Nintendo Switch.',
        content: 'Confira as promoções ativas na eShop e novos pacotes de DLC para os títulos mais jogados do console.',
        image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'Nintendo America',
        publishedAt: new Date().toISOString(),
        category: 'Nintendo',
        tags: ['Nintendo', 'Switch', 'eShop', 'Ofertas'],
        url: 'https://www.nintendo.com',
        readTimeMinutes: 3,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'Nintendo', fallback);
  }
}
