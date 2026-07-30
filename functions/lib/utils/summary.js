"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAISummary = generateAISummary;
const genai_1 = require("@google/genai");
const config_1 = require("../config");
const parser_1 = require("./parser");
const logger_1 = require("./logger");
async function generateAISummary(originalTitle, rawContent, sourceUrl) {
    const apiKey = process.env.GEMINI_API_KEY;
    const fallbackResult = {
        title: originalTitle.trim(),
        summary: rawContent.replace(/<[^>]*>?/gm, '').slice(0, 180).trim() + '...',
        content: rawContent.replace(/<[^>]*>?/gm, '').trim() || originalTitle,
        category: (0, parser_1.detectCategory)(originalTitle, rawContent),
        tags: (0, parser_1.extractTags)(originalTitle, rawContent),
        readingTime: Math.max(1, Math.ceil(rawContent.split(/\s+/).length / 200))
    };
    if (!apiKey) {
        logger_1.Logger.debug('GEMINI_API_KEY not found in environment, using fallback RSS parser.');
        return fallbackResult;
    }
    try {
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const prompt = `
Você é um editor sênior do portal de notícias Alerta Game.
Analise o título e o conteúdo da notícia gamer abaixo e gere um JSON válido contendo:
- "title": Título otimizado e chamativo em português (máx 90 caracteres)
- "summary": Resumo curto impactante em português (1 a 2 frases, máx 180 caracteres)
- "content": Texto bem formatado e legível explicando a notícia em português (2 a 3 parágrafos)
- "category": Uma categoria dentre [${config_1.CONFIG.CATEGORIES.join(', ')}]
- "tags": Lista com 3 a 5 tags relevantes
- "readingTime": Tempo estimado de leitura em minutos (inteiro)

NUNCA altere o link original nem invente fatos falsos.

Título original: ${originalTitle}
Conteúdo bruto: ${rawContent.slice(0, 1500)}

Responda ESTRITAMENTE um JSON com as chaves indicadas sem markdown ou textos adicionais.
`;
        const response = await ai.models.generateContent({
            model: config_1.CONFIG.GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const responseText = response.text || '';
        const parsed = JSON.parse(responseText);
        return {
            title: parsed.title || fallbackResult.title,
            summary: parsed.summary || fallbackResult.summary,
            content: parsed.content || fallbackResult.content,
            category: parsed.category || fallbackResult.category,
            tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackResult.tags,
            readingTime: typeof parsed.readingTime === 'number' ? parsed.readingTime : fallbackResult.readingTime
        };
    }
    catch (error) {
        logger_1.Logger.warn(`Gemini AI summary failed, using fallback: ${error.message}`);
        return fallbackResult;
    }
}
//# sourceMappingURL=summary.js.map