import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActiveTab, NewsItem, GameDeal, UpcomingRelease, NotificationItem, Coupon, FirestoreFavorite, FavoriteType } from '../types';
import { initialNotifications } from '../data/mockData';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import {
  saveFavoriteInFirestore,
  removeFavoriteFromFirestore,
  subscribeUserFavorites,
} from '../services/favoritesService';
import { mockNews, mockDeals, mockReleases } from '../data/mockData';
import { mockCoupons } from '../data/mockCoupons';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Selected category for filtering
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  
  // Favorites
  favoriteNewsIds: string[];
  toggleFavoriteNews: (id: string, itemData?: NewsItem) => void;
  favoriteDealIds: string[];
  toggleFavoriteDeal: (id: string, itemData?: GameDeal) => void;
  trackedReleaseIds: string[];
  toggleTrackRelease: (id: string, itemData?: UpcomingRelease) => void;
  favoriteCouponIds: string[];
  toggleFavoriteCoupon: (id: string, itemData?: Coupon) => void;
  clearAllFavorites: () => void;
  firestoreFavorites: FirestoreFavorite[];
  
  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearOldNotifications: () => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  
  // Detail Modals
  selectedNews: NewsItem | null;
  setSelectedNews: (news: NewsItem | null) => void;
  selectedDeal: GameDeal | null;
  setSelectedDeal: (deal: GameDeal | null) => void;
  selectedCoupon: Coupon | null;
  setSelectedCoupon: (coupon: Coupon | null) => void;
  
  // Toast Alerts
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Firestore Favorites state
  const [firestoreFavorites, setFirestoreFavorites] = useState<FirestoreFavorite[]>([]);

  // Local Favorites
  const [favoriteNewsIds, setFavoriteNewsIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alerta-game-fav-news') || '["n1", "n3"]');
    } catch {
      return ['n1', 'n3'];
    }
  });

  const [favoriteDealIds, setFavoriteDealIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alerta-game-fav-deals') || '["d1", "d2"]');
    } catch {
      return ['d1', 'd2'];
    }
  });

  const [trackedReleaseIds, setTrackedReleaseIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alerta-game-tracked-releases') || '["r1"]');
    } catch {
      return ['r1'];
    }
  });

  const [favoriteCouponIds, setFavoriteCouponIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alerta-game-fav-coupons') || '["cup-1", "cup-2"]');
    } catch {
      return ['cup-1', 'cup-2'];
    }
  });

  // Real-time synchronization of Firestore favorites when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsub = subscribeUserFavorites(user.uid, (favs) => {
      setFirestoreFavorites(favs);

      const newsList = favs.filter((f) => f.type === 'news').map((f) => f.itemId);
      const dealsList = favs.filter((f) => f.type === 'deal').map((f) => f.itemId);
      const couponList = favs.filter((f) => f.type === 'coupon').map((f) => f.itemId);
      const releaseList = favs.filter((f) => f.type === 'free_game').map((f) => f.itemId);

      if (favs.length > 0) {
        setFavoriteNewsIds(newsList);
        setFavoriteDealIds(dealsList);
        setFavoriteCouponIds(couponList);
        setTrackedReleaseIds(releaseList);
      }
    });

    return () => unsub();
  }, [user]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Subscribe to real-time notifications from Firestore
  useEffect(() => {
    const userIdToUse = user ? user.uid : 'user-guest-default';
    const unsub = notificationService.subscribeNotifications(userIdToUse, (list) => {
      if (list && list.length > 0) {
        const mapped: NotificationItem[] = list.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          timestamp: new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: item.category.toLowerCase().includes('oferta') || item.category.toLowerCase().includes('promo') || item.category.toLowerCase().includes('cupom')
            ? 'deal'
            : item.category.toLowerCase().includes('lançamento')
            ? 'release'
            : 'news',
          read: item.read,
          category: item.category,
          image: item.image,
          url: item.url,
        }));
        setNotifications(mapped);
      }
    });

    return () => unsub();
  }, [user]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alerta-game-recent-searches') || '["GTA VI", "Elden Ring", "Steam Sale", "PS5 Pro"]');
    } catch {
      return ['GTA VI', 'Elden Ring', 'Steam Sale', 'PS5 Pro'];
    }
  });

  // Modals
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<GameDeal | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('alerta-game-fav-news', JSON.stringify(favoriteNewsIds));
  }, [favoriteNewsIds]);

  useEffect(() => {
    localStorage.setItem('alerta-game-fav-deals', JSON.stringify(favoriteDealIds));
  }, [favoriteDealIds]);

  useEffect(() => {
    localStorage.setItem('alerta-game-tracked-releases', JSON.stringify(trackedReleaseIds));
  }, [trackedReleaseIds]);

  useEffect(() => {
    localStorage.setItem('alerta-game-fav-coupons', JSON.stringify(favoriteCouponIds));
  }, [favoriteCouponIds]);

  useEffect(() => {
    localStorage.setItem('alerta-game-recent-searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleFavoriteNews = async (id: string, itemData?: NewsItem) => {
    const exists = favoriteNewsIds.includes(id);
    const item = itemData || mockNews.find((n) => n.id === id);

    setFavoriteNewsIds((prev) =>
      exists ? prev.filter((i) => i !== id) : [...prev, id]
    );

    if (exists) {
      showToast('Notícia removida dos favoritos');
      if (user) {
        await removeFavoriteFromFirestore(user.uid, id).catch(console.error);
      }
    } else {
      showToast('Notícia salva nos favoritos ⭐');
      if (user) {
        await saveFavoriteInFirestore(
          user.uid,
          'news',
          id,
          item?.title || 'Notícia Gamer',
          item?.imageUrl || item?.image,
          item
        ).catch(console.error);
      }
    }
  };

  const toggleFavoriteDeal = async (id: string, itemData?: GameDeal) => {
    const exists = favoriteDealIds.includes(id);
    const item = itemData || mockDeals.find((d) => d.id === id);

    setFavoriteDealIds((prev) =>
      exists ? prev.filter((i) => i !== id) : [...prev, id]
    );

    if (exists) {
      showToast('Alerta de preço removido');
      if (user) {
        await removeFavoriteFromFirestore(user.uid, id).catch(console.error);
      }
    } else {
      showToast('Alerta de oferta ativado! 🔔');
      if (user) {
        await saveFavoriteInFirestore(
          user.uid,
          'deal',
          id,
          item?.gameTitle || 'Oferta Gamer',
          item?.imageUrl,
          item
        ).catch(console.error);
      }
    }
  };

  const toggleTrackRelease = async (id: string, itemData?: UpcomingRelease) => {
    const exists = trackedReleaseIds.includes(id);
    const item = itemData || mockReleases.find((r) => r.id === id);

    setTrackedReleaseIds((prev) =>
      exists ? prev.filter((i) => i !== id) : [...prev, id]
    );

    if (exists) {
      showToast('Lembrete de lançamento cancelado');
      if (user) {
        await removeFavoriteFromFirestore(user.uid, id).catch(console.error);
      }
    } else {
      showToast('Lembrete de lançamento definido! 🚀');
      if (user) {
        await saveFavoriteInFirestore(
          user.uid,
          'free_game',
          id,
          item?.title || 'Lançamento',
          item?.imageUrl,
          item
        ).catch(console.error);
      }
    }
  };

  const toggleFavoriteCoupon = async (id: string, itemData?: Coupon) => {
    const exists = favoriteCouponIds.includes(id);
    const item = itemData || mockCoupons.find((c) => c.id === id);

    setFavoriteCouponIds((prev) =>
      exists ? prev.filter((i) => i !== id) : [...prev, id]
    );

    if (exists) {
      showToast('Cupom removido dos salvos');
      if (user) {
        await removeFavoriteFromFirestore(user.uid, id).catch(console.error);
      }
    } else {
      showToast('Cupom salvo nos favoritos! 🎟️');
      if (user) {
        await saveFavoriteInFirestore(
          user.uid,
          'coupon',
          id,
          item?.title || 'Cupom de Desconto',
          item?.image || item?.storeLogoUrl,
          item
        ).catch(console.error);
      }
    }
  };

  const clearAllFavorites = () => {
    if (user) {
      favoriteNewsIds.forEach((id) => removeFavoriteFromFirestore(user.uid, id));
      favoriteDealIds.forEach((id) => removeFavoriteFromFirestore(user.uid, id));
      trackedReleaseIds.forEach((id) => removeFavoriteFromFirestore(user.uid, id));
      favoriteCouponIds.forEach((id) => removeFavoriteFromFirestore(user.uid, id));
    }
    setFavoriteNewsIds([]);
    setFavoriteDealIds([]);
    setTrackedReleaseIds([]);
    setFavoriteCouponIds([]);
    showToast('Todos os favoritos foram limpos.');
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    notificationService.markAsRead(id);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllAsRead();
    showToast('Todas as notificações marcadas como lidas');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationService.deleteNotification(id);
    showToast('Notificação removida');
  };

  const clearOldNotifications = async () => {
    const deleted = await notificationService.clearOldNotifications();
    showToast(`${deleted} notificações antigas limpas`);
  };

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 8);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedCategory,
        setSelectedCategory,
        favoriteNewsIds,
        toggleFavoriteNews,
        favoriteDealIds,
        toggleFavoriteDeal,
        trackedReleaseIds,
        toggleTrackRelease,
        favoriteCouponIds,
        toggleFavoriteCoupon,
        clearAllFavorites,
        firestoreFavorites,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearOldNotifications,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        selectedNews,
        setSelectedNews,
        selectedDeal,
        setSelectedDeal,
        selectedCoupon,
        setSelectedCoupon,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
