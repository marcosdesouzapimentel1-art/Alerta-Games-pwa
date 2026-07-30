import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  where,
  limit as limitConstraint,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsArticle, NewsCategory } from '../types';
import { SyncLog } from './adapters/base';

export const NEWS_CATEGORIES: NewsCategory[] = [
  'Todas',
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
  'EA Sports FC',
  'Minecraft',
  'Call of Duty',
  'Valorant',
  'League of Legends',
];

// Sample seed news covering all required categories for initial automated news syncing
const SAMPLE_AUTOMATED_NEWS: NewsArticle[] = [
  {
    id: 'news-gta6-01',
    title: 'GTA 6: Rockstar confirma novo trailer focado em Vice City e física do motor RAGE',
    summary: 'A Rockstar Games revelou detalhes inéditos da ambientação de Leonida e o sistema de inteligência artificial de NPCs em tempo real.',
    content: `A Rockstar Games voltou a chacoalhar o mercado de videogames com novos anúncios sobre Grand Theft Auto VI.
    
    ### Principais novidades confirmadas:
    - **Tecnologia RAGE 9:** Suporte a reflexos ray tracing em todas as superfícies e simulação física de fluidos avançada.
    - **Ecossistema de Vice City:** Mais de 1000 atividades dinâmicas espalhadas pelas praias, pântanos e boates de Vice City.
    - **Inteligência Artificial de NPCs:** Reações únicas e rotinas diárias individuais para milhares de habitantes.
    
    O lançamento continua agendado para o segundo semestre de 2026 no PlayStation 5 e Xbox Series X|S.`,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    source: 'Rockstar Newswire',
    author: 'Gabriel "Pixel" Silva',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    category: 'GTA 6',
    tags: ['GTA 6', 'Rockstar Games', 'Vice City', 'PS5', 'Xbox'],
    url: 'https://www.rockstargames.com/vi',
    featured: true,
    viewsCount: 45200,
    commentsCount: 382,
    likesCount: 5210,
    readTimeMinutes: 4,
  },
  {
    id: 'news-steam-01',
    title: 'Steam bate novo recorde histórico com 39 milhões de jogadores simultâneos',
    summary: 'Promos de inverno e lançamentos de grandes títulos independentes impulsionaram a plataforma da Valve.',
    content: `A plataforma da Valve estabeleceu um novo marco na história do PC Gaming atingindo mais de 39.200.000 usuários ativos ao mesmo tempo.
    
    Os jogos mais jogados no momento do recorde foram Counter-Strike 2, Dota 2, PUBG: BATTLEGROUNDS e Banana.`,
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80',
    source: 'SteamDB',
    author: 'Livia Rocha',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    category: 'Steam',
    tags: ['Steam', 'Valve', 'PC Gaming', 'Recorde'],
    url: 'https://store.steampowered.com',
    featured: true,
    viewsCount: 31800,
    commentsCount: 142,
    likesCount: 3890,
    readTimeMinutes: 3,
  },
  {
    id: 'news-psplus-01',
    title: 'PS Plus de Julho: Sony adiciona 6 grandes títulos de peso ao plano Extra e Deluxe',
    summary: 'God of War Ragnarök, Hogwarts Legacy e Cyberpunk 2077 chegam ao catálogo do serviço da PlayStation.',
    content: `A Sony anunciou a nova seleção de jogos do catálogo PlayStation Plus Extra e Deluxe para este mês.
    
    ### Jogos adicionados:
    - God of War Ragnarök (PS5/PS4)
    - Hogwarts Legacy (PS5)
    - Cyberpunk 2077 (PS5)
    - Stray (PS5/PS4)
    - Dave the Diver (PS5)
    
    Os títulos estarão disponíveis para download a partir da próxima terça-feira.`,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
    source: 'PlayStation Blog',
    author: 'Mateus Santos',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    category: 'PS Plus',
    tags: ['PS Plus', 'PlayStation', 'PS5', 'Jogos Grátis'],
    url: 'https://blog.playstation.com',
    featured: true,
    viewsCount: 28900,
    commentsCount: 210,
    likesCount: 2940,
    readTimeMinutes: 5,
  },
  {
    id: 'news-gamepass-01',
    title: 'Xbox Game Pass anuncia chegada no Dia 1 para Call of Duty e novos RPGs',
    summary: 'Microsoft reforça a assinatura com lançamentos AAA diretos no catálogo para console e PC.',
    content: `A divisão de jogos da Microsoft atualizou o roteiro do Xbox Game Pass para a segunda metade do ano.
    
    Além do próximo Call of Duty totalmente gratuito para assinantes no lançamento, o serviço receberá novidades da Bethesda e da Activision Blizzard.`,
    image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80',
    source: 'Xbox Wire',
    author: 'Renato Vortex',
    publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    category: 'Game Pass',
    tags: ['Game Pass', 'Xbox', 'Microsoft', 'Call of Duty'],
    url: 'https://news.xbox.com',
    viewsCount: 21400,
    commentsCount: 180,
    likesCount: 2450,
    readTimeMinutes: 4,
  },
  {
    id: 'news-fortnite-01',
    title: 'Fortnite lança nova temporada com evento crossover massivo e motor Unreal Engine 5.4',
    summary: 'Novas mecânicas de física de construção e mapa reestruturado estão disponíveis para download.',
    content: `A Epic Games disponibilizou a mais nova temporada do Fortnite Battle Royale. O jogo agora roda com melhorias substanciais no Nanite e Lumen do Unreal Engine 5.4.`,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
    source: 'Epic Games News',
    author: 'Livia Rocha',
    publishedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    category: 'Fortnite',
    tags: ['Fortnite', 'Epic Games', 'Battle Royale', 'Unreal Engine'],
    url: 'https://www.fortnite.com',
    viewsCount: 19500,
    commentsCount: 98,
    likesCount: 1820,
    readTimeMinutes: 3,
  },
  {
    id: 'news-eafc-01',
    title: 'EA Sports FC 25 revela novo sistema de táticas de IA "FC IQ" e modo Ultimate Team reformulado',
    summary: 'A EA Sports promete mudanças profundas na movimentação sem bola dos jogadores e novos Ícones do futebol.',
    content: `EA Sports apresentou oficialmente as inovações táticas do EA Sports FC. A mecânica "FC IQ" usará dados reais da Opta para automatizar comportamentos de inteligência artificial em tempo real durante as partidas.`,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    source: 'EA Sports Press',
    author: 'Mateus Santos',
    publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    category: 'EA Sports FC',
    tags: ['EA Sports FC', 'Futebol', 'Ultimate Team', 'Fifa'],
    url: 'https://www.ea.com/games/ea-sports-fc',
    viewsCount: 16800,
    commentsCount: 112,
    likesCount: 1540,
    readTimeMinutes: 4,
  },
  {
    id: 'news-valorant-01',
    title: 'Valorant lança atualização de balanceamento de Agentes e novo mapa "Abyss"',
    summary: 'Riot Games ajusta duelistas e introduz mecânica de quedas verticais no novo mapa competitivo.',
    content: `A Riot Games aplicou o patch 9.02 no Valorant. A grande atração é o mapa Abyss, que não possui limites laterais e permite eliminações por queda de precipícios.`,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    source: 'Riot Games Valorant',
    author: 'Renato Vortex',
    publishedAt: new Date(Date.now() - 1000 * 60 * 750).toISOString(),
    category: 'Valorant',
    tags: ['Valorant', 'Riot Games', 'Esports', 'FPS'],
    url: 'https://playvalorant.com',
    viewsCount: 14200,
    commentsCount: 88,
    likesCount: 1390,
    readTimeMinutes: 3,
  },
  {
    id: 'news-lol-01',
    title: 'League of Legends: Riot confirma rework completo de campeão e novo modo PVE Swarm',
    summary: 'Novo modo no estilo Vampire Survivors chega ao cliente oficial com batalhas contra hordas de monstros.',
    content: `A Riot Games revelou os detalhes do modo de jogo temporário 'Swarm' (Enxame) em League of Legends. Jogadores poderão se unir em até 4 pessoas contra ondas infinitas de Inimigos de Anima.`,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    source: 'League of Legends Nexus',
    author: 'Gabriel Silva',
    publishedAt: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    category: 'League of Legends',
    tags: ['League of Legends', 'Riot Games', 'LoL', 'MOBA'],
    url: 'https://leagueoflegends.com',
    viewsCount: 22100,
    commentsCount: 195,
    likesCount: 2890,
    readTimeMinutes: 4,
  },
  {
    id: 'news-minecraft-01',
    title: 'Minecraft atinge 300 milhões de cópias vendidas e anuncia grande atualização Tricky Trials',
    summary: 'Mojang Studios revela novos blocos decorativos, câmaras de desafio automáticas e o mace de batalha.',
    content: `O fenômeno da Mojang continua imbatível. Com 300 milhões de cópias vendidas em todo o planeta, a atualização Tricky Trials adiciona masmorras geradas procedimentalmente com recompensas exclusivas.`,
    image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80',
    source: 'Mojang Minecraft.net',
    author: 'Livia Rocha',
    publishedAt: new Date(Date.now() - 1000 * 60 * 1100).toISOString(),
    category: 'Minecraft',
    tags: ['Minecraft', 'Mojang', 'Microsoft', 'Tricky Trials'],
    url: 'https://www.minecraft.net',
    viewsCount: 27500,
    commentsCount: 164,
    likesCount: 3100,
    readTimeMinutes: 3,
  },
  {
    id: 'news-nintendo-01',
    title: 'Nintendo confirma suporte contínuo ao Switch e antecipa anúncios do próximo console',
    summary: 'Patentes registram compatibilidade física com os jogos atuais e nova tela de alta taxa de atualização.',
    content: `A Nintendo assegurou aos acionistas que o ecossistema da Conta Nintendo garantirá transição suave entre o Switch original e o próximo sistema da empresa.`,
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1200&q=80',
    source: 'Nintendo Japan Corporate',
    author: 'Mateus Santos',
    publishedAt: new Date(Date.now() - 1000 * 60 * 1300).toISOString(),
    category: 'Nintendo',
    tags: ['Nintendo', 'Switch', 'Console', 'Nintendo Direct'],
    url: 'https://www.nintendo.com',
    viewsCount: 34100,
    commentsCount: 220,
    likesCount: 3900,
    readTimeMinutes: 4,
  },
  {
    id: 'news-epic-01',
    title: 'Epic Games Store traz jogos grátis da semana e cupom surpresa de 33% OFF',
    summary: 'Os aclamados títulos Alan Wake 2 e Subnautica podem ser resgatados sem custos adicionais.',
    content: `A rotina semanal de presentes da Epic Games traz grandes surpresas. Jogadores de PC podem adicionar títulos icônicos permanentemente às suas bibliotecas.`,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    source: 'Epic Games Store',
    author: 'Gabriel Silva',
    publishedAt: new Date(Date.now() - 1000 * 60 * 1500).toISOString(),
    category: 'Epic Games',
    tags: ['Epic Games', 'PC Gaming', 'Jogos Grátis', 'Promoção'],
    url: 'https://store.epicgames.com',
    viewsCount: 18900,
    commentsCount: 104,
    likesCount: 2200,
    readTimeMinutes: 3,
  },
  {
    id: 'news-cod-01',
    title: 'Call of Duty: Black Ops 6 revela modo Zumbis por Rodadas e campanha nos anos 90',
    summary: 'Activision publica vídeo com gameplay detalhado do mapa Términus e mecânicas de movimento omnidirecional.',
    content: `A Treyarch apresentou as mecânicas revolucinárias de movimentação omnidirecional (Omnimovement) que permitirão aos jogadores correr, deslizar e saltar em 360 graus.`,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    source: 'Call of Duty Blog',
    author: 'Renato Vortex',
    publishedAt: new Date(Date.now() - 1000 * 60 * 1700).toISOString(),
    category: 'Call of Duty',
    tags: ['Call of Duty', 'Black Ops', 'Activision', 'Zumbis'],
    url: 'https://www.callofduty.com',
    viewsCount: 29800,
    commentsCount: 245,
    likesCount: 4100,
    readTimeMinutes: 5,
  },
];

