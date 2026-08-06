/**
 * React hooks for API queries with loading and error states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, ApiErrorHandler } from '../api/error-handler';

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for GET requests with loading and error states
 */
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const { enabled = true, refetchInterval, onSuccess, onError } = options;

  const isMounted = useRef(true);
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();

      if (isMounted.current) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }
    } catch (err) {
      if (isMounted.current) {
        const apiError = ApiErrorHandler.parseError(err);
        setError(apiError);
        setLoading(false);
        onError?.(apiError);
      }
    }
  }, [queryFn, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    isMounted.current = true;

    fetchData();

    // Setup refetch interval if specified
    if (refetchInterval && refetchInterval > 0) {
      refetchTimeoutRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      isMounted.current = false;
      if (refetchTimeoutRef.current) {
        clearInterval(refetchTimeoutRef.current);
      }
    };
  }, [fetchData, refetchInterval]);

  return { data, loading, error, refetch, reset };
}

/**
 * Hook for mutations (POST, PUT, DELETE) with loading and error states
 */
export function useApiMutation<T, Args extends unknown[] = unknown[]>(
  mutationFn: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    onSettled?: () => void;
  } = {}
): MutationState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { onSuccess, onError, onSettled } = options;

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(...args);
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        onSettled?.();
        return result;
      } catch (err) {
        const apiError = ApiErrorHandler.parseError(err);
        setError(apiError);
        setLoading(false);
        onError?.(apiError);
        onSettled?.();
        return null;
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticMutation<T, Args extends unknown[] = unknown[]>(
  mutationFn: (...args: Args) => Promise<T>,
  options: {
    optimisticUpdate?: (args: Args) => T;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError, rollback: () => void) => void;
  } = {}
): MutationState<T> & { rollback: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const previousDataRef = useRef<T | null>(null);

  const { optimisticUpdate, onSuccess, onError } = options;

  const rollback = useCallback(() => {
    setData(previousDataRef.current);
    setError(null);
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      // Save previous data for rollback
      previousDataRef.current = data;

      // Apply optimistic update immediately
      if (optimisticUpdate) {
        const optimisticData = optimisticUpdate(args);
        setData(optimisticData);
      }

      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(...args);
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError = ApiErrorHandler.parseError(err);
        setError(apiError);
        setLoading(false);
        onError?.(apiError, rollback);
        return null;
      }
    },
    [data, mutationFn, optimisticUpdate, onSuccess, onError, rollback]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    previousDataRef.current = null;
  }, []);

  return { data, loading, error, execute, reset, rollback };
}

/**
 * Hook for debounced API calls
 */
export function useDebouncedApiCall<T, Args extends unknown[] = unknown[]>(
  apiFn: (...args: Args) => Promise<T>,
  delay: number = 500
): {
  call: (...args: Args) => void;
  cancel: () => void;
  loading: boolean;
  data: T | null;
  error: ApiError | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const call = useCallback(
    (...args: Args) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setLoading(true);

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await apiFn(...args);
          setData(result);
          setError(null);
        } catch (err) {
          setError(ApiErrorHandler.parseError(err));
        } finally {
          setLoading(false);
        }
      }, delay);
    },
    [apiFn, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { call, cancel, loading, data, error };
}
