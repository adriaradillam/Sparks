import { Platform } from 'react-native';

// Si estamos en navegador web, usamos localhost; en móvil físico usamos la IP LAN
export const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.50.66:5000';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}: Solicitud fallida`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};

export const uploadPhoto = async (fileUri, isAvatar = false) => {
  const url = `${API_BASE_URL}/api/upload/photo?isAvatar=${isAvatar}`;
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

  formData.append('photo', {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    name: filename,
    type,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir la imagen al servidor.');
    }
    return data;
  } catch (error) {
    console.error('[Upload Error]:', error.message);
    throw error;
  }
};
