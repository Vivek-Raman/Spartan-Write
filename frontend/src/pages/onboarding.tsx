import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import BrandLogo from "@/components/brand-logo";

export default function Onboarding() {
  const { signIn, getSignInUrl, isLoading, user } = useAuth();
  const [isOpening, setIsOpening] = useState(false);


  const handleSignIn = async () => {
    try {
      setIsOpening(true);
      const url = await getSignInUrl();
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch {
        await signIn();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsOpening(false);
    }
  };

  const busy = isLoading || isOpening;

  if (!busy && user) {
    console.log(`Welcome, ${user.firstName} ${user.lastName}!`);
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <BrandLogo size="lg" />
      <Button onClick={handleSignIn} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </div>
  );
}
