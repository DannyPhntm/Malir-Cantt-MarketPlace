// Saved-listings (favourites) endpoints — all require auth (Phase 5.2.5).
import apiClient from './apiClient';

export const savedApi = {
  list: () => apiClient.get('/saved'),
  add: (listingId) => apiClient.post('/saved', { listingId }),
  remove: (listingId) => apiClient.del(`/saved/${listingId}`),
};

export default savedApi;
