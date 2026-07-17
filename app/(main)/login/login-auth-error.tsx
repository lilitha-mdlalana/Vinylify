"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  missing_code: "Authorization was cancelled or incomplete. Try signing in again.",
  config: "Server is missing Spotify credentials. Check your environment.",
  no_token: "Spotify did not return a token. Try again.",
  token_exchange: "Could not exchange the code for a token. Check redirect URI and app settings.",
};

export function LoginAuthError() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  if (!code) return null;
  const message = MESSAGES[code] ?? `Something went wrong (${code}).`;
  return (
    <p
      role="alert"
      className="text-destructive text-center text-sm leading-snug"
    >
      {message}
    </p>
  );
}
