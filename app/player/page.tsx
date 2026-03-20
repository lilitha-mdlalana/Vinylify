import { PlayerShell } from "@/components/player-shell";
import { Suspense } from "react";

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center text-sm">
          Loading player…
        </div>
      }
    >
      <PlayerShell />
    </Suspense>
  );
}
