/**
 * Spotify Web API fetch with 429 handling: honors Retry-After, else exponential backoff.
 */

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const MAX_ATTEMPTS = 5;
const MAX_DELAY_MS = 60_000;

export async function spotifyFetchWithBackoff(
  accessToken: string,
  url: string,
  init: RequestInit
): Promise<Response> {
  let attempt = 0;
  let lastResponse!: Response;

  while (attempt < MAX_ATTEMPTS) {
    lastResponse = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
    });

    if (lastResponse.status !== 429) {
      return lastResponse;
    }

    const retryAfter = lastResponse.headers.get("Retry-After");
    let delayMs: number;
    if (retryAfter) {
      const sec = Number.parseInt(retryAfter, 10);
      delayMs = Number.isFinite(sec)
        ? Math.min(sec * 1000, MAX_DELAY_MS)
        : Math.min(1000 * 2 ** attempt, MAX_DELAY_MS);
    } else {
      delayMs = Math.min(1000 * 2 ** attempt, MAX_DELAY_MS);
    }

    await sleep(delayMs);
    attempt++;
  }

  return lastResponse;
}
