import { useEffect, useState } from "react";
import { fetchUsageInfo } from "@/api/client";

export interface UseUsageInfoResult {
  loading: boolean;
  error: string | null;
  data: unknown;
}

/** Loads usage from the PostHog-backed `/usage-info` API (YTD when nDaysWindow is -1). */
export function useUsageInfo(
  userEmail: string | null | undefined,
  nDaysWindow: number = -1,
): UseUsageInfoResult {
  const [loading, setLoading] = useState(!!userEmail);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUsageInfo(userEmail, nDaysWindow)
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load usage");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userEmail, nDaysWindow]);

  return { loading, error, data };
}
