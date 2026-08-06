import { useState, useCallback, useRef } from "react";

interface CreditBalance {
  available_credits: number;
  total_purchased: number;
  total_used: number;
  total_refunded: number;
  usage_percentage: number;
  is_low_balance: boolean;
  is_critical_balance: boolean;
  last_updated: string;
  last_used_at: string | null;
  last_purchased_at: string | null;
}

interface CreditTransaction {
  transaction_id: string;
  organization_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  payment_id?: string;
  api_request_id?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface PaymentSummary {
  payment_id: string;
  amount_usd: number;
  credits_purchased: number;
  credit_rate: number;
  currency: string;
  status: string;
  payment_method?: string;
  is_processed: boolean;
  created_at: string;
  processed_at?: string;
}

interface UseLazyCreditDataReturn {
  // Credit Balance (lazy loaded)
  creditBalance: CreditBalance | null;
  creditBalanceLoading: boolean;
  creditBalanceError: string | null;
  loadCreditBalance: () => Promise<void>;

  // Purchase History (lazy loaded)
  purchaseHistory: PaymentSummary[];
  purchaseHistoryLoading: boolean;
  purchaseHistoryError: string | null;
  loadPurchaseHistory: () => Promise<void>;

  // Credit History (lazy loaded)
  creditHistory: CreditTransaction[];
  creditHistoryLoading: boolean;
  creditHistoryError: string | null;
  loadCreditHistory: () => Promise<void>;

  // General
  refreshCreditBalance: () => Promise<void>;
  lastUpdated: Date | null;
}

const CACHE_DURATION = 30000; // 30 seconds
const STALE_WHILE_REVALIDATE = 60000; // 1 minute

export function useLazyCreditData(): UseLazyCreditDataReturn {
  // Credit Balance (lazy loaded)
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null
  );
  const [creditBalanceLoading, setCreditBalanceLoading] = useState(false);
  const [creditBalanceError, setCreditBalanceError] = useState<string | null>(
    null
  );
  const [creditBalanceLoaded, setCreditBalanceLoaded] = useState(false);

