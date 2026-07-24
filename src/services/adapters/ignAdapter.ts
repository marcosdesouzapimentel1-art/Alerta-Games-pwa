import { NewsArticle } from '../../types';
import { NewsSourceAdapter, fetchRssArticles, generateArticleId } from './base';

export class IgnAdapter implements NewsSourceAdapter {
  name = 'IGN';
  sourceKey = 'ign';

  private rssUrl = 'https://feeds.feedburner.com/ign/news';

  async fetchArticles(): Promise<NewsArticle[]> {
    const fallback: NewsArticle[] = [
      {
        id: generateArticleId(this.sourceKey, 'ign-fallout-01'),
        title: 'IGN Brasil: Análise revela detalhes técnicos dos jogos mais aguardados do ano',
        summary: 'Equipe do IGN testa desempenho, taxa de quadros e gráficos em consoles de última geração e PCs com placas RTX.',
        content: 'A equipe de análises da IGN publicou os benchmarks comparativos entre as versões de console e PC dos últimos lançamentos AAA.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        source: this.name,
        author: 'Redação IGN',
        publishedAt: new Date().toISOString(),
        category: 'PlayStation',
        tags: ['IGN', 'Análise', 'Consoles'],
        url: 'https://br.ign.com',
        readTimeMinutes: 4,
      },
    ];

    return fetchRssArticles(this.rssUrl, this.name, this.sourceKey, 'Todas', fallback);
  }
}
