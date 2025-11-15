// Centralized Analytics Management for Hop On Sintra
// Integrates: Google Analytics 4, Microsoft Clarity, and Vercel Analytics

import { 
  trackEvent as gaTrackEvent,
  trackPurchase as gaTrackPurchase,
  trackBeginCheckout as gaTrackBeginCheckout,
  trackAddToCart as gaTrackAddToCart,
  trackPageView as gaTrackPageView
} from '../components/GoogleAnalytics';

// Analytics configuration
const ANALYTICS_ENABLED = true; // Set to false to disable all tracking

// Page view tracking
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (!ANALYTICS_ENABLED) return;
  
  // Google Analytics
  gaTrackPageView(pagePath, pageTitle);
};

// Booking funnel events
export const analytics = {
  // Step 1: User starts booking flow
  bookingFlowStarted: (source?: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('booking_flow_started', {
      event_category: 'Booking Funnel',
      source: source || 'direct'
    });
  },

  // Step 2: User selects date
  dateSelected: (date: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('date_selected', {
      event_category: 'Booking Funnel',
      date: date
    });
  },

  // Step 3: User adds passengers
  passengersAdded: (count: number) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('passengers_added', {
      event_category: 'Booking Funnel',
      passenger_count: count
    });
  },

  // Step 4: User adds optional items (attractions, guided tour)
  optionalItemAdded: (itemType: string, itemName: string, price: number) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackAddToCart({
      item_id: itemType,
      item_name: itemName,
      price: price
    });
  },

  // Step 5: User begins checkout
  checkoutStarted: (totalValue: number, passengers: number) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackBeginCheckout(totalValue, [{
      item_name: 'Hop On Sintra Day Pass',
      quantity: passengers,
      price: totalValue / passengers
    }]);
  },

  // Step 6: User completes payment
  purchaseCompleted: (bookingId: string, totalValue: number, passengers: number, hasGuidedTour: boolean, attractionCount: number) => {
    if (!ANALYTICS_ENABLED) return;
    
    const items = [
      {
        item_id: 'day-pass',
        item_name: 'Hop On Sintra Day Pass',
        quantity: passengers,
        price: totalValue / passengers
      }
    ];

    gaTrackPurchase(bookingId, totalValue, items);
    
    gaTrackEvent('booking_completed', {
      event_category: 'Conversion',
      booking_id: bookingId,
      value: totalValue,
      passengers: passengers,
      has_guided_tour: hasGuidedTour,
      attraction_tickets: attractionCount
    });
  },

  // Attraction page views
  attractionViewed: (attractionId: string, attractionName: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('attraction_viewed', {
      event_category: 'Engagement',
      attraction_id: attractionId,
      attraction_name: attractionName
    });
  },

  // Attraction ticket purchase
  attractionTicketPurchased: (attractionName: string, price: number) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('attraction_ticket_purchased', {
      event_category: 'Conversion',
      attraction_name: attractionName,
      value: price
    });
  },

  // Live chat interactions
  chatOpened: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('chat_opened', {
      event_category: 'Engagement'
    });
  },

  chatMessageSent: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('chat_message_sent', {
      event_category: 'Engagement'
    });
  },

  whatsappClicked: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('whatsapp_clicked', {
      event_category: 'Engagement'
    });
  },

  // Pickup requests
  pickupRequested: (location: string, bookingId?: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('pickup_requested', {
      event_category: 'Service',
      location: location,
      booking_id: bookingId
    });
  },

  // Language changes
  languageChanged: (fromLang: string, toLang: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('language_changed', {
      event_category: 'Settings',
      from_language: fromLang,
      to_language: toLang
    });
  },

  // Blog interactions
  blogArticleViewed: (articleSlug: string, articleTitle: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('blog_article_viewed', {
      event_category: 'Content',
      article_slug: articleSlug,
      article_title: articleTitle
    });
  },

  // Private tours
  privateToursViewed: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('private_tours_viewed', {
      event_category: 'Engagement'
    });
  },

  privateTourInquiry: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('private_tour_inquiry', {
      event_category: 'Lead'
    });
  },

  // Sunset special
  sunsetSpecialViewed: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('sunset_special_viewed', {
      event_category: 'Engagement'
    });
  },

  sunsetSpecialPurchased: (bookingId: string, price: number, participants: number) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('sunset_special_purchased', {
      event_category: 'Conversion',
      booking_id: bookingId,
      value: price,
      participants: participants
    });
  },

  // User errors
  bookingError: (errorMessage: string, step: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('booking_error', {
      event_category: 'Error',
      error_message: errorMessage,
      booking_step: step
    });
  },

  paymentError: (errorMessage: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('payment_error', {
      event_category: 'Error',
      error_message: errorMessage
    });
  },

  // Booking management
  bookingViewed: (bookingId: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('booking_viewed', {
      event_category: 'Engagement',
      booking_id: bookingId
    });
  },

  ticketDownloaded: (bookingId: string, format: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('ticket_downloaded', {
      event_category: 'Engagement',
      booking_id: bookingId,
      format: format
    });
  },

  // PWA events
  pwaInstalled: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('pwa_installed', {
      event_category: 'PWA'
    });
  },

  pwaPromptShown: () => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('pwa_prompt_shown', {
      event_category: 'PWA'
    });
  },

  // Outbound links
  outboundLinkClicked: (url: string, linkText: string) => {
    if (!ANALYTICS_ENABLED) return;
    gaTrackEvent('outbound_link_clicked', {
      event_category: 'Outbound',
      url: url,
      link_text: linkText
    });
  }
};

export default analytics;
