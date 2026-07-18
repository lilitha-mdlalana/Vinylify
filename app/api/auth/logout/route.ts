import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
  SESSION_COOKIES,
} from "@/lib/spotify-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  for (const name of [
    ...SESSION_COOKIES,
    OAUTH_STATE_COOKIE,
    RETURN_TO_COOKIE,
  ]) {
    cookieStore.delete(name);
  }
  return NextResponse.json({ ok: true });
}
