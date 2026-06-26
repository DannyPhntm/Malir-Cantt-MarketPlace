// Shops directory endpoints. Returns parsed JSON; throws ApiError on failure.
import apiClient from './apiClient';

export const shopsApi = {
  // Public list. filters: { shopCategory?, q? }
  list: (filters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiClient.get(`/shops${suffix}`);
  },
  get: (id) => apiClient.get(`/shops/${id}`),

  // Owner (auth)
  mine: () => apiClient.get('/shops/mine'),
  create: (payload) => apiClient.post('/shops', payload),
  updateMine: (changes) => apiClient.patch('/shops/mine', changes),

  // Admin
  listAll: (status) => apiClient.get(`/shops/admin${status ? `?status=${status}` : ''}`),
  setStatus: (id, status) => apiClient.patch(`/shops/${id}/status`, { status }),
  remove: (id) => apiClient.del(`/shops/${id}`),
};

export default shopsApi;
