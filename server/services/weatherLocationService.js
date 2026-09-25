const locationCache = new Map();
let nextLookupAt = 0;
let lookupQueue = Promise.resolve();

const lookupLocation = async (name) => {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (locationCache.has(key)) return locationCache.get(key);

  const lookup = lookupQueue.then(async () => {
    const wait = Math.max(0, nextLookupAt - Date.now());
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    nextLookupAt = Date.now() + 1100;

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({ q: name, format: "jsonv2", limit: "1" });
    const response = await fetch(url, {
      headers: { "User-Agent": "CADer-Survey/1.0 (weather location lookup; webaxium.org)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Location lookup failed");
    const place = (await response.json())[0];
    if (!place) {
      locationCache.set(key, null);
      return null;
    }
    const result = {
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      displayName: place.display_name,
      source: "OpenStreetMap",
    };
    locationCache.set(key, result);
    return result;
  });

  lookupQueue = lookup.catch(() => {});
  return lookup;
};

export default lookupLocation;
