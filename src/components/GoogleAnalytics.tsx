import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Only load if measurement ID is provided and valid
    if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize GA4
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    `;
    document.head.appendChild(script2);

    return () => {
      // Cleanup on unmount
      try {
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [measurementId]);

  return null;
}

// Helper function to safely call gtag
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

// Helper functions for tracking events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  gtag('event', eventName, eventParams);
};

// E-commerce event helpers
export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'EUR',
    items: items
  });
};

export const trackBeginCheckout = (value: number, items: any[]) => {
  trackEvent('begin_checkout', {
    value: value,
    currency: 'EUR',
    items: items
  });
};

export const trackAddToCart = (item: any) => {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: item.price,
    items: [item]
  });
};

export const trackViewItem = (item: any) => {
  trackEvent('view_item', {
    currency: 'EUR',
    value: item.price,
    items: [item]
  });
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
};