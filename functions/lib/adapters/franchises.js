"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFranchisesNews = fetchFranchisesNews;
const rss_1 = require("../utils/rss");
const config_1 = require("../config");
const summary_1 = require("../utils/summary");
const parser_1 = require("../utils/parser");
const FRANCHISE_FEEDS = [
    { sourceName: 'Electronic Arts (EA)', feedUrl: config_1.CONFIG.FEEDS.EA, defaultCategory: 'EA Sports FC' },
    { sourceName: 'Call of Duty Official', feedUrl: config_1.CONFIG.FEEDS.CALL_OF_DUTY, defaultCategory: 'Call of Duty' },
    { sourceName: 'Fortnite News', feedUrl: config_1.CONFIG.FEEDS.FORTNITE, defaultCategory: 'Fortnite' },
    { sourceName: 'League of Legends', feedUrl: config_1.CONFIG.FEEDS.LEAGUE_OF_LEGENDS, defaultCategory: 'League of Legends' },
    { sourceName: 'Valorant News', feedUrl: config_1.CONFIG.FEEDS.VALORANT, defaultCategory: 'Valorant' },
    { sourceName: 'Minecraft Official', feedUrl: config_1.CONFIG.FEEDS.MINECRAFT, defaultCategory: 'Minecraft' }
];
async function fetchFranchisesNews() {
    const allDocs = [];
    for (const feedConfig of FRANCHISE_FEEDS) {
        try {
            const items = await (0, rss_1.fetchRSSFeed)(feedConfig.feedUrl, feedConfig.sourceName);
            for (const item of items.slice(0, 5)) {
                const rawTitle = item.title || `${feedConfig.sourceName} Update`;
                const rawUrl = item.link || '';
                if (!rawUrl)
                    continue;
                const rawContent = item.contentSnippet || item.content || item['contentEncoded'] || rawTitle;
                const pubDate = item.isoDate || item.pubDate ? new Date(item.isoDate || item.pubDate).toISOString() : new Date().toISOString();
                let image = item.enclosure?.url || item['mediaContent']?.$?.url;
                if (!image) {
                    image = await (0, parser_1.fetchOpenGraphImage)(rawUrl);
                }
                const ai = await (0, summary_1.generateAISummary)(rawTitle, rawContent, rawUrl);
                const hash = Math.abs(rawUrl.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
                const prefix = feedConfig.sourceName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
                const docId = `${prefix}_${hash}`;
                allDocs.push({
                    id: docId,
                    title: ai.title,
                    summary: ai.summary,
                    content: ai.content,
                    image,
                    url: rawUrl,
                    source: feedConfig.sourceName,
                    author: item.creator || item.author || feedConfig.sourceName,
                    publishedAt: pubDate,
                    category: ai.category || feedConfig.defaultCategory,
                    tags: ai.tags,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    featured: false,
                    readingTime: ai.readingTime,
                    views: Math.floor(Math.random() * 300) + 100,
                    likes: Math.floor(Math.random() * 50) + 10,
                    language: 'pt-BR',
                    status: 'published'
                });
            }
        }
        catch (error) {
            // Continue next franchise feed even if one fails
        }
    }
    return allDocs;
}
//# sourceMappingURL=franchises.js.map