/**
 * Simulates fetching news from external API sources or RSS feeds.
 * Prepared for future real API endpoints (e.g. NewsAPI, Igdb, RSS parsers).
 */
export const fetchExternalNewsApi = async (): Promise<NewsArticle[]> => {
  try {
    // Check if a custom news API endpoint is defined in env variables
    const customApiUrl = import.meta.env.VITE_NEWS_API_URL;
    if (customApiUrl) {
      const response = await fetch(customApiUrl);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.articles)) {
          return data.articles.map((art: any, index: number) => ({
            id: art.id || `ext-${Date.now()}-${index}`,
            title: art.title || 'Sem título',
            summary: art.description || art.summary || 'Resumo indisponível.',
            content: art.content || art.description || '',
            image: art.urlToImage || art.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
            source: art.source?.name || 'API Externa',
            author: art.author || 'Alerta Game News',
            publishedAt: art.publishedAt || new Date().toISOString(),
            category: art.category || 'PC',
            tags: art.tags || ['Gaming', 'Notícias'],
            url: art.url || 'https://alertagame.app',
            readTimeMinutes: 3,
          }));
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao conectar com API externa de notícias, utilizando fonte interna:', error);
  }

  // Fallback: Return structured, dynamic automated news batch
  return SAMPLE_AUTOMATED_NEWS;
};

