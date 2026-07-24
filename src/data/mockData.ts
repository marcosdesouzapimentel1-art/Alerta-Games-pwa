import { NewsItem, GameDeal, UpcomingRelease, NotificationItem, UserProfile } from '../types';

export const mockCategories = [
  { id: 'todas', name: 'Todas', icon: 'Sparkles', count: 28 },
  { id: 'PlayStation', name: 'PlayStation', icon: 'Gamepad2', count: 8 },
  { id: 'Xbox', name: 'Xbox', icon: 'Box', count: 7 },
  { id: 'Nintendo', name: 'Nintendo', icon: 'Tv', count: 5 },
  { id: 'PC Gaming', name: 'PC Gaming', icon: 'Monitor', count: 12 },
  { id: 'Ofertas', name: 'Ofertas & Promoções', icon: 'Tag', count: 15 },
  { id: 'Lançamentos', name: 'Lançamentos', icon: 'Rocket', count: 10 },
  { id: 'Hardware', name: 'Hardware & Tech', icon: 'Cpu', count: 6 },
  { id: 'Esports', name: 'Esports', icon: 'Trophy', count: 4 },
  { id: 'Mobile', name: 'Mobile Games', icon: 'Smartphone', count: 5 },
];

export const mockHeroBanners: NewsItem[] = [
  {
    id: 'hero-1',
    title: 'GTA VI: Rockstar confirma novo trailer e revela detalhes do mapa de Vice City',
    summary: 'A Rockstar Games surpreendeu a comunidade ao anunciar o próximo trailer gameplay de Grand Theft Auto VI com suporte a ray tracing de última geração.',
    content: `
      A ansiedade para **Grand Theft Auto VI** acaba de atingir novos patamares. Em um comunicado oficial, a Rockstar Games confirmou que o próximo trailer focará inteiramente na física do motor RAGE aprimorado, no ecossistema dinâmico de Leonida e no mapa interativo expandido.

      ### O Que Esperar de Vice City
      * **População Inteligente:** NPCs com rotinas diárias completas e reações contextualizadas.
      * **Sistema Climático Extremo:** Furacões, tempestades tropicais e reflexos em poças em tempo real.
      * **Interação Social em Tempo Real:** Redes sociais in-game integradas às missões principais dos protagonistas Lucia e Jason.

      O jogo continua planejado para lançamento no PS5 e Xbox Series X|S, com suporte total no dia 1 para PS5 Pro.
    `,
    category: 'Geral',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Gabriel "Pixel" Silva',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
    publishedAt: '2026-07-22T14:30:00Z',
    readTimeMinutes: 4,
    featured: true,
    platforms: ['PS5', 'Xbox'],
    viewsCount: 45200,
    commentsCount: 382,
    likesCount: 5210,
  },
  {
    id: 'hero-2',
    title: 'Mega Promoção Steam de Inverno: Até 90% de desconto em mais de 10.000 títulos',
    summary: 'Cyberpunk 2077, Elden Ring, Baldur\'s Gate 3 e centenas de grandes lançamentos atingem seus menores preços históricos na Steam.',
    content: `
      A **Steam Summer/Winter Sale** já está oficialmente no ar e trouxe reduções recordes de preços em praticamente todas as grandes publisher da indústria!

      ### Maiores Destaques da Promoção:
      1. **Cyberpunk 2077: Ultimate Edition** — R$ 89,90 (-60%)
      2. **Elden Ring** — R$ 119,40 (-50%)
      3. **Baldur's Gate 3** — R$ 139,90 (-30%)
      4. **The Witcher 3: Wild Hunt Complete** — R$ 19,90 (-85%)

      Confira nossa curadoria diária com o bot de Alerta de Preços para receber notificações sempre que um item da sua lista de desejos baixar mais de 50%.
    `,
    category: 'Ofertas',
    imageUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Livia Rocha',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    publishedAt: '2026-07-22T10:15:00Z',
    readTimeMinutes: 3,
    featured: true,
    platforms: ['PC'],
    viewsCount: 31800,
    commentsCount: 142,
    likesCount: 3890,
  },
  {
    id: 'hero-3',
    title: 'PlayStation 5 Pro recebe atualização massiva trazendo PSSR 2.0 e 120 FPS em 4K',
    summary: 'A Sony lançou o firmware oficial 3.0 para o PS5 Pro com upscaling alimentado por IA aprimorado e menor latência.',
    content: `
      A Sony Interactive Entertainment disponibilizou hoje a aguardada atualização de firmware para o **PlayStation 5 Pro**. A grande estrela da atualização é a introdução do **PSSR 2.0** (PlayStation Spectral Super Resolution), o algoritmo de reconstrução de imagem via aprendizado de máquina proprietário da Sony.

      ### Principais Melhorias:
      * **Análise Quadro a Quadro Aprimorada:** Eliminação de ruído em áreas escuras e folhagens densas.
      * **Modo Desempenho Ultra 120Hz:** Suporte nativo ao Variable Refresh Rate (VRR) em displays HDMI 2.1.
      * **Modo Economia Eficiente:** Menor consumo de energia durante sessões prolongadas de jogo.
    `,
    category: 'PlayStation',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Mateus "Tech" Santos',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    },
    publishedAt: '2026-07-21T18:00:00Z',
    readTimeMinutes: 5,
    featured: true,
    platforms: ['PS5'],
    viewsCount: 28900,
    commentsCount: 210,
    likesCount: 2940,
  },
];

