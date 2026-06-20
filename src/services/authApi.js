// Auth + user endpoints (Phase 5.1 backend). All methods return the parsed JSON
// body and throw ApiError on failure (see apiClient).

import apiClient from './apiClient';

export const authApi = {
  // payload: { name, email, password, phone, accountType, residentLocation, canttPassNumber, businessName? }
  register: (payload) => apiClient.post('/auth/register', payload),

  verifyEmail: (email, code) => apiClient.post('/auth/verify-email', { email, code }),

  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),

  login: (email, password) => apiClient.post('/auth/login', { email, password }),

  requestPasswordReset: (email) => apiClient.post('/auth/request-password-reset', { email }),

  resetPassword: (email, code, password) =>
    apiClient.post('/auth/reset-password', { email, code, password }),

  // Change password while signed in — requires the current password (auth).
  changePassword: (currentPassword, newPassword) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),

  // Email change — verifies the NEW address before swapping it (auth required).
  requestEmailChange: (newEmail) => apiClient.post('/auth/request-email-change', { newEmail }),

  confirmEmailChange: (newEmail, code) =>
    apiClient.post('/auth/confirm-email-change', { newEmail, code }),

  // Current user from the bearer token (session rehydration).
  me: () => apiClient.get('/auth/me'),

  getUser: (id) => apiClient.get(`/users/${id}`),

  updateUser: (id, changes) => apiClient.patch(`/users/${id}`, changes),
};

export default authApi;
