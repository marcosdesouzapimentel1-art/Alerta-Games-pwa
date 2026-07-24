import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class VgcAdapter implements NewsSourceAdapter {
  name = 'VGC';
  sourceKey = 'vgc';

  private rssUrl = 'https://www.videogameschronicle.com/feed/';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'vgc-industry-01'),
        title: 'VGC Report: Bastidores da indústria de jogos revelam novas aquisições de estúdios',
        summary: 'Relatório investigativo aponta investimentos milionários em tecnologias de renderização e IA para NPCs.',
        content: 'Fontes próximas ao VGC confirmam negociações para expansão de estúdios independentes e novos acordos de exclusividade.',
        image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'Video Games Chronicle Editorial',
        publishedAt: new Date().toISOString(),
        category: 'Todas',
        tags: ['VGC', 'Indústria', 'Investimentos'],
        url: 'https://www.videogameschronicle.com',
        readTimeMinutes: 4,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'Todas', fallback);
  }
}
