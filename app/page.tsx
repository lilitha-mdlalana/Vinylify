import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  if (cookieStore.get("spotify-token")?.value) redirect("/player");

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Hero */}
      <section className="flex min-h-[75vh] flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="flex flex-col items-center gap-6">
          {/* Vinyl icon */}
          <svg
            viewBox="0 0 40 40"
            className="size-20 drop-shadow-[0_0_24px_rgba(234,88,12,0.6)]"
            aria-hidden
          >
            <circle cx="20" cy="20" r="19" fill="#18181b" stroke="#ea580c" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="13" fill="none" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="20" cy="20" r="8" fill="none" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="20" cy="20" r="3" fill="#ea580c" />
            <circle cx="20" cy="20" r="1.5" fill="#18181b" />
          </svg>

          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              Vinylify
            </h1>
            <p className="max-w-md text-lg text-muted-foreground sm:text-xl">
              Your music. The vinyl way.
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Connect your Spotify and spin records with a premium turntable experience.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-9 gap-1.5 px-2.5 min-w-48 bg-[#ea580c] text-white hover:bg-[#c2410c]"
            >
              Sign in with Spotify
            </Link>
            <p className="text-xs text-muted-foreground">
              Requires Spotify Premium
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-8 text-center font-heading text-2xl font-semibold tracking-tight">
          Everything you need
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="mb-2 text-2xl">🎵</div>
              <CardTitle>Vinyl Aesthetic</CardTitle>
              <CardDescription>
                Spinning record visualization synced frame-by-frame to your music.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="mb-2 text-2xl">🔗</div>
              <CardTitle>Spotify Connect</CardTitle>
              <CardDescription>
                Play from any device and control it right here, no extra setup.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="mb-2 text-2xl">🎨</div>
              <CardTitle>Living Artwork</CardTitle>
              <CardDescription>
                Album art drives the background. Every track, a different atmosphere.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Vinylify — built with Spotify Web API
      </footer>
    </div>
  );
}