  // Purchase History (lazy load)
  const [purchaseHistory, setPurchaseHistory] = useState<PaymentSummary[]>([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
  const [purchaseHistoryError, setPurchaseHistoryError] = useState<
    string | null
  >(null);
  const [purchaseHistoryLoaded, setPurchaseHistoryLoaded] = useState(false);

  // Credit History (lazy load)
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);
  const [creditHistoryError, setCreditHistoryError] = useState<string | null>(
    null
  );
  const [creditHistoryLoaded, setCreditHistoryLoaded] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheRef = useRef<{
    creditBalance: { data: CreditBalance | null; timestamp: number };
    purchaseHistory: { data: PaymentSummary[]; timestamp: number };
    creditHistory: { data: CreditTransaction[]; timestamp: number };
  }>({
    creditBalance: { data: null, timestamp: 0 },
    purchaseHistory: { data: [], timestamp: 0 },
    creditHistory: { data: [], timestamp: 0 },
  });

  const isStale = (timestamp: number) => {
    return Date.now() - timestamp > CACHE_DURATION;
  };

  const isExpired = (timestamp: number) => {
    return Date.now() - timestamp > STALE_WHILE_REVALIDATE;
  };

  const fetchWithCache = useCallback(
    async <T>(
      url: string,
      cacheKey: keyof typeof cacheRef.current,
      setter: (data: T) => void,
      setLoading: (loading: boolean) => void,
      setError: (error: string | null) => void
    ): Promise<T> => {
      const cached = cacheRef.current[cacheKey];
      const now = Date.now();

      // Return cached data if it's fresh
      if (cached.data && !isStale(cached.timestamp)) {
        setter(cached.data as T);
        setLoading(false);
        setError(null);
        return cached.data as T;
      }

      // If data is stale but not expired, return cached data and fetch in background
      if (cached.data && !isExpired(cached.timestamp)) {
        setter(cached.data as T);
        setLoading(false);
        setError(null);

        // Fetch in background
        fetch(url, {
          credentials: "include",
          cache: "no-cache",
        })
          .then((res) => res.json())
          .then((responseData) => {
            if (responseData && !responseData.detail) {
              // Extract data array from response structure
              let data;
              if (responseData.data) {
                // If response has data field, use it
                data = responseData.data;
              } else if (responseData.transactions) {
                // If response has transactions field (purchase/credit history), use it
                data = responseData.transactions;
              } else {
                // Fallback to the response itself
                data = responseData;
              }

              cacheRef.current[cacheKey] = { data, timestamp: now };
              setter(data);
              setLastUpdated(new Date());
            }
          })
          .catch(() => {}); // Silent fail for background refresh

        return cached.data as T;
      }

      // Fetch fresh data
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          credentials: "include",
          cache: "no-cache",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP Error for ${cacheKey}:`, {
            status: response.status,
            statusText: response.statusText,
            url: url,
            error: errorText,
            headers: Object.fromEntries(response.headers.entries()),
          });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();

        if (responseData && !responseData.detail) {
          // Extract data array from response structure
          let data;
          if (responseData.data) {
            // If response has data field, use it
            data = responseData.data;
          } else if (responseData.transactions) {
            // If response has transactions field (purchase/credit history), use it
            data = responseData.transactions;
          } else {
            // Fallback to the response itself
            data = responseData;
          }

          cacheRef.current[cacheKey] = { data, timestamp: now };
          setter(data as T);
          setLastUpdated(new Date());
          return data as T;
        }

        throw new Error("Invalid data received");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
        console.error(`Error fetching ${cacheKey}:`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Lazy load credit balance
  const loadCreditBalance = useCallback(async () => {
    if (creditBalanceLoaded) return;

    try {
      await fetchWithCache<CreditBalance>(
        "/api/credits/balance",
        "creditBalance",
        setCreditBalance,
        setCreditBalanceLoading,
        setCreditBalanceError
      );
      setCreditBalanceLoaded(true);
    } catch (err) {
      setCreditBalanceError(
        err instanceof Error ? err.message : "Failed to load credit balance"
      );
    }
  }, [creditBalanceLoaded, fetchWithCache]);

  // Lazy load purchase history
  const loadPurchaseHistory = useCallback(async () => {
    if (purchaseHistoryLoaded) return;

    try {
      await fetchWithCache<PaymentSummary[]>(
        "/api/credits/purchase-history",
        "purchaseHistory",
        setPurchaseHistory,
        setPurchaseHistoryLoading,
        setPurchaseHistoryError
      );
      setPurchaseHistoryLoaded(true);
    } catch (err) {
      setPurchaseHistoryError(
        err instanceof Error ? err.message : "Failed to load purchase history"
      );
    }
  }, [purchaseHistoryLoaded, fetchWithCache]);

  // Lazy load credit history
  const loadCreditHistory = useCallback(async () => {
    if (creditHistoryLoaded) return;

    try {
      await fetchWithCache<CreditTransaction[]>(
        "/api/credits/history",
        "creditHistory",
        setCreditHistory,
        setCreditHistoryLoading,
        setCreditHistoryError
      );
      setCreditHistoryLoaded(true);
    } catch (err) {
      setCreditHistoryError(
        err instanceof Error ? err.message : "Failed to load credit history"
      );
    }
  }, [creditHistoryLoaded, fetchWithCache]);

  // Refresh credit balance only
  const refreshCreditBalance = useCallback(async () => {
    // Clear cache for credit balance
    cacheRef.current.creditBalance = { data: null, timestamp: 0 };
    setCreditBalanceLoaded(false);
    await loadCreditBalance();
  }, [loadCreditBalance]);

  return {
    // Credit Balance
    creditBalance,
    creditBalanceLoading,
    creditBalanceError,
    loadCreditBalance,

    // Purchase History
    purchaseHistory,
    purchaseHistoryLoading,
    purchaseHistoryError,
    loadPurchaseHistory,

    // Credit History
    creditHistory,
    creditHistoryLoading,
    creditHistoryError,
    loadCreditHistory,

    // General
    refreshCreditBalance,
    lastUpdated,
  };
}
