export interface NewsArticleInput {
  id?: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  image?: string;
  source: string;
  category: string;
  publishedAt: string;
  readTimeMinutes?: number;
}

export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    let cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!cleanPath) cleanPath = '/';
    return `${parsed.protocol}//${parsed.hostname}${cleanPath}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function generateArticleId(title: string, source: string): string {
  const normTitle = normalizeTitle(title).replace(/\s+/g, '-').slice(0, 50);
  const normSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normSource}-${normTitle}`;
}

export function deduplicateArticles<T extends { id?: string; url: string; title: string; source?: string }>(
  newArticles: T[],
  existingItems: Array<{ id?: string; url?: string; title?: string }>
): { uniqueArticles: T[]; duplicatesCount: number } {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  for (const item of existingItems) {
    if (item.id) seenIds.add(item.id);
    if (item.url) seenUrls.add(normalizeUrl(item.url));
    if (item.title) seenTitles.add(normalizeTitle(item.title));
  }

  const uniqueArticles: T[] = [];
  let duplicatesCount = 0;

  for (const article of newArticles) {
    const normUrl = normalizeUrl(article.url);
    const normTitle = normalizeTitle(article.title);
    const articleId = article.id || generateArticleId(article.title, article.source || 'news');

    if (seenIds.has(articleId) || seenUrls.has(normUrl) || seenTitles.has(normTitle)) {
      duplicatesCount++;
      continue;
    }

    seenIds.add(articleId);
    seenUrls.add(normUrl);
    seenTitles.add(normTitle);

    uniqueArticles.push({
      ...article,
      id: articleId
    });
  }

  return { uniqueArticles, duplicatesCount };
}
