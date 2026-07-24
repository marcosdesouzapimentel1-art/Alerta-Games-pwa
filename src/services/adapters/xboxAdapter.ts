import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class XboxAdapter implements NewsSourceAdapter {
  name = 'Xbox Wire';
  sourceKey = 'xbox';

  private rssUrl = 'https://news.xbox.com/en-us/feed/';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'xbox-wire-01'),
        title: 'Xbox Wire: Novos jogos chegando ao Xbox Game Pass nesta quinzena',
        summary: 'Microsoft destaca estreias no Dia 1, suporte a Cloud Gaming e títulos de parceiros para Xbox Series X|S e PC.',
        content: 'Confira a lista completa de novos jogos integrados ao catálogo do Game Pass no console, PC e nuvem.',
        image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'Xbox Wire Team',
        publishedAt: new Date().toISOString(),
        category: 'Game Pass',
        tags: ['Xbox', 'Game Pass', 'Microsoft', 'Cloud Gaming'],
        url: 'https://news.xbox.com',
        readTimeMinutes: 3,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'Xbox', fallback);
  }
}
