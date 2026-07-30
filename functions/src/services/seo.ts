import { GeminiNewsAnalysis } from './gemini';

export interface SeoData {
  seoTitle: string;
  seoDescription: string;
}

export function generateSeoData(
  titlePt: string,
  summaryPt: string,
  analysis: GeminiNewsAnalysis | null
): SeoData {
  if (analysis?.seoTitle && analysis?.seoDescription) {
    return {
      seoTitle: analysis.seoTitle.slice(0, 70),
      seoDescription: analysis.seoDescription.slice(0, 160)
    };
  }

  const cleanTitle = titlePt.trim();
  const cleanSummary = summaryPt.trim();

  const seoTitle = cleanTitle.length > 60 ? `${cleanTitle.slice(0, 57)}...` : cleanTitle;
  const seoDescription = cleanSummary.length > 155 ? `${cleanSummary.slice(0, 152)}...` : cleanSummary;

  return {
    seoTitle,
    seoDescription
  };
}
