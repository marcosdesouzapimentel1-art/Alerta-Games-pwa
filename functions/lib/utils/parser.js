"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTitle = normalizeTitle;
exports.detectCategory = detectCategory;
exports.extractTags = extractTags;
exports.fetchOpenGraphImage = fetchOpenGraphImage;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const config_1 = require("../config");
const logger_1 = require("./logger");
function normalizeTitle(title) {
    if (!title)
        return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, '') // remove non-alphanumeric
        .trim();
}
function detectCategory(title, content = '') {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('playstation') || text.includes('ps4') || text.includes('ps5') || text.includes('dualhsense')) {
        if (text.includes('ps plus') || text.includes('playstation plus'))
            return 'PS Plus';
        return 'PlayStation';
    }
    if (text.includes('xbox') || text.includes('series x') || text.includes('series s')) {
        if (text.includes('game pass') || text.includes('gamepass'))
            return 'Game Pass';
        return 'Xbox';
    }
    if (text.includes('nintendo') || text.includes('switch') || text.includes('mario') || text.includes('zelda')) {
        return 'Nintendo';
    }
    if (text.includes('gta 6') || text.includes('gta vi') || text.includes('grand theft auto 6')) {
        return 'GTA 6';
    }
    if (text.includes('fortnite'))
        return 'Fortnite';
    if (text.includes('minecraft'))
        return 'Minecraft';
    if (text.includes('ea sports fc') || text.includes('fifa'))
        return 'EA Sports FC';
    if (text.includes('call of duty') || text.includes('cod') || text.includes('warzone'))
        return 'Call of Duty';
    if (text.includes('valorant'))
        return 'Valorant';
    if (text.includes('league of legends') || text.includes('lol'))
        return 'League of Legends';
    if (text.includes('steam'))
        return 'Steam';
    if (text.includes('epic games') || text.includes('epic store'))
        return 'Epic Games';
    if (text.includes('promoção') || text.includes('promocao') || text.includes('desconto') || text.includes('oferta') || text.includes('sale')) {
        return 'Promoções';
    }
    if (text.includes('lançamento') || text.includes('lancamento') || text.includes('revela') || text.includes('anunciado')) {
        return 'Lançamentos';
    }
    if (text.includes('indie'))
        return 'Indie Games';
    if (text.includes('pc') || text.includes('geforce') || text.includes('rtx'))
        return 'PC';
    return 'Geral';
}
function extractTags(title, content = '') {
    const text = `${title} ${content}`.toLowerCase();
    const tagsSet = new Set();
    for (const cat of config_1.CONFIG.CATEGORIES) {
        if (text.includes(cat.toLowerCase())) {
            tagsSet.add(cat);
        }
    }
    if (text.includes('grátis') || text.includes('gratis') || text.includes('free'))
        tagsSet.add('Gratuito');
    if (text.includes('update') || text.includes('atualização'))
        tagsSet.add('Atualização');
    if (text.includes('trailer'))
        tagsSet.add('Trailer');
    if (text.includes('análise') || text.includes('review'))
        tagsSet.add('Review');
    return Array.from(tagsSet);
}
async function fetchOpenGraphImage(url) {
    if (!url || !url.startsWith('http'))
        return config_1.CONFIG.DEFAULT_IMAGE;
    try {
        const response = await axios_1.default.get(url, {
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
    }
    catch (error) {
        logger_1.Logger.debug(`Could not extract OpenGraph image from ${url}: ${error.message}`);
    }
    return config_1.CONFIG.DEFAULT_IMAGE;
}
//# sourceMappingURL=parser.js.map