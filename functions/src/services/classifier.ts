import { ALLOWED_CATEGORIES, GeminiNewsAnalysis } from './gemini';

export function normalizeCategory(suggestedCategory?: string, originalCategory?: string): string {
  if (suggestedCategory && ALLOWED_CATEGORIES.includes(suggestedCategory as any)) {
    return suggestedCategory;
  }

  // Se a categoria sugerida tiver partes correspondentes
  if (suggestedCategory) {
    const lower = suggestedCategory.toLowerCase();
    for (const cat of ALLOWED_CATEGORIES) {
      if (lower.includes(cat.toLowerCase())) {
        return cat;
      }
    }
  }

  // Tentar corresponder à categoria original
  if (originalCategory && ALLOWED_CATEGORIES.includes(originalCategory as any)) {
    return originalCategory;
  }

  return 'Outros';
}

export function processKeywords(keywords?: string[], title?: string, source?: string): string[] {
  if (Array.isArray(keywords) && keywords.length >= 3) {
    return keywords.map((k) => k.trim()).filter(Boolean).slice(0, 10);
  }

  // Fallback de palavras-chave baseadas no título e fonte
  const baseWords = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const set = new Set([...baseWords, source?.toLowerCase() || 'games', 'notícias', 'alerta game']);
  return Array.from(set).slice(0, 8);
}