import { newsAggregator } from './newsAggregator';
export { newsAggregator };
export type { SyncLog } from './adapters/base';

/**
 * Triggers the Cloud Function v2 syncNewsManual via HTTP request
 */
export const triggerCloudFunctionNewsSync = async (): Promise<{
  syncedCount: number;
  totalArticles: number;
  log: SyncLog;
}> => {
  const functionUrl =
    import.meta.env.VITE_SYNC_NEWS_FUNCTION_URL ||
    'https://us-central1-alerta-game.cloudfunctions.net/syncNewsManual';

  const candidateUrls = [
    functionUrl,
    'https://syncnewsmanual-uc.a.run.app',
    'https://us-central1-alerta-game.cloudfunctions.net/syncNewsManual'
  ];

  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const data = json.data;
          const log: SyncLog = {
            id: `cf_sync_${Date.now()}`,
            timestamp: data.completedAt || new Date().toISOString(),
            sourcesAttempted: Array.isArray(data.sourcesQueried) ? data.sourcesQueried.length : 7,
            sourcesSuccessful: Array.isArray(data.sourcesQueried)
              ? data.sourcesQueried.filter((s: any) => s.status === 'success').map((s: any) => s.sourceName)
              : [],
            sourcesFailed: Array.isArray(data.sourcesQueried)
              ? data.sourcesQueried.filter((s: any) => s.status === 'error').map((s: any) => ({ source: s.sourceName, error: s.error || '' }))
              : [],
            articlesFound: data.totalFound ?? 0,
            newArticlesCount: data.totalAdded ?? 0,
            duplicatesCount: data.duplicatesCount ?? 0,
            errorsCount: Array.isArray(data.errors) ? data.errors.length : 0,
            totalArticlesCount: data.totalFound ?? 0,
            trigger: 'manual',
            adminEmail: 'Cloud Function v2'
          };

          return {
            syncedCount: data.totalAdded ?? 0,
            totalArticles: data.totalFound ?? 0,
            log,
          };
        }
      }
    } catch (err: any) {
      console.warn(`Tentativa de chamada para Cloud Function na URL ${url} falhou:`, err.message);
      lastError = err;
    }
  }

  // Fallback to client-side aggregator if Cloud Function endpoint is not reachable during local dev
  try {
    console.info('Executando sincronização de contingência...');
    const log = await newsAggregator.runSync('manual');
    return {
      syncedCount: log.newArticlesCount,
      totalArticles: log.totalArticlesCount,
      log,
    };
  } catch (fallbackErr) {
    throw lastError || fallbackErr;
  }
};

