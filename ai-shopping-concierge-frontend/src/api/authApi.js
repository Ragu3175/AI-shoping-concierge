import client from './client';

/**
 * Register a new user account.
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{access_token: string, token_type: string, user: object}>}
 */
export const registerUser = async (name, email, password) => {
  const response = await client.post('/api/auth/register', { name, email, password });
  return response.data;
};

/**
 * Log in an existing user.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{access_token: string, token_type: string, user: object}>}
 */
export const loginUser = async (email, password) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * Fetch details of the currently authenticated user.
 * @returns {Promise<object>}
 */
export const getCurrentUser = async () => {
  const response = await client.get('/api/auth/me');
  return response.data;
};
