// Public marketplace stats (no auth) for the homepage hero, category counts,
// and footer. Admin dashboard stats live in adminApi.

import apiClient from './apiClient';

export const statsApi = {
  // → { activeListings, users, verifiedBusinesses, categories, categoryCounts }
  getPublicStats: () => apiClient.get('/stats/public'),
};

export default statsApi;
