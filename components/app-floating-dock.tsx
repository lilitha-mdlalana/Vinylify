"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconCompass,
  IconDisc,
  IconHome,
  IconUser,
} from "@tabler/icons-react";

const iconCls = "h-full w-full text-neutral-500 dark:text-neutral-300";

const dockItems = [
  {
    title: "Home",
    icon: <IconHome className={iconCls} />,
    href: "/",
  },
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
    title: "Account",
    icon: <IconUser className={iconCls} />,
    href: "/account",
  },
];

export function AppFloatingDock() {
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
