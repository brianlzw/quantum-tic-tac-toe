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
  // Only initialize if we have a measurement ID and haven't initialized yet
  if (!GA_MEASUREMENT_ID || gaInitialized || typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Configure GA
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  gaInitialized = true;
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
  if (!isGAAvailable()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
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
  if (!isGAAvailable()) return;
  
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

