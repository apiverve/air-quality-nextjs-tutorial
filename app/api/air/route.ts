import { callApi, fail, fromCache, guard, respond, str, toCache } from '@/lib/apiverve';

// Air quality readings update through the day; 15 minutes keeps them fresh without spending credits on every view.
const TTL_MS = 15 * 60_000;

/** GET /api/air?city=London or /api/air?zip=10001: particulate readings and a health note. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input = str(params.get('city') || params.get('zip'), 80);
  if (!input) return fail('Enter a city or US ZIP code');
  // Five digits is a US ZIP code; anything else is a city name.
  const query: Record<string, string> = /^\d{5}$/.test(input) ? { zip: input } : { city: input };
  query.aqi = 'true'; // paid plans also get the official AQI and category

  const key = `air:${input.toLowerCase()}`;
  const hit = fromCache(key, TTL_MS);
  if (hit) return Response.json(hit);

  const blocked = guard(request);
  if (blocked) return blocked;

  return respond(async () => {
    const data = await callApi('airquality', { query });
    toCache(key, data);
    return data;
  });
}
