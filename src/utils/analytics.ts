/**
 * Google Analytics utility for tracking game events and user interactions
 */

// Declare gtag function for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Get GA measurement ID from environment variable
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Track if GA has been initialized
let gaInitialized = false;

/**
 * Initialize Google Analytics
 * This should be called once when the app loads
 */
export const initGA = (): void => {
  // Check if GA is already initialized from HTML snippet
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && typeof window.dataLayer !== 'undefined' && window.dataLayer.length > 0) {
    console.log('[Analytics] Google Analytics already initialized from HTML snippet');
    gaInitialized = true;
    return;
  }
  
  // Only initialize if we have a measurement ID and haven't initialized yet
  if (!GA_MEASUREMENT_ID) {
    console.warn('[Analytics] No GA Measurement ID found. Set VITE_GA_MEASUREMENT_ID in your .env file.');
    return;
  }
  
  if (gaInitialized || typeof window === 'undefined') {
    return;
  }

  console.log('[Analytics] Initializing Google Analytics with ID:', GA_MEASUREMENT_ID);

  // Initialize dataLayer (standard GA4 pattern - MUST be before gtag definition)
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function ONLY if it doesn't exist (standard GA4 pattern)
  // This temporary function queues commands until the GA script loads and replaces it
  if (typeof window.gtag === 'undefined') {
    window.gtag = function(...args: any[]) {
      window.dataLayer.push(args);
    };
  }

  // Configure GA BEFORE script loads (standard GA4 pattern)
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  // Load GA script (standard GA4 pattern)
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.onerror = () => {
    console.error('[Analytics] Failed to load Google Analytics script');
  };
  script.onload = () => {
    console.log('[Analytics] Google Analytics script loaded successfully');
  };
  document.head.appendChild(script);

  // Configure GA using gtag (standard GA4 pattern)
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  gaInitialized = true;
  console.log('[Analytics] Google Analytics initialized');
};

/**
 * Check if Google Analytics is available
 */
export const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         !!GA_MEASUREMENT_ID &&
         gaInitialized;
};

/**
 * Track a page view
 */
export const trackPageView = (path: string): void => {
  if (!isGAAvailable()) {
    console.warn('[Analytics] Cannot track page view - GA not available');
    return;
  }
  
  console.log('[Analytics] Tracking page view:', path);
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
  window.gtag('event', 'page_view', {
    page_path: path,
  });
};

/**
 * Track a custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: {
    [key: string]: string | number | boolean | undefined;
  }
): void => {
  if (!isGAAvailable()) {
    console.warn('[Analytics] Cannot track event - GA not available:', eventName);
    return;
  }
  
  console.log('[Analytics] Tracking event:', eventName, eventParams);
  window.gtag('event', eventName, eventParams);
};

/**
 * Game-specific event tracking functions
 */

// Track when a new game starts
export const trackGameStart = (mode: 'two-player' | 'vs-bot', difficulty?: string): void => {
  trackEvent('game_start', {
    game_mode: mode,
    bot_difficulty: difficulty,
  });
};

// Track when a move is made
export const trackMove = (moveNumber: number, mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('game_move', {
    move_number: moveNumber,
    game_mode: mode,
  });
};

// Track when a cycle is created
export const trackCycleCreated = (moveNumber: number, mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('cycle_created', {
    move_number: moveNumber,
    game_mode: mode,
  });
};

// Track when a cycle is resolved
export const trackCycleResolved = (moveNumber: number, mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('cycle_resolved', {
    move_number: moveNumber,
    game_mode: mode,
  });
};

// Track when a game ends
export const trackGameEnd = (
  mode: 'two-player' | 'vs-bot',
  result: 'win' | 'loss' | 'tie',
  winner?: string,
  moveCount?: number,
  duration?: number
): void => {
  trackEvent('game_end', {
    game_mode: mode,
    result,
    winner,
    move_count: moveCount,
    duration_seconds: duration,
  });
};

// Track when tutorial is opened
export const trackTutorialOpen = (): void => {
  trackEvent('tutorial_open');
};

// Track when AI assistant is opened
export const trackAIAssistantOpen = (mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('ai_assistant_open', {
    game_mode: mode,
  });
};

// Track when AI tip is used
export const trackAITipUsed = (mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('ai_tip_used', {
    game_mode: mode,
  });
};

// Track when undo is used
export const trackUndo = (mode: 'two-player' | 'vs-bot'): void => {
  trackEvent('undo_used', {
    game_mode: mode,
  });
};

// Track when mode is changed
export const trackModeChange = (newMode: 'two-player' | 'vs-bot'): void => {
  trackEvent('mode_change', {
    new_mode: newMode,
  });
};

// Track when difficulty is changed
export const trackDifficultyChange = (difficulty: string): void => {
  trackEvent('difficulty_change', {
    difficulty,
  });
};
