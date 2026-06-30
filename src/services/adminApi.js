// Admin endpoints for the moderation panel. All routes are enforced server-side
// via JWT + requireRole('admin') (Phase 5.2.4); the UI gating is for UX only.

import apiClient from './apiClient';

export const adminApi = {
  // Dashboard statistics
  getStats: () => apiClient.get('/stats'),

  // Users (optional name/email search)
  listUsers: (search) =>
    apiClient.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  // Reversible account suspension (admin only). body: { reason? }
  blockUser: (id, reason) => apiClient.patch(`/users/${id}/block`, reason ? { reason } : {}),
  unblockUser: (id) => apiClient.patch(`/users/${id}/unblock`, {}),

  // Listings — filter by status (pending | approved | rejected | sold | hidden)
  listListings: (status = 'pending') => apiClient.get(`/listings?status=${status}`),
  // Featured requests: requested but not yet activated.
  listFeaturedRequests: () => apiClient.get('/listings?featuredRequested=true&featured=false'),
  // Moderation + featured control — accepts any subset of
  // { status, featuredActive, featuredRequested }.
  setListingStatus: (id, body) => apiClient.patch(`/listings/${id}/status`, body),
  deleteListing: (id) => apiClient.del(`/listings/${id}`),

  // Business Seller applications queue (filter by seller_status).
  listBusinessAccounts: (status) =>
    apiClient.get(`/business-accounts${status ? `?status=${status}` : ''}`),
  // body: { sellerStatus?, paymentStatus? }
  decideBusiness: (id, body) => apiClient.patch(`/business-accounts/${id}/decision`, body),
};

export default adminApi;
