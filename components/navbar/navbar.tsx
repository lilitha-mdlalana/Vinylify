"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Menu,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { MeResponse, SpotifyUserProfile } from "@/types/spotify-profile";
import { useCallback, useEffect, useState } from "react";

function VinylMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ea580c] shadow-sm shadow-orange-950/40",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className="size-7 text-zinc-950"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="14" fill="currentColor" />
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="#ea580c"
          strokeOpacity={0.35}
          strokeWidth={0.75}
        />
        <circle
          cx="16"
          cy="16"
          r="7"
          stroke="#ea580c"
          strokeOpacity={0.45}
          strokeWidth={0.5}
        />
        <circle cx="16" cy="16" r="3.25" fill="#ea580c" />
        <circle cx="16" cy="16" r="1.35" fill="currentColor" />
      </svg>
    </div>
  );
}

const navIconButtonClass =
  "size-10 rounded-full border border-white/[0.12] bg-white/[0.06] text-zinc-100 shadow-none hover:bg-white/[0.1] hover:text-white dark:border-white/[0.12] dark:bg-white/[0.06]";

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<SpotifyUserProfile | null | undefined>(
    undefined
  );
  const [mobileOpen, setMobileOpen] = useState(false);

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
    router.refresh();
  }, [router]);

  const authSection =
    user === undefined ? (
      <div
        className="size-10 shrink-0 rounded-full bg-white/[0.08]"
        aria-hidden
      />
    ) : user ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "rounded-full outline-none ring-offset-2 ring-offset-zinc-950 focus-visible:ring-2 focus-visible:ring-orange-500/80"
          )}
        >
          <span className="sr-only">Account menu</span>
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full object-cover ring-2 ring-white/15"
              unoptimized
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.1] ring-2 ring-white/15">
              <UserRound className="size-5 text-zinc-200" aria-hidden />
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium text-foreground">
              {user.displayName ?? "Spotify user"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/player" />}>
            Player
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/account" />}>
            Account
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={logout}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Link
        href="/api/auth/login"
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "h-9 rounded-full border-0 bg-white/[0.12] px-4 text-sm font-medium text-white hover:bg-white/[0.18]"
        )}
      >
        Sign in
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
        >
          <VinylMark />
          <span className="truncate font-heading text-lg font-semibold tracking-tight text-white">
            Vinylify
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="outline"
              size="icon"
              className={navIconButtonClass}
              render={<Link href="/" />}
            >
              <Search className="size-[1.125rem]" />
              <span className="sr-only">Search</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  navIconButtonClass
                )}
              >
                <Settings2 className="size-[1.125rem]" />
                <span className="sr-only">Settings</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={theme ?? "system"}
                  onValueChange={setTheme}
                >
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden sm:block">{authSection}</div>

          <div className="sm:hidden">
            <DropdownMenu open={mobileOpen} onOpenChange={setMobileOpen}>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  navIconButtonClass
                )}
              >
                <Menu className="size-[1.125rem]" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem render={<Link href="/" />}>
                  <Search className="size-4" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/player" />}>
                  Player
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account" />}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings2 className="size-4" />
                    Appearance
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme ?? "system"}
                      onValueChange={setTheme}
                    >
                      <DropdownMenuRadioItem value="light">
                        Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                {user ? (
                  <>
                    <DropdownMenuItem variant="destructive" onClick={logout}>
                      <LogOut className="size-4" />
                      Log out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem render={<Link href="/api/auth/login" />}>
                    Sign in with Spotify
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="sm:hidden">{authSection}</div>
        </div>
      </div>
    </header>
  );
}