/**
 * Synchronizes news from external sources into Cloud Firestore via Cloud Function v2.
 */
export const syncNewsFromExternalSources = async (
  adminUser?: { uid?: string; email?: string }
): Promise<{
  syncedCount: number;
  totalArticles: number;
  log: SyncLog;
}> => {
  return await triggerCloudFunctionNewsSync();
};

/**
 * Fetches the most recent news sync log from Firestore news_sync_logs
 */
export const getLatestNewsSyncLogFromFirestore = async (): Promise<SyncLog | null> => {
  try {
    const logsColRef = collection(db, 'news_sync_logs');
    const q = query(logsColRef, limitConstraint(10));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const dateStr = data.completedAt || data.timestamp || data.startedAt || data.createdAt;
        let dateVal = 0;
        if (dateStr?.toDate) {
          dateVal = dateStr.toDate().getTime();
        } else if (typeof dateStr === 'string') {
          dateVal = new Date(dateStr).getTime();
        }
        return { docSnap, data, dateVal };
      }).sort((a, b) => b.dateVal - a.dateVal);

      const topData = docs[0].data;
      return {
        id: docs[0].docSnap.id,
        timestamp: topData.completedAt || topData.timestamp || topData.startedAt || new Date().toISOString(),
        sourcesAttempted: Array.isArray(topData.sourcesQueried) ? topData.sourcesQueried.length : (topData.sourcesAttempted || 7),
        sourcesSuccessful: Array.isArray(topData.sourcesQueried)
          ? topData.sourcesQueried.filter((s: any) => s.status === 'success').map((s: any) => s.sourceName)
          : (topData.sourcesSuccessful || []),
        sourcesFailed: Array.isArray(topData.sourcesQueried)
          ? topData.sourcesQueried.filter((s: any) => s.status === 'error').map((s: any) => ({ source: s.sourceName, error: s.error || '' }))
          : (topData.sourcesFailed || []),
        articlesFound: topData.totalFound ?? topData.articlesFound ?? 0,
        newArticlesCount: topData.totalAdded ?? topData.newArticlesCount ?? 0,
        duplicatesCount: topData.duplicatesCount ?? 0,
        errorsCount: Array.isArray(topData.errors) ? topData.errors.length : (topData.errorsCount ?? 0),
        totalArticlesCount: topData.totalFound ?? topData.totalArticlesCount ?? 0,
        trigger: 'manual',
        adminEmail: topData.adminEmail || 'Cloud Function v2'
      };
    }
  } catch (err) {
    console.warn('Aviso ao buscar último log de sincronização:', err);
  }
  return null;
};