export const mockNews: NewsItem[] = [
  ...mockHeroBanners,
  {
    id: 'n1',
    title: 'Xbox Game Pass anuncia 8 novos jogos para o catálogo de julho',
    summary: 'Call of Duty: Modern Warfare III, Frostpunk 2 e Hades II lideram a lista de adições ao serviço de assinatura da Microsoft.',
    content: 'A Microsoft revelou hoje a segunda leva de jogos que chegam ao catálogo do Xbox Game Pass Ultimate neste mês...',
    category: 'Xbox',
    imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Renato "Vortex"', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
    publishedAt: '2026-07-22T13:00:00Z',
    readTimeMinutes: 3,
    platforms: ['Xbox', 'PC'],
    viewsCount: 18400,
    commentsCount: 95,
    likesCount: 2150,
  },
  {
    id: 'n2',
    title: 'Nintendo Switch 2: Novo patente indica retrocompatibilidade física total e telas OLED de 120Hz',
    summary: 'Documentos do escritório de patentes dos EUA confirmam que o sucessor do Nintendo Switch rodará todos os cartuchos atuais.',
    content: 'Rumores reforçados por uma nova patente da Nintendo apontam para retrocompatibilidade perfeita no futuro console...',
    category: 'Nintendo',
    imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Livia Rocha', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
    publishedAt: '2026-07-22T11:45:00Z',
    readTimeMinutes: 4,
    platforms: ['Switch'],
    viewsCount: 39100,
    commentsCount: 240,
    likesCount: 4120,
  },
  {
    id: 'n3',
    title: 'NVIDIA RTX 5090 surge em testes vazados com 70% mais desempenho em Ray Tracing',
    summary: 'A nova arquitetura Blackwell consome menos energia enquanto atinge taxas incríveis de quadros em 8K DLSS 3.5.',
    content: 'O mercado de hardware para PC Gaming está prestes a presenciar um salto histórico em poder de processamento gráfico...',
    category: 'Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Mateus "Tech" Santos', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
    publishedAt: '2026-07-21T16:20:00Z',
    readTimeMinutes: 5,
    platforms: ['PC'],
    viewsCount: 22800,
    commentsCount: 168,
    likesCount: 3100,
  },
  {
    id: 'n4',
    title: 'Monster Hunter Wilds lança Beta Aberto no PS5, Xbox Series X|S e Steam',
    summary: 'Jogadores já podem criar seus caçadores, explorar as planícies fluviais e testar as novas mecânicas de montaria rápida.',
    content: 'A Capcom liberou hoje o acesso antecipado ao teste beta de Monster Hunter Wilds para todos os usuários cadastrados...',
    category: 'Lançamentos',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Gabriel "Pixel" Silva', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
    publishedAt: '2026-07-20T20:10:00Z',
    readTimeMinutes: 3,
    platforms: ['PS5', 'Xbox', 'PC'],
    viewsCount: 14200,
    commentsCount: 78,
    likesCount: 1890,
  },
];

export const mockDeals: GameDeal[] = [
  {
    id: 'd1',
    gameTitle: 'Elden Ring: Shadow of the Erdtree Edition',
    originalPrice: 299.90,
    discountPrice: 149.95,
    discountPercent: 50,
    store: 'Steam',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-07-28T23:59:59Z',
    rating: 4.9,
    isHistoricalLow: true,
    platforms: ['PC'],
    dealUrl: 'https://store.steampowered.com',
  },
  {
    id: 'd2',
    gameTitle: 'God of War Ragnarök',
    originalPrice: 349.90,
    discountPrice: 139.96,
    discountPercent: 60,
    store: 'PlayStation Store',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-07-25T23:59:59Z',
    rating: 4.8,
    isHistoricalLow: true,
    platforms: ['PS5'],
    dealUrl: 'https://store.playstation.com',
  },
  {
    id: 'd3',
    gameTitle: 'Forza Horizon 5 Premium Edition',
    originalPrice: 399.00,
    discountPrice: 119.70,
    discountPercent: 70,
    store: 'Xbox Store',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-07-30T23:59:59Z',
    rating: 4.7,
    couponCode: 'XBOXMEGASALE',
    platforms: ['Xbox', 'PC'],
    dealUrl: 'https://xbox.com',
  },
  {
    id: 'd4',
    gameTitle: 'The Legend of Zelda: Tears of the Kingdom',
    originalPrice: 357.00,
    discountPrice: 224.90,
    discountPercent: 37,
    store: 'Nintendo eShop',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-07-26T23:59:59Z',
    rating: 5.0,
    isHistoricalLow: false,
    platforms: ['Switch'],
    dealUrl: 'https://nintendo.com',
  },
  {
    id: 'd5',
    gameTitle: 'Cyberpunk 2077: Phantom Liberty',
    originalPrice: 199.90,
    discountPrice: 79.96,
    discountPercent: 60,
    store: 'Epic Games',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-07-29T23:59:59Z',
    rating: 4.6,
    isHistoricalLow: true,
    platforms: ['PC'],
    dealUrl: 'https://epicgames.com',
  },
];

