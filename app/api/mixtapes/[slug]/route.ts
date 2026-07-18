import { deleteMixtape, getMixtapeBySlug } from "@/lib/mixtapes";
import { fetchSpotifyMe } from "@/lib/spotify-me";
import { getSpotifyAccessToken } from "@/lib/spotify-token";
import { NextRequest, NextResponse } from "next/server";

/** Public — the share page consumes this shape. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const mixtape = await getMixtapeBySlug(slug);
    if (!mixtape) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ mixtape });
  } catch (error) {
    console.error("getMixtapeBySlug failed:", error);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const me = await fetchSpotifyMe(token);
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const mixtape = await getMixtapeBySlug(slug);
    if (!mixtape) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const deleted = await deleteMixtape(mixtape.id, me.id);
    if (!deleted) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("deleteMixtape failed:", error);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }
}
