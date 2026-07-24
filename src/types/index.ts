export type Platform = 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Mobile';

export type NewsCategory =
  | 'Todas'
  | 'PlayStation'
  | 'Xbox'
  | 'Nintendo'
  | 'PC'
  | 'Steam'
  | 'Epic Games'
  | 'Game Pass'
  | 'PS Plus'
  | 'GTA 6'
  | 'Fortnite'
  | 'EA Sports FC'
  | 'Minecraft'
  | 'Call of Duty'
  | 'Valorant'
  | 'League of Legends';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  image?: string;
  imageUrl?: string; // alias for image compatibility
  content: string;
  source?: string;
  author: string | { name: string; avatarUrl?: string };
  publishedAt: string;
  category: NewsCategory | string;
  tags?: string[];
  url?: string;
  featured?: boolean;
  viewsCount?: number;
  commentsCount?: number;
  likesCount?: number;
  readTimeMinutes?: number;
  platforms?: Platform[];
}

export type NewsItem = NewsArticle;

export interface GameDeal {
  id: string;
  gameTitle: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  store: 'Steam' | 'PlayStation Store' | 'Xbox Store' | 'Nintendo eShop' | 'Epic Games';
  storeLogoUrl?: string;
  imageUrl: string;
  expiresAt: string; // ISO date string
  rating: number;
  isHistoricalLow?: boolean;
  couponCode?: string;
  platforms: Platform[];
  dealUrl: string;
  alertPriceTrigger?: number;
}

export interface UpcomingRelease {
  id: string;
  title: string;
  releaseDate: string; // ISO format YYYY-MM-DD
  developer: string;
  publisher: string;
  platforms: Platform[];
  imageUrl: string;
  description: string;
  preOrderUrl?: string;
}

export type AlertCategory =
  | 'Notícias importantes'
  | 'Lançamentos de jogos'
  | 'GTA 6'
  | 'Fortnite'
  | 'Call of Duty'
  | 'Promoções Steam'
  | 'Jogos grátis Epic Games'
  | 'Game Pass'
  | 'PS Plus'
  | 'Cupons e ofertas';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  image?: string;
  category: AlertCategory | string;
  createdAt: string;
  read: boolean;
  url?: string;
}

export interface NotificationPreferences {
  userId: string;
  fcmEnabled: boolean;
  categories: Record<AlertCategory | string, boolean>;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'deal' | 'news' | 'release' | 'system';
  read: boolean;
  linkId?: string;
  image?: string;
  category?: AlertCategory | string;
  url?: string;
}

export type FreeGameStatus = 'Disponível' | 'Encerrado';

export interface FreeGame {
  id: string;
  title: string;
  description: string;
  image: string;
  platform: Platform | string;
  store: 'Epic Games Store' | 'Steam' | 'GOG' | 'PlayStation Store' | 'Xbox Store' | string;
  startDate: string;
  endDate: string;
  url: string;
  affiliateUrl?: string;
  status: FreeGameStatus;
  originalPrice?: number;
  active: boolean;
  createdAt: string;
}

export type PromotionCategory =
  | 'Jogos'
  | 'Consoles'
  | 'Controles'
  | 'Headsets'
  | 'Placas de vídeo'
  | 'Notebooks gamer'
  | 'Gift Cards'
  | 'Assinaturas';

export interface Promotion {
  id: string;
  productTitle: string;
  category: PromotionCategory | string;
  store: string;
  oldPrice: number;
  currentPrice: number;
  discountPercent: number;
  image: string;
  link: string;
  affiliateUrl: string;
  expirationDate: string;
  active: boolean;
  createdAt: string;
  featured?: boolean;
  code?: string;
}

export type CouponCategory =
  | 'Games'
  | 'Hardware'
  | 'Periféricos'
  | 'Gift Cards'
  | 'Consoles'
  | 'PC Gamer'
  | 'Celulares'
  | 'Assinaturas'
  | 'Acessórios';

export interface Coupon {
  id: string;
  store: string; // Required by prompt
  storeName?: string; // Compatibility
  storeLogoUrl?: string;
  title: string;
  description?: string;
  code?: string;
  discount: string; // Required by prompt (e.g. "15% OFF" or "R$ 50 OFF")
  discountPercent?: number;
  category: CouponCategory | string;
  expirationDate: string; // Required by prompt
  validUntil?: string;
  affiliateUrl: string;
  image?: string;
  active: boolean;
  isExpiringToday?: boolean;
  featured?: boolean;
  createdAt?: string;
  storeUrl?: string;
  affiliateTag?: string;
  usesCount?: number;
  verifiedToday?: boolean;
  isExclusive?: boolean;
  minimumPurchase?: number;
  rules?: string[];
}

export type ActiveTab =
  | 'inicio'
  | 'noticias'
  | 'categorias'
  | 'promocoes'
  | 'jogos-gratis'
  | 'cupons'
  | 'pesquisa'
  | 'favoritos'
  | 'perfil'
  | 'configuracoes'
  | 'admin'
  | 'politica-privacidade'
  | 'termos-uso'
  | 'sobre'
  | 'contato';

export type GamerInterest =
  | 'PlayStation'
  | 'Xbox'
  | 'Nintendo'
  | 'PC'
  | 'GTA 6'
  | 'Fortnite'
  | 'Call of Duty'
  | 'Steam'
  | 'Epic Games'
  | 'Game Pass'
  | 'PS Plus';

export type FavoriteType = 'news' | 'free_game' | 'deal' | 'coupon';

export interface FirestoreFavorite {
  id: string; // doc id: `${userId}_${itemId}`
  userId: string;
  type: FavoriteType;
  itemId: string;
  title: string;
  image?: string;
  url?: string;
  createdAt: string;
  extraData?: any;
}

export interface AdminLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'user' | 'admin';
  createdAt: string;
  updatedAt?: string;
  gamePreferences: GamerInterest[]; // "Meus interesses"
  favoriteCategories: string[];
  
  // Backwards compatibility fields for UI display
  name?: string;
  gamerTag?: string;
  avatarUrl?: string;
  xpLevel?: number;
  title?: string;
  joinedDate?: string;
  badges?: Array<{ id: string; name: string; icon: string; description: string }>;
  favoritePlatforms?: Platform[];
}
