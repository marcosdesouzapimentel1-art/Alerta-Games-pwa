// Google Analytics Integration & Event Tracking Service for Alerta Game

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Track page view
export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  } else {
    console.log(`[Analytics - PageView]: ${pageName}`);
  }
};

// Track news view
export const trackNewsView = (newsId: string, title: string, category?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_content', {
      content_type: 'news',
      item_id: newsId,
      item_name: title,
      content_category: category || 'General',
    });
  } else {
    console.log(`[Analytics - NewsView]:`, { newsId, title, category });
  }
};

// Track coupon click
export const trackCouponClick = (couponId: string, code: string, store?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_promotion', {
      promotion_id: couponId,
      promotion_name: code,
      creative_name: store || 'Coupon',
    });
  } else {
    console.log(`[Analytics - CouponClick]:`, { couponId, code, store });
  }
};

// Track deal click
export const trackDealClick = (dealId: string, title: string, store?: string, price?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_item', {
      item_list_id: 'deals',
      items: [{ item_id: dealId, item_name: title, item_category: store, price }],
    });
  } else {
    console.log(`[Analytics - DealClick]:`, { dealId, title, store, price });
  }
};

// Track search
export const trackSearch = (searchQuery: string) => {
  if (!searchQuery.trim()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchQuery,
    });
  } else {
    console.log(`[Analytics - Search]: ${searchQuery}`);
  }
};

// Track login
export const trackLogin = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method,
    });
  } else {
    console.log(`[Analytics - Login]: ${method}`);
  }
};

// Track sign up
export const trackSignUp = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  } else {
    console.log(`[Analytics - SignUp]: ${method}`);
  }
};
