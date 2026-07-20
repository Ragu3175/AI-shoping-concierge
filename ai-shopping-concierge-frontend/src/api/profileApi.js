import client from './client';

/**
 * Fetch the current user's style profile and picture URL.
 * @returns {Promise<{preferred_styles: string[], budget_min: number|null, budget_max: number|null, profile_picture_url: string|null}>}
 */
export const getProfile = async () => {
  const response = await client.get('/api/profile');
  return response.data;
};

/**
 * Update style preferences and budget margins.
 * @param {string[]} preferred_styles 
 * @param {string|number|null} budget_min 
 * @param {string|number|null} budget_max 
 * @returns {Promise<{preferred_styles: string[], budget_min: number|null, budget_max: number|null, profile_picture_url: string|null}>}
 */
export const updateProfile = async (preferred_styles, budget_min, budget_max) => {
  const response = await client.put('/api/profile', {
    preferred_styles,
    budget_min: budget_min ? parseInt(budget_min, 10) : null,
    budget_max: budget_max ? parseInt(budget_max, 10) : null,
  });
  return response.data;
};

/**
 * Upload a profile picture.
 * @param {string} imageUri Local URI of the selected image.
 * @returns {Promise<{profile_picture_url: string}>}
 */
export const uploadProfilePicture = async (imageUri) => {
  const formData = new FormData();
  
  // Extract file name and extension from local URI
  const uriParts = imageUri.split('/');
  const filename = uriParts[uriParts.length - 1] || 'profile.jpg';
  const ext = filename.split('.').pop().toLowerCase();
  
  // Determine MIME type
  let type = 'image/jpeg';
  if (ext === 'png') {
    type = 'image/png';
  } else if (ext === 'webp') {
    type = 'image/webp';
  } else if (ext === 'gif') {
    type = 'image/gif';
  }

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type: type,
  });

  const response = await client.post('/api/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
