"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatArticleTranslation = formatArticleTranslation;
function formatArticleTranslation(article, analysis) {
    const now = new Date().toISOString();
    if (analysis && analysis.title_pt && analysis.summary_pt) {
        return {
            titleOriginal: article.title,
            descriptionOriginal: article.summary,
            contentOriginal: article.content || article.summary,
            titlePt: analysis.title_pt,
            summaryPt: analysis.summary_pt,
            translatedAt: now,
            geminiVersion: 'gemini-3.6-flash',
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
        translatedAt: now,
        geminiVersion: 'fallback-original',
        wasTranslatedByAi: false
    };
}
//# sourceMappingURL=translator.js.map