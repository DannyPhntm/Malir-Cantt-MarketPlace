import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import listingsApi from '../services/listingsApi';
import { adaptListing, adaptListings } from '../services/listingAdapter';
import { useAuth } from './AuthContext';

const ListingsContext = createContext(null);

export function ListingsProvider({ children }) {
  const { user } = useAuth();
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Public browse data = approved listings only (mirrors the moderation model).
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.list({ status: 'approved' });
      setAllListings(adaptListings(res.listings));
    } catch (err) {
      setError(err?.message || 'Could not load listings.');
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load listings from the backend on mount
    refresh();
  }, [refresh]);

  // Fetch a single listing by id (any status — so an owner can view their own
  // pending listing right after posting). Returns the adapted listing.
  const getListing = useCallback(async (id) => {
    const res = await listingsApi.get(id);
    return adaptListing(res.listing);
  }, []);

  // Create a listing via the API. Maps the form payload to the backend shape;
  // returns the adapted created listing (status 'pending' until admin approval).
  const addListing = useCallback(
    async (data) => {
      if (!user?.id) throw new Error('You must be signed in to post a listing.');

      // Multipart: real File objects are uploaded (no client-side canvas/base64).
      const fd = new FormData();
      fd.append('title', data.title || '');
      fd.append('description', data.description || '');
      fd.append('category', data.categorySlug || '');
      if (data.subcategory) fd.append('subcategory', data.subcategory);
      fd.append('postingType', data.postingType || 'personal');
      fd.append('price', String(data.priceRaw ?? 0));
      fd.append('featuredRequested', String(!!data.featuredRequested));
      fd.append('details', JSON.stringify(data.details || {}));
      (data.files || []).forEach((file) => fd.append('images', file));

      if (import.meta.env?.DEV) {
        // Safe diagnostics: field names + value types only (no values/secrets).
        const shape = [];
        for (const [k, v] of fd.entries()) {
          shape.push(`${k}:${v instanceof File ? `File(${v.size}b)` : typeof v}`);
        }
        console.debug('[addListing] multipart fields →', shape.join(', '));
      }

      const res = await listingsApi.create(fd);
      return adaptListing(res.listing);
    },
    [user],
  );

  return (
    <ListingsContext.Provider
      value={{ allListings, loading, error, refresh, getListing, addListing }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook is intentionally co-located with its provider; splitting would touch every consumer
export function useListings() {
  return useContext(ListingsContext);
}
