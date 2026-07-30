"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRawgNews = fetchRawgNews;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const summary_1 = require("../utils/summary");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
async function fetchRawgNews() {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
        logger_1.Logger.debug('RAWG_API_KEY not configured, skipping RAWG adapter.');
        return [];
    }
    const results = [];
    try {
        const url = `https://api.rawg.io/api/news?key=${apiKey}&page_size=10`;
        const response = await axios_1.default.get(url, { timeout: config_1.CONFIG.TIMEOUT_MS });
        const items = response.data?.results || [];
        for (const item of items) {
            const rawTitle = item.title || 'RAWG Gaming News';
            const rawUrl = item.url || item.link || `https://rawg.io/news/${item.id}`;
            const rawContent = item.description || item.body || item.title;
            const pubDate = item.created ? new Date(item.created).toISOString() : new Date().toISOString();
            let image = item.image || item.background_image;
            if (!image) {
                image = await (0, parser_1.fetchOpenGraphImage)(rawUrl);
            }
            const ai = await (0, summary_1.generateAISummary)(rawTitle, rawContent, rawUrl);
            const docId = `rawg_${item.id || Math.abs(rawUrl.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`;
            results.push({
                id: docId,
                title: ai.title,
                summary: ai.summary,
                content: ai.content,
                image,
                url: rawUrl,
                source: 'RAWG Video Games Database',
                author: item.author || 'RAWG News',
                publishedAt: pubDate,
                category: ai.category,
                tags: ai.tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                featured: false,
                readingTime: ai.readingTime,
                views: Math.floor(Math.random() * 200) + 50,
                likes: Math.floor(Math.random() * 30) + 5,
                language: 'pt-BR',
                status: 'published'
            });
        }
    }
    catch (error) {
        logger_1.Logger.warn(`RAWG fetch error: ${error.message}`);
    }
    return results;
}
//# sourceMappingURL=rawg.js.map