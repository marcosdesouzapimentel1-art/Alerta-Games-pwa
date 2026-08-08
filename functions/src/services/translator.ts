import { NewsArticleInput } from '../utils/deduplicate';
import { GeminiNewsAnalysis } from './gemini';

export interface TranslatedArticleData {
  titleOriginal: string;
  descriptionOriginal: string;
  contentOriginal: string;
  titlePt: string;
  summaryPt: string;
  contentPt: string;
  translatedAt: string;
  geminiVersion: string;
  wasTranslatedByAi: boolean;
}

export function formatArticleTranslation(
  article: NewsArticleInput,
  analysis: GeminiNewsAnalysis | null
): TranslatedArticleData {
  const now = new Date().toISOString();

  if (analysis && analysis.title_pt && analysis.summary_pt) {
    return {
      titleOriginal: article.title,
      descriptionOriginal: article.summary,
      contentOriginal: article.content || article.summary,
      titlePt: analysis.title_pt,
      summaryPt: analysis.summary_pt,
      contentPt: analysis.summary_pt,
      translatedAt: now,
      geminiVersion: 'gemini-2.5-flash',
      wasTranslatedByAi: true
    };
  }

  // Fallback caso o Gemini não tenha retornado ou falhado
  return {
    titleOriginal: article.title,
    descriptionOriginal: article.summary,
    contentOriginal: article.content || article.summary,
    titlePt: article.title,
    summaryPt: article.summary,
    contentPt: article.content || article.summary,
    translatedAt: now,
    geminiVersion: 'fallback-original',
    wasTranslatedByAi: false
  };
}
