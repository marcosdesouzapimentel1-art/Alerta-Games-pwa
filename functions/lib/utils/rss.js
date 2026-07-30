"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRSSFeed = fetchRSSFeed;
const rss_parser_1 = __importDefault(require("rss-parser"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("./logger");
const parser = new rss_parser_1.default({
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['content:encoded', 'contentEncoded'],
            ['dc:creator', 'creator']
        ]
    }
});
async function fetchRSSFeed(feedUrl, sourceName) {
    let attempt = 0;
    while (attempt <= config_1.CONFIG.MAX_RETRIES) {
        try {
            attempt++;
            logger_1.Logger.debug(`Fetching RSS [${sourceName}] - Attempt ${attempt}`);
            const response = await axios_1.default.get(feedUrl, {
                timeout: config_1.CONFIG.TIMEOUT_MS,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlertaGameNewsFetcher/1.0',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                }
            });
            const feed = await parser.parseString(response.data);
            return feed.items || [];
        }
        catch (error) {
            logger_1.Logger.warn(`Failed to fetch RSS [${sourceName}] (Attempt ${attempt}/${config_1.CONFIG.MAX_RETRIES + 1}): ${error.message}`);
            if (attempt > config_1.CONFIG.MAX_RETRIES) {
                throw error;
            }
            await new Promise((res) => setTimeout(res, 1000));
        }
    }
    return [];
}
//# sourceMappingURL=rss.js.map