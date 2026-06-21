// Public contact form submission. Throws ApiError on failure (with field map).

import apiClient from './apiClient';

export const contactApi = {
  // payload: { name, email, subject, message, category? }
  send: (payload) => apiClient.post('/contact', payload),
};

export default contactApi;
