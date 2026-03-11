import { WORKOS_CLIENT_ID } from "@/api/auth-keys";

export const WORKOS_REFRESH_TOKEN_KEY = "workos:refresh-token";

export function getWorkosRefreshToken(): string | null {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(WORKOS_REFRESH_TOKEN_KEY)
    : null;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; user: unknown }> {
  const res = await fetch("https://api.workos.com/user_management/authenticate", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: WORKOS_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? "Code exchange failed");
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };
}