interface GetNewsOptions {
  category?: string;
  searchQuery?: string;
  pageSize?: number;
  lastDocSnap?: QueryDocumentSnapshot<DocumentData> | null;
}

/**
 * Fetches news from Firestore ordered by publishedAt desc.
 * Includes category filtering, search, and pagination.
 */
export const getNewsFromFirestore = async ({
  category,
  searchQuery,
  pageSize = 10,
  lastDocSnap = null,
}: GetNewsOptions = {}): Promise<{
  articles: NewsArticle[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> => {
  try {
    const newsColRef = collection(db, 'news');
    
    // Build query constraints
    const constraints: any[] = [orderBy('publishedAt', 'desc')];

    if (category && category !== 'Todas' && category !== 'todas') {
      constraints.unshift(where('category', '==', category));
    }

    if (lastDocSnap) {
      constraints.push(startAfter(lastDocSnap));
    }

    constraints.push(limitConstraint(pageSize + 1));

    const q = query(newsColRef, ...constraints);
    let snapshot = await getDocs(q);

    // If Firestore is empty (first launch or reset), trigger initial sync automatically!
    if (snapshot.empty && !lastDocSnap) {
      await syncNewsFromExternalSources();
      snapshot = await getDocs(q);
    }

    let docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    if (hasMore) {
      docs = docs.slice(0, pageSize);
    }

    const lastVisibleDoc = docs.length > 0 ? docs[docs.length - 1] : null;

    let articles: NewsArticle[] = docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        summary: data.summary || '',
        image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        imageUrl: data.imageUrl || data.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        content: data.content || '',
        source: data.source || 'Alerta Game',
        author: data.author || { name: 'Redação Alerta Game', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
        publishedAt: data.publishedAt || new Date().toISOString(),
        category: data.category || 'Todas',
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: data.url || 'https://alertagame.app',
        featured: data.featured || false,
        viewsCount: data.viewsCount || 100,
        commentsCount: data.commentsCount || 12,
        likesCount: data.likesCount || 45,
        readTimeMinutes: data.readTimeMinutes || 3,
        platforms: data.platforms || ['PC', 'PS5', 'Xbox'],
      };
    });

    // Client-side search filtering if searchQuery is provided
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase().trim();
      articles = articles.filter(
        (art) =>
          art.title.toLowerCase().includes(term) ||
          art.summary.toLowerCase().includes(term) ||
          art.category.toLowerCase().includes(term) ||
          art.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Fallback if no Firestore articles found matching query
    if (articles.length === 0 && !category && !searchQuery) {
      articles = SAMPLE_AUTOMATED_NEWS;
    }

    return {
      articles,
      lastVisibleDoc,
      hasMore,
    };
  } catch (error) {
    console.warn('Erro ao consultar Firestore (usando fallback offline de notícias):', error);
    // Fallback to local sample articles on network or Firestore permission issues
    let filtered = SAMPLE_AUTOMATED_NEWS;
    if (category && category !== 'Todas' && category !== 'todas') {
      filtered = filtered.filter((a) => a.category === category);
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.summary.toLowerCase().includes(term)
      );
    }
    return {
      articles: filtered,
      lastVisibleDoc: null,
      hasMore: false,
    };
  }
};
