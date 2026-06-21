// Listing endpoints (Phase 5.2.2). Returns parsed JSON; throws ApiError on failure.

import apiClient from './apiClient';

export const listingsApi = {
  // filters: { category, status, userId, featured }
  list: (filters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiClient.get(`/listings${suffix}`);
  },

  get: (id) => apiClient.get(`/listings/${id}`),

  create: (payload) => apiClient.post('/listings', payload),

  // Owner-scoped
  mine: () => apiClient.get('/listings/mine'),
  update: (id, changes) => apiClient.patch(`/listings/${id}`, changes),
  remove: (id) => apiClient.del(`/listings/${id}`),
};

export default listingsApi;
