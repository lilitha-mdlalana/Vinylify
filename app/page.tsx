import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Vinylify
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Sign in with Spotify to open the player. Your profile comes from the
          Web API (<code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/me</code>
          ), same as Spotify&apos;s profile how-to.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button render={<Link href="/login" />} size="lg" className="min-w-40">
            Sign in
          </Button>
          <p className="text-muted-foreground text-xs">
            Press <kbd className="rounded border px-1">d</kbd> to toggle theme
          </p>
        </div>
      </div>
    </div>
  );
}
