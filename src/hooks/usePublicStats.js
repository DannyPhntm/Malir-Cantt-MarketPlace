import { useState, useEffect } from 'react';
import statsApi from '../services/statsApi';

// Fetches public marketplace stats once. Returns null until loaded (callers
// render a placeholder meanwhile). Non-fatal on failure — stays null.
export function usePublicStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    statsApi
      .getPublicStats()
      .then((res) => { if (active) setStats(res.stats); })
      .catch(() => { /* keep null — UI falls back gracefully */ });
    return () => { active = false; };
  }, []);

  return stats;
}

export default usePublicStats;
