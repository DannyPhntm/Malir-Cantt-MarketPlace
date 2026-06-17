import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import savedApi from '../services/savedApi';
import { adaptListing } from '../services/listingAdapter';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

// Guest favourites (logged-out) live in localStorage; on login they are merged
// into the user's server-side saved listings, which then become the source of
// truth and persist across sessions/devices.
const GUEST_KEY = 'malir-favorites';

function readGuest() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeGuest(list) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function FavoritesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState(readGuest);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Resolve favourites whenever auth state settles.
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites(readGuest());
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      try {
        // Merge any favourites collected while logged out, then load from server.
        const guest = readGuest();
        if (guest.length) {
          await Promise.allSettled(guest.map((g) => savedApi.add(g.id)));
          writeGuest([]);
        }
        const res = await savedApi.list();
        if (active) setFavorites(res.listings.map(adaptListing));
      } catch {
        /* keep current state on failure */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isAuthenticated, user?.id]);

  // Toggle save state. Optimistic for logged-in users (rolls back on failure);
  // localStorage-backed for guests.
  const toggle = useCallback(
    async (listing) => {
      const exists = favorites.some((f) => f.id === listing.id);
      const next = exists
        ? favorites.filter((f) => f.id !== listing.id)
        : [listing, ...favorites];

      if (!isAuthenticated) {
        setFavorites(next);
        writeGuest(next);
        return;
      }

      const snapshot = favorites;
      setFavorites(next); // optimistic
      try {
        if (exists) await savedApi.remove(listing.id);
        else await savedApi.add(listing.id);
      } catch {
        setFavorites(snapshot); // rollback
      }
    },
    [favorites, isAuthenticated],
  );

  const isFavorited = useCallback((id) => favorites.some((f) => f.id === id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorited, isOpen, setIsOpen, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
