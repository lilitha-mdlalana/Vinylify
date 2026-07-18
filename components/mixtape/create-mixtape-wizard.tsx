"use client";

import {
  SideSplitter,
  balancedSplit,
  type SplitterTrack,
} from "@/components/mixtape/side-splitter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Mixtape, MixtapeSide, MixtapeTheme, MixtapeTrack } from "@/types/mixtape";
import {
  CassetteTape,
  Check,
  ChevronLeft,
  Copy,
  Disc3,
  Loader2,
  Music2,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const ACCENT = "#ea580c";

type PlaylistRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  owner: string | null;
};

type Step = "playlist" | "sides" | "details" | "done";

const textareaClass =
  "border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 placeholder:text-muted-foreground min-h-24 resize-y";

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "playlist", label: "Playlist" },
    { id: "sides", label: "Sides" },
    { id: "details", label: "Sleeve" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground/50">—</span>}
          <span
            className={cn(
              i <= activeIndex ? "" : "text-muted-foreground/60"
            )}
            style={i <= activeIndex ? { color: ACCENT } : undefined}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CreateMixtapeWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlaylist = searchParams.get("playlist");

  const [step, setStep] = useState<Step>("playlist");
  const [playlists, setPlaylists] = useState<PlaylistRow[] | null>(null);
  const [selected, setSelected] = useState<PlaylistRow | null>(null);
  const [tracks, setTracks] = useState<SplitterTrack[] | null>(null);
  const [assignments, setAssignments] = useState<MixtapeSide[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<MixtapeTheme>("vinyl");
  const [recipientName, setRecipientName] = useState("");
  const [dedication, setDedication] = useState("");
  const [linerNotes, setLinerNotes] = useState("");

  const [created, setCreated] = useState<Mixtape | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spotify/library/playlists")
      .then((r) => r.json())
      .then((data: { playlists?: PlaylistRow[]; error?: string }) => {
        if (cancelled) return;
        if (data.error || !data.playlists) {
          setError("Could not load your playlists. Try signing in again.");
          return;
        }
        setPlaylists(data.playlists);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your playlists.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const choosePlaylist = useCallback((playlist: PlaylistRow) => {
    setSelected(playlist);
    setTracks(null);
    setError(null);
    setStep("sides");
    setTitle((current) => current || playlist.name);
    fetch(`/api/spotify/playlists/${playlist.id}/tracks`)
      .then(async (r) => {
        const data = (await r.json().catch(() => null)) as {
          tracks?: SplitterTrack[];
          error?: string;
          status?: number;
          message?: string;
        } | null;
        if (data === null) {
          setError(
            `Could not load tracks — the server returned an unreadable response (HTTP ${r.status}). Try restarting the dev server.`
          );
          setStep("playlist");
          return;
        }
        if (data.error || !data.tracks) {
          setError(
            data.status === 403
              ? "Spotify only shares track lists for playlists you own or collaborate on — followed and Spotify-made playlists can't become mixtapes."
              : `Could not load tracks for that playlist${
                  data.status ? ` (Spotify HTTP ${data.status}` : ""
                }${data.message ? `: ${data.message}` : ""}${data.status ? ")" : ""}.`
          );
          setStep("playlist");
          return;
        }
        if (data.tracks.length === 0) {
          setError(
            "That playlist has no playable tracks (local files and podcast episodes are skipped)."
          );
          setStep("playlist");
          return;
        }
        setTracks(data.tracks);
        setAssignments(balancedSplit(data.tracks));
      })
      .catch(() => {
        setError("Network error loading tracks for that playlist.");
        setStep("playlist");
      });
  }, []);

  // Auto-select from ?playlist= once playlists load
  useEffect(() => {
    if (preselectedPlaylist && playlists && !selected) {
      const match = playlists.find((p) => p.id === preselectedPlaylist);
      if (match) {
        choosePlaylist(match);
      }
    }
  }, [preselectedPlaylist, playlists, selected, choosePlaylist]);

  const sideCounts = useMemo(() => {
    const a = assignments.filter((s) => s === "A").length;
    return { a, b: assignments.length - a };
  }, [assignments]);

  const publish = useCallback(async () => {
    if (!selected || !tracks) return;
    setBusy(true);
    setError(null);

    const positions: Record<MixtapeSide, number> = { A: 0, B: 0 };
    const payloadTracks: MixtapeTrack[] = tracks.map((t, i) => {
      const side = assignments[i];
      return { ...t, side, position: positions[side]++ };
    });

    try {
      const res = await fetch("/api/mixtapes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: selected.id,
          title: title.trim(),
          theme,
          recipientName: recipientName.trim() || null,
          dedication: dedication.trim() || null,
          linerNotes: linerNotes.trim() || null,
          tracks: payloadTracks,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        mixtape?: Mixtape;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.mixtape) {
        setError(data.message ?? "Could not publish the mixtape. Try again.");
        return;
      }
      setCreated(data.mixtape);
      setStep("done");
    } catch {
      setError("Network error publishing the mixtape.");
    } finally {
      setBusy(false);
    }
  }, [selected, tracks, assignments, title, theme, recipientName, dedication, linerNotes]);

  const shareUrl = created
    ? `${window.location.origin}/m/${created.slug}`
    : "";

  const copyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [shareUrl]);

  return (
    <div className="scrollbar-hide mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 pb-24 sm:px-8">
      <div>
        <p
          className="mb-1 text-[0.65rem] font-semibold tracking-[0.2em] uppercase"
          style={{ color: ACCENT }}
        >
          Digital Mixtapes
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {step === "done" ? "Tape pressed" : "Make a mixtape"}
        </h1>
        {step !== "done" && (
          <div className="mt-3">
            <StepIndicator step={step} />
          </div>
        )}
      </div>

      {error && (
        <p
          className="text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}

      {step === "playlist" && (
        <section>
          <p className="text-muted-foreground mb-6 text-sm">
            Pick the playlist this tape wraps. Vinylify snapshots the tracks —
            the playlist itself is never changed.
          </p>
          {playlists === null ? (
            <p className="text-muted-foreground text-sm">Loading playlists…</p>
          ) : playlists.length === 0 ? (
            <p className="text-muted-foreground text-sm">No playlists found.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choosePlaylist(p)}
                    className="bg-card/80 hover:bg-card/95 flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 ring-foreground/10 transition-colors"
                  >
                    <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Music2 className="text-muted-foreground size-6" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading truncate text-lg font-semibold">
                        {p.name}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {[
                          p.trackCount ? `${p.trackCount} tracks` : null,
                          p.owner,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === "sides" && selected && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("playlist")}
            >
              <ChevronLeft className="size-4" aria-hidden />
              {selected.name}
            </Button>
          </div>
          {tracks === null ? (
            <p className="text-muted-foreground text-sm">Loading tracks…</p>
          ) : (
            <>
              <SideSplitter
                tracks={tracks}
                assignments={assignments}
                onChange={setAssignments}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="rounded-full bg-[#ea580c] text-zinc-950 hover:bg-[#f97316]"
                  disabled={sideCounts.a === 0 || sideCounts.b === 0}
                  onClick={() => setStep("details")}
                >
                  Design the sleeve
                </Button>
              </div>
              {(sideCounts.a === 0 || sideCounts.b === 0) && (
                <p className="text-muted-foreground -mt-4 text-right text-xs">
                  Both sides need at least one track.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {step === "details" && selected && (
        <section className="flex flex-col gap-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setStep("sides")}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to sides
          </Button>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mixtape-title">Title</Label>
            <Input
              id="mixtape-title"
              value={title}
              maxLength={80}
              placeholder="Late Night Drives Vol. II"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Skin</Label>
            <div className="flex gap-3">
              {(
                [
                  { id: "vinyl", label: "Vinyl", icon: Disc3 },
                  { id: "cassette", label: "CassetteTape", icon: CassetteTape },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={theme === option.id}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-2xl p-5 ring-1 transition-colors",
                    theme === option.id
                      ? "bg-card ring-2 ring-[#ea580c]"
                      : "bg-card/60 ring-foreground/10 hover:bg-card/80"
                  )}
                >
                  <option.icon
                    className="size-8"
                    style={theme === option.id ? { color: ACCENT } : undefined}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mixtape-recipient">For (optional)</Label>
            <Input
              id="mixtape-recipient"
              value={recipientName}
              maxLength={80}
              placeholder="Who is this tape for?"
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mixtape-dedication">Dedication (optional)</Label>
            <textarea
              id="mixtape-dedication"
              value={dedication}
              maxLength={280}
              placeholder="A short note on the sleeve…"
              onChange={(e) => setDedication(e.target.value)}
              className={cn(textareaClass, "min-h-16")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mixtape-liner">Liner notes (optional)</Label>
            <textarea
              id="mixtape-liner"
              value={linerNotes}
              maxLength={2000}
              placeholder="The long version — why these songs, in this order."
              onChange={(e) => setLinerNotes(e.target.value)}
              className={textareaClass}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full bg-[#ea580c] text-zinc-950 hover:bg-[#f97316]"
              disabled={busy || title.trim().length === 0}
              onClick={publish}
            >
              {busy ? (
                <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
              ) : null}
              Press the tape
            </Button>
          </div>
        </section>
      )}

      {step === "done" && created && (
        <section className="bg-card/80 flex flex-col items-center gap-6 rounded-2xl p-8 text-center ring-1 ring-foreground/10">
          <div className="bg-muted relative size-40 overflow-hidden rounded-2xl">
            {created.coverUrl ? (
              <Image
                src={created.coverUrl}
                alt=""
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Disc3 className="text-muted-foreground size-12" aria-hidden />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold">{created.title}</h2>
            {created.recipientName && (
              <p className="text-muted-foreground mt-1 text-sm">
                for {created.recipientName}
              </p>
            )}
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <Input readOnly value={shareUrl} className="text-xs" />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={copyShareUrl}
              aria-label="Copy share link"
            >
              {copied ? (
                <Check className="size-4" style={{ color: ACCENT }} aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              className="rounded-full bg-[#ea580c] text-zinc-950 hover:bg-[#f97316]"
              onClick={() => router.push(`/m/${created.slug}`)}
            >
              Open the mixtape
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setCreated(null);
                setSelected(null);
                setTracks(null);
                setTitle("");
                setRecipientName("");
                setDedication("");
                setLinerNotes("");
                setStep("playlist");
              }}
            >
              Make another
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
