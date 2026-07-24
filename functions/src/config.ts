export const CONFIG = {
  TIMEOUT_MS: 8000,
  MAX_RETRIES: 1,
  DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  GEMINI_MODEL: 'gemini-2.5-flash',
  
  CATEGORIES: [
    'PlayStation',
    'Xbox',
    'Nintendo',
    'PC',
    'Steam',
    'Epic Games',
    'Game Pass',
    'PS Plus',
    'GTA 6',
    'Fortnite',
    'Minecraft',
    'EA Sports FC',
    'Call of Duty',
    'Valorant',
    'League of Legends',
    'Indie Games',
    'Promoções',
    'Lançamentos'
  ],

  FEEDS: {
    IGN: 'https://br.ign.com/feed.xml',
    GAMESPOT: 'https://www.gamespot.com/feeds/news/',
    VGC: 'https://www.videogameschronicle.com/feed/',
    PLAYSTATION: 'https://blog.br.playstation.com/feed/',
    XBOX: 'https://news.xbox.com/en-us/feed/',
    NINTENDO: 'https://www.nintendo.com/us/whatsnew/rss/',
    STEAM: 'https://store.steampowered.com/news/storenews/',
    EPIC: 'https://store.epicgames.com/rss',
    EA: 'https://www.ea.com/news/rss',
    CALL_OF_DUTY: 'https://www.callofduty.com/blog/rss.xml',
    FORTNITE: 'https://www.fortnite.com/news/rss',
    LEAGUE_OF_LEGENDS: 'https://www.leagueoflegends.com/en-us/news/rss.xml',
    VALORANT: 'https://playvalorant.com/en-us/news/rss.xml',
    MINECRAFT: 'https://www.minecraft.net/en-us/feeds/community-content/rss'
  }
};
