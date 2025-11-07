/**
 * Centralized Error Handling Utility
 * Provides consistent error handling, logging, and user-friendly messages
 */

export type ErrorCategory = 'network' | 'validation' | 'ai' | 'database' | 'authentication' | 'unknown';

export interface ErrorContext {
  userId?: string;
  functionName?: string;
  additionalData?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public userMessage: string,
    public context?: ErrorContext,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Categorizes errors based on their type
 */
function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }
  if (error instanceof Error) {
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'authentication';
    }
    if (error.message.includes('database') || error.message.includes('supabase')) {
      return 'database';
    }
    if (error.message.includes('AI') || error.message.includes('gateway')) {
      return 'ai';
    }
  }
  return 'unknown';
}

/**
 * Generates user-friendly error messages
 */
function getUserMessage(category: ErrorCategory, originalMessage?: string): string {
  const messages: Record<ErrorCategory, string> = {
    network: 'Connection issue. Please check your internet and try again.',
    validation: 'Invalid input. Please check your data and try again.',
    ai: 'AI service temporarily unavailable. Please try again in a moment.',
    database: 'Data service error. Please try again or contact support if it persists.',
    authentication: 'Authentication required. Please sign in again.',
    unknown: 'An unexpected error occurred. Please try again or contact support.',
  };

  return messages[category] || messages.unknown;
}

/**
 * Main error handler - categorizes, logs, and returns user-friendly errors
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): AppError {
  const category = categorizeError(error);
  const originalMessage = error instanceof Error ? error.message : String(error);
  const userMessage = getUserMessage(category, originalMessage);

  const appError = new AppError(
    originalMessage,
    category,
    userMessage,
    context,
    error
  );

  // Log error (in production, this would send to error tracking service)
  console.error('[Error Handler]', {
    category,
    message: originalMessage,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return appError;
}

/**
 * Handles errors with retry logic for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = handleError(error, context);

      // Don't retry on validation or authentication errors
      if (appError.category === 'validation' || appError.category === 'authentication') {
        throw appError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw handleError(lastError, context);
}

/**
 * Error boundary helper for React components
 */
export function getErrorBoundaryFallback(error: AppError) {
  return {
    title: 'Something went wrong',
    message: error.userMessage,
    action: 'Try Again',
  };
}