export const mockReleases: UpcomingRelease[] = [
  {
    id: 'r1',
    title: 'Grand Theft Auto VI',
    releaseDate: '2026-09-15',
    developer: 'Rockstar North',
    publisher: 'Rockstar Games',
    platforms: ['PS5', 'Xbox'],
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    description: 'A aguardada sequência da franquia mais famosa do mundo dos games, ambientada no estado de Leonida e Vice City.',
    preOrderUrl: 'https://rockstargames.com/vi',
  },
  {
    id: 'r2',
    title: 'Monster Hunter Wilds',
    releaseDate: '2026-08-28',
    developer: 'Capcom',
    publisher: 'Capcom',
    platforms: ['PS5', 'Xbox', 'PC'],
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    description: 'Cace monstros em ecossistemas vivos e dinâmicos com novas montarias rápidas e climas em evolução contínua.',
  },
  {
    id: 'r3',
    title: 'Ghost of Yōtei',
    releaseDate: '2026-10-10',
    developer: 'Sucker Punch Productions',
    publisher: 'Sony Interactive Entertainment',
    platforms: ['PS5'],
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    description: 'Explore o monte Yōtei no Japão feudal em 1603 assumindo o papel da guerreira Atsu em busca de vingança.',
  },
  {
    id: 'r4',
    title: 'Doom: The Dark Ages',
    releaseDate: '2026-11-20',
    developer: 'id Software',
    publisher: 'Bethesda Softworks',
    platforms: ['PS5', 'Xbox', 'PC'],
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    description: 'A prequela sombria e visceral da jornada do Doom Slayer inspirada em fantasia sombria medieval.',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '⚡ Oferta Histórica Ativada!',
    message: 'Elden Ring atingiu R$ 149,95 na Steam (-50%). Corra antes que acabe!',
    timestamp: 'Há 10 minutos',
    type: 'deal',
    read: false,
    linkId: 'd1',
  },
  {
    id: 'notif-2',
    title: '🔥 Notícia Quente',
    message: 'Rockstar confirma novo trailer de GTA VI com foco em Vice City.',
    timestamp: 'Há 1 hora',
    type: 'news',
    read: false,
    linkId: 'hero-1',
  },
  {
    id: 'notif-3',
    title: '🚀 Lembrete de Lançamento',
    message: 'Monster Hunter Wilds entra em contagem regressiva para lançamento em 30 dias.',
    timestamp: 'Há 3 horas',
    type: 'release',
    read: true,
    linkId: 'r2',
  },
  {
    id: 'notif-4',
    title: '📱 PWA Instalado com Sucesso',
    message: 'Bem-vindo ao Alerta Game! Você receberá notificações instantâneas sobre promoções.',
    timestamp: 'Ontem',
    type: 'system',
    read: true,
  },
];

export const mockUserProfile: UserProfile = {
  uid: 'user-guest-default',
  email: 'marcos.pimentel@alertagame.app',
  displayName: 'Marcos Pimentel',
  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  createdAt: new Date().toISOString(),
  gamePreferences: ['PlayStation', 'PC', 'GTA 6', 'Steam', 'Game Pass'],
  favoriteCategories: ['Ofertas', 'PlayStation', 'GTA 6'],
  
  name: 'Marcos Pimentel',
  gamerTag: 'GamerAlert#2026',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  xpLevel: 42,
  title: 'Mestre Caçador de Ofertas',
  joinedDate: 'Janeiro de 2025',
  favoritePlatforms: ['PC', 'PS5', 'Xbox'],
  badges: [
    { id: 'b1', name: 'Primeiros Passos', icon: 'Award', description: 'Instalou o PWA no dispositivo' },
    { id: 'b2', name: 'Sniper de Descontos', icon: 'Target', description: 'Economizou mais de R$ 500 em ofertas' },
    { id: 'b3', name: 'Leitor Voraz', icon: 'BookOpen', description: 'Leu mais de 50 notícias gamers' },
    { id: 'b4', name: 'Beta Tester VIP', icon: 'ShieldCheck', description: 'Participou do lançamento do Alerta Game' },
  ],
};
