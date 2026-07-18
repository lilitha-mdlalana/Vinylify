"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import type { MeResponse, SpotifyUserProfile } from "@/types/spotify-profile";
import {
  IconDeviceAudioTape,
  IconCompass,
  IconDisc,
  IconUser,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const iconCls = "h-full w-full text-neutral-500 dark:text-neutral-300";

const dockItems = [
  {
    title: "Turntable",
    icon: <IconDisc className={iconCls} />,
    href: "/player",
  },
  {
    title: "Explore",
    icon: <IconCompass className={iconCls} />,
    href: "/player?tab=explore",
  },
  {
    title: "New Mixtape",
    icon: <IconDeviceAudioTape className={iconCls} />,
    href: "/mixtapes/new",
  },
  {
    title: "Account",
    icon: <IconUser className={iconCls} />,
    href: "/account",
  },
];

export function AppFloatingDock() {
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

  const pathname = usePathname();
  if (!user || pathname === "/") return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:justify-center"
      aria-label="Player tabs and navigation"
    >
      <div className="pointer-events-auto">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
}
