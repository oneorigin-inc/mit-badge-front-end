/**
 * Shared TypeScript types and interfaces
 * Central location for all type definitions used across the application
 */

// Metrics from the AI model for token usage and performance
export interface BadgeMetrics {
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Badge suggestion item type
export interface BadgeSuggestion {
  title: string;
  description: string;
  criteria: string;
  image?: string;
  metrics?: BadgeMetrics;
}

// Badge generation result type - API returns array of suggestions
export interface BadgeGenerationResult {
  data: BadgeSuggestion[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
