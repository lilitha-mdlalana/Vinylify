"use client";

import { ExploreLibrary } from "@/components/explore-library";
import { PlaybackDeckProvider } from "@/components/playback-deck-context";
import VinylRecord from "@/components/VinylRecord/VinylRecord";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export function PlayerShell() {
  const searchParams = useSearchParams();
  const activeTab =
    searchParams.get("tab") === "explore" ? "explore" : "deck";

  return (
    <main className="relative min-h-0 flex-1 ">
      <PlaybackDeckProvider>
        <div
          className={cn(
            "absolute inset-0 flex flex-col overflow-auto",
            activeTab === "deck" ? "z-[2]" : "z-[1]",
            activeTab !== "deck" &&
              "pointer-events-none invisible opacity-0"
          )}
          aria-hidden={activeTab !== "deck"}
        >
          <VinylRecord />
        </div>
        <div
          className={cn(
            "bg-background absolute inset-0 flex min-h-0 flex-col overflow-auto",
            activeTab === "explore" ? "z-[2]" : "z-[1]",
            activeTab !== "explore" &&
              "pointer-events-none invisible opacity-0"
          )}
          aria-hidden={activeTab !== "explore"}
        >
          <ExploreLibrary className="min-h-0 flex-1" />
        </div>
      </PlaybackDeckProvider>
    </main>
  );
}
