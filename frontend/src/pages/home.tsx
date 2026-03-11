import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConfig, health } from "../api/client";

const MAX_RETRIES = 20;
const POLL_INTERVAL = 500;

export default function Home() {
  const [returningUser, setReturningUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectToError, setRedirectToError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const run = async () => {
      let healthOk = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (cancelled) return;
        try {
          const healthRes = await health();
          if (cancelled) return;
          if (healthRes) {
            healthOk = true;
            break;
          }
        } catch (err) {
          console.error(err);
        }
        if (attempt < MAX_RETRIES - 1) {
          await new Promise<void>((r) => {
            timeoutId = setTimeout(r, POLL_INTERVAL);
          });
        }
      }
      if (!healthOk) {
        if (!cancelled) setRedirectToError(true);
        setIsLoading(false);
        return;
      }
      if (cancelled) return;
      try {
        const configRes = await getConfig();
        if (cancelled) return;
        const fullName = configRes.data?.config?.full_name;
        setReturningUser(!!fullName);
      } catch (err) {
        setReturningUser(false);
      }
      setIsLoading(false);
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (redirectToError) {
    return <Navigate to="/error" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!returningUser) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
