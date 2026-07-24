import Parser from 'rss-parser';
import axios from 'axios';
import { CONFIG } from '../config';
import { Logger } from './logger';

export interface RSSItem {
  id?: string;
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  enclosure?: { url?: string };
  'media:content'?: { $?: { url?: string } };
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  }
});

export async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<RSSItem[]> {
  let attempt = 0;
  while (attempt <= CONFIG.MAX_RETRIES) {
    try {
      attempt++;
      Logger.debug(`Fetching RSS [${sourceName}] - Attempt ${attempt}`);

      const response = await axios.get(feedUrl, {
        timeout: CONFIG.TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlertaGameNewsFetcher/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      const feed = await parser.parseString(response.data);
      return feed.items || [];
    } catch (error: any) {
      Logger.warn(`Failed to fetch RSS [${sourceName}] (Attempt ${attempt}/${CONFIG.MAX_RETRIES + 1}): ${error.message}`);
      if (attempt > CONFIG.MAX_RETRIES) {
        throw error;
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  return [];
}
