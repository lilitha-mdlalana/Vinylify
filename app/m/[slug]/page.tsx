import { MixtapePlayerShell } from "@/components/mixtape/mixtape-player-shell";
import { getMixtapeBySlug } from "@/lib/mixtapes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mixtape = await getMixtapeBySlug(slug).catch(() => null);
  if (!mixtape) {
    return { title: "Mixtape not found — Vinylify" };
  }
  const title = mixtape.recipientName
    ? `${mixtape.title} — a mixtape for ${mixtape.recipientName}`
    : `${mixtape.title} — a Vinylify mixtape`;
  return {
    title,
    description:
      mixtape.dedication ??
      "Someone pressed you a mixtape. Open it on Vinylify.",
    openGraph: {
      title,
      description:
        mixtape.dedication ?? "Someone pressed you a mixtape on Vinylify.",
      ...(mixtape.coverUrl ? { images: [{ url: mixtape.coverUrl }] } : {}),
    },
  };
}

export default async function MixtapePage({ params }: Props) {
  const { slug } = await params;
  const mixtape = await getMixtapeBySlug(slug).catch((error) => {
    console.error("Share page fetch failed:", error);
    return null;
  });

  if (!mixtape) {
    notFound();
  }

  return <MixtapePlayerShell mixtape={mixtape} />;
}
