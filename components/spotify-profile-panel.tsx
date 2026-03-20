import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SpotifyProfilePanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "vinyl-player-profile w-full max-w-2xl justify-self-center",
        className
      )}
      aria-label="Player sidebar"
    >
      <Card className="border-foreground/10 bg-card/80 min-h-56 shadow-md backdrop-blur-sm">
        <CardContent className="min-h-48 p-6" />
      </Card>
    </section>
  );
}
