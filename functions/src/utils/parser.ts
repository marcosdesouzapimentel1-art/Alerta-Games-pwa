import axios from 'axios';
import * as cheerio from 'cheerio';
import { CONFIG } from '../config';
import { Logger } from './logger';

export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '') // remove non-alphanumeric
    .trim();
}

export function detectCategory(title: string, content: string = ''): string {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes('playstation') || text.includes('ps4') || text.includes('ps5') || text.includes('dualhsense')) {
    if (text.includes('ps plus') || text.includes('playstation plus')) return 'PS Plus';
    return 'PlayStation';
  }
  if (text.includes('xbox') || text.includes('series x') || text.includes('series s')) {
    if (text.includes('game pass') || text.includes('gamepass')) return 'Game Pass';
    return 'Xbox';
  }
  if (text.includes('nintendo') || text.includes('switch') || text.includes('mario') || text.includes('zelda')) {
    return 'Nintendo';
  }
  if (text.includes('gta 6') || text.includes('gta vi') || text.includes('grand theft auto 6')) {
    return 'GTA 6';
  }
  if (text.includes('fortnite')) return 'Fortnite';
  if (text.includes('minecraft')) return 'Minecraft';
  if (text.includes('ea sports fc') || text.includes('fifa')) return 'EA Sports FC';
  if (text.includes('call of duty') || text.includes('cod') || text.includes('warzone')) return 'Call of Duty';
  if (text.includes('valorant')) return 'Valorant';
  if (text.includes('league of legends') || text.includes('lol')) return 'League of Legends';
  if (text.includes('steam')) return 'Steam';
  if (text.includes('epic games') || text.includes('epic store')) return 'Epic Games';
  if (text.includes('promoção') || text.includes('promocao') || text.includes('desconto') || text.includes('oferta') || text.includes('sale')) {
    return 'Promoções';
  }
  if (text.includes('lançamento') || text.includes('lancamento') || text.includes('revela') || text.includes('anunciado')) {
    return 'Lançamentos';
  }
  if (text.includes('indie')) return 'Indie Games';
  if (text.includes('pc') || text.includes('geforce') || text.includes('rtx')) return 'PC';

  return 'Geral';
}

export function extractTags(title: string, content: string = ''): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const tagsSet = new Set<string>();

  for (const cat of CONFIG.CATEGORIES) {
    if (text.includes(cat.toLowerCase())) {
      tagsSet.add(cat);
    }
  }

  if (text.includes('grátis') || text.includes('gratis') || text.includes('free')) tagsSet.add('Gratuito');
  if (text.includes('update') || text.includes('atualização')) tagsSet.add('Atualização');
  if (text.includes('trailer')) tagsSet.add('Trailer');
  if (text.includes('análise') || text.includes('review')) tagsSet.add('Review');

  return Array.from(tagsSet);
}

export async function fetchOpenGraphImage(url: string): Promise<string> {
  if (!url || !url.startsWith('http')) return CONFIG.DEFAULT_IMAGE;

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const ogImage = $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') ||
                   $('link[rel="image_src"]').attr('href');

    if (ogImage && ogImage.startsWith('http')) {
      return ogImage;
    }
  } catch (error: any) {
    Logger.debug(`Could not extract OpenGraph image from ${url}: ${error.message}`);
  }

  return CONFIG.DEFAULT_IMAGE;
}
