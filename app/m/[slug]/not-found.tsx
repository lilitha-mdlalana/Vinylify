import Link from "next/link";

export default function MixtapeNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#060505] px-6 text-center text-[#f3eee7]">
      <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#ef5222]">
        ✳ Vinylify
      </p>
      <h1
        className="font-display text-4xl"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        This tape was never recorded
      </h1>
      <p className="max-w-sm text-sm text-[#f3eee7]/60">
        The link may be wrong, or the mixtape was erased. Ask the sender for a
        fresh copy.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-[#ef5222] px-6 py-3 text-xs font-bold tracking-[0.18em] uppercase text-[#150803]"
      >
        Make your own
      </Link>
    </main>
  );
}
