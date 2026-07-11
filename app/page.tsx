import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import "./home.css";

function Starburst({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="-110 -110 220 220" xmlns="http://www.w3.org/2000/svg">
        <g fill="currentColor">
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x="-11"
              y="-102"
              width="22"
              height="86"
              rx="11"
              transform={`rotate(${i * 45})`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default async function Page() {
  const cookieStore = await cookies();
  if (cookieStore.get("spotify-token")?.value) redirect("/player");

  return (
    <main className="home-stage">
      <Starburst className="home-burst home-burst-right" />
      <Starburst className="home-burst home-burst-left" />

      <section className="home-grid">
        <p className="home-eyebrow home-rise" style={{ "--rise-delay": "0s" } as React.CSSProperties}>
          <span className="home-eyebrow-mark">✳</span>
          <span>Vinylify</span>
          <span className="home-eyebrow-thin">A turntable for Spotify</span>
        </p>

        <h1
          className="home-title home-rise"
          style={{ "--rise-delay": "0.1s" } as React.CSSProperties}
        >
          Drop
          <br />
          the
          <br />
          <em>Needle</em>
        </h1>

        <div
          className="home-col home-rise"
          style={{ "--rise-delay": "0.2s" } as React.CSSProperties}
        >
          <h2>The Deck</h2>
          <p>
            A real deck, not a skin. Drag the record backwards to rewind. Lift
            the tonearm off the groove and the music stops — set it back down
            and it plays. Your whole Spotify library, pressed to wax.
          </p>
        </div>

        <div
          className="home-col home-rise"
          style={{ "--rise-delay": "0.3s" } as React.CSSProperties}
        >
          <h2>Overview</h2>
          <p>
            Vinylify turns streaming back into a ritual. Pick an album, set it
            spinning, and listen the way records were meant to be heard — one
            side at a time, artwork first.
          </p>
          <div className="home-cta-row">
            <Link href="/login" className="home-cta">
              Sign in with Spotify
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8h11M9 3.5 13.5 8 9 12.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <span className="home-cta-note">Requires Spotify Premium</span>
          </div>
        </div>

        <div
          className="home-col home-rise"
          style={{ "--rise-delay": "0.4s" } as React.CSSProperties}
        >
          <h2>Living Artwork</h2>
          <p>
            The album does the decorating. Cover art is pressed into the
            record label, and its palette bleeds out into the backdrop — every
            track changes the light in the room.
          </p>
        </div>
      </section>

      <footer
        className="home-footer home-rise"
        style={{ "--rise-delay": "0.5s" } as React.CSSProperties}
      >
        <span>Vinylify © 2026 — Pressed with the Spotify Web API</span>
        <span>33⅓ RPM</span>
      </footer>
    </main>
  );
}
