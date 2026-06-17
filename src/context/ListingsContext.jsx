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
      const images = (data.images && data.images.length ? data.images : [])
        .filter(Boolean)
        .map((imageUrl, i) => ({ imageUrl, displayOrder: i }));

      const res = await listingsApi.create({
        userId: user.id,
        title: data.title,
        description: data.description,
        category: data.categorySlug,
        price: data.priceRaw,
        featuredRequested: !!data.featuredRequested,
        details: data.details || {},
        images,
      });
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

export function useListings() {
  return useContext(ListingsContext);
}
