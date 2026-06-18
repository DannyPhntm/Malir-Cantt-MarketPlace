import { useState, useEffect } from 'react';
import statsApi from '../services/statsApi';

// Fetches public marketplace stats. Returns null until loaded (callers render a
// placeholder meanwhile). Non-fatal on failure — stays null.
//
// Public stats are identical for every visitor and appear in the global Footer
// plus several pages (Home, About). Without coordination each mount fired its
// own request — Home + Footer = two identical calls per home load, and one more
// on every navigation. We cache the first successful result at module scope and
// share the in-flight promise, so concurrent mounts make a single request and
// later mounts reuse the cached value.
let cachedStats = null;
let inFlight = null;

function loadStats() {
  if (cachedStats) return Promise.resolve(cachedStats);
  if (inFlight) return inFlight;
  inFlight = statsApi
    .getPublicStats()
    .then((res) => {
      cachedStats = res.stats;
      inFlight = null;
      return cachedStats;
    })
    .catch((err) => {
      // Allow a later retry; don't cache the failure.
      inFlight = null;
      throw err;
    });
  return inFlight;
}

export function usePublicStats() {
  const [stats, setStats] = useState(cachedStats);

  useEffect(() => {
    if (cachedStats) return; // already have it — no request
    let active = true;
    loadStats()
      .then((res) => { if (active) setStats(res); })
      .catch(() => { /* keep null — UI falls back gracefully */ });
    return () => { active = false; };
  }, []);

  return stats;
}

export default usePublicStats;
