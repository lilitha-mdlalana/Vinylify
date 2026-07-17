"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeResponse, SpotifyUserProfile } from "@/types/spotify-profile";
import { Disc3, LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function productLabel(product: string | null) {
  if (!product) return "Unknown";
  if (product === "premium") return "Premium";
  if (product === "free") return "Free";
  return product.charAt(0).toUpperCase() + product.slice(1);
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SpotifyUserProfile | null | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: MeResponse) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  if (user === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Sign in with Spotify to view your account.
        </p>
        <Link
          href="/api/auth/login"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
        >
          Sign in with Spotify
        </Link>
      </div>
    );
  }

  const isPremium = user.product === "premium";

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-5 py-10 sm:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm"
      >
        <Disc3 className="size-4" aria-hidden />
        Back to home
      </Link>

      <div className="bg-card rounded-2xl p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-foreground/10">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <UserRound className="text-muted-foreground size-12" aria-hidden />
              </span>
            )}
          </div>
          <div className="mt-4 min-w-0 flex-1 sm:mt-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {user.displayName ?? "Spotify user"}
            </h1>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isPremium
                  ? "bg-[#ea580c]/15 text-[#c2410c] dark:text-[#fb923c]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {productLabel(user.product)}
            </span>
          </div>
        </div>

        <dl className="mt-8 space-y-4 border-t border-foreground/10 pt-8 text-sm">
          <div>
            <dt className="text-muted-foreground font-medium">Email</dt>
            <dd className="text-foreground mt-0.5 break-all">
              {user.email ?? "Not shared (re-authorize with email scope if missing)"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Username</dt>
            <dd className="text-foreground mt-0.5 font-mono text-xs">{user.id}</dd>
          </div>
          {user.spotifyOpenUrl ? (
            <div>
              <dt className="text-muted-foreground font-medium">Profile</dt>
              <dd className="mt-0.5">
                <a
                  href={user.spotifyOpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  Open on Spotify
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-8 flex flex-col gap-3 border-t border-foreground/10 pt-8 sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" aria-hidden />
            Log out
          </Button>
          <Link
            href="/player"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full sm:inline-flex"
            )}
          >
            Open player
          </Link>
        </div>
      </div>
    </div>
  );
}
