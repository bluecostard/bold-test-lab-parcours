import { useEffect, useState } from "react";
import { campaigns as seedCampaigns } from "./data.js";
import { listCampaigns } from "./campaignsApi.js";

const CACHE_MS = 45_000;
let cache = { at: 0, list: null, promise: null };

function mergeCatalog(items) {
  const ids = new Set(seedCampaigns.map((item) => item.id));
  return [...seedCampaigns, ...(items || []).filter((item) => item.id && !ids.has(item.id))];
}

/** Une seule requête partagée entre écrans (accueil, explore, app shell…). */
export function prefetchCampaignCatalog(force = false) {
  const fresh = cache.list && Date.now() - cache.at < CACHE_MS;
  if (!force && fresh) return Promise.resolve(cache.list);
  if (!force && cache.promise) return cache.promise;
  cache.promise = listCampaigns()
    .then((items) => {
      cache = { at: Date.now(), list: mergeCatalog(items), promise: null };
      return cache.list;
    })
    .catch(() => {
      cache.promise = null;
      if (cache.list) return cache.list;
      const fallback = mergeCatalog([]);
      cache = { at: Date.now(), list: fallback, promise: null };
      return fallback;
    });
  return cache.promise;
}

export function useCampaignCatalog() {
  const [list, setList] = useState(() => cache.list || seedCampaigns);
  useEffect(() => {
    let cancelled = false;
    prefetchCampaignCatalog()
      .then((next) => { if (!cancelled) setList(next); })
      .catch(() => { if (!cancelled) setList(seedCampaigns); });
    return () => { cancelled = true; };
  }, []);
  return list;
}
