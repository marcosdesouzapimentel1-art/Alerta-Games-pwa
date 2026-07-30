"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCategory = normalizeCategory;
exports.processKeywords = processKeywords;
const gemini_1 = require("./gemini");
function normalizeCategory(suggestedCategory, originalCategory) {
    if (suggestedCategory && gemini_1.ALLOWED_CATEGORIES.includes(suggestedCategory)) {
        return suggestedCategory;
    }
    // Se a categoria sugerida tiver partes correspondentes
    if (suggestedCategory) {
        const lower = suggestedCategory.toLowerCase();
        for (const cat of gemini_1.ALLOWED_CATEGORIES) {
            if (lower.includes(cat.toLowerCase())) {
                return cat;
            }
        }
    }
    // Tentar corresponder à categoria original
    if (originalCategory && gemini_1.ALLOWED_CATEGORIES.includes(originalCategory)) {
        return originalCategory;
    }
    return 'Outros';
}
function processKeywords(keywords, title, source) {
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
//# sourceMappingURL=classifier.js.map