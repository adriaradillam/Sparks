import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determina dinámicamente la URL base del backend
export const getApiBaseUrl = () => {
  // 1. En navegador web siempre usamos localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // 2. Extraer automáticamente la IP local del host de desarrollo de Expo
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.debuggerHost ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants?.manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // 3. Fallback a la IP local de la máquina en la red actual
  return 'https://192.168.1.45:5000';
};

export const API_BASE_URL = getApiBaseUrl();

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutMs = options.timeout || 12000;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}: Solicitud fallida`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error.message?.toLowerCase().includes('abort')) {
      const timeoutError = new Error(
        `Tiempo de espera agotado al conectar con el backend (${baseUrl}). Verifica que tu móvil y tu PC estén en la misma red Wi-Fi y que el servidor backend esté encendido.`
      );
      console.error(`[API Timeout] ${endpoint}:`, timeoutError.message);
      throw timeoutError;
    }
    if (error.message === 'Network request failed') {
      const netError = new Error(
        `No se pudo conectar con el servidor (${baseUrl}). Comprueba que tu móvil y tu PC estén en la misma red Wi-Fi.`
      );
      console.error(`[API Network Error] ${endpoint}:`, netError.message);
      throw netError;
    }
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const uploadPhoto = async (fileUri, isAvatar = false) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/upload/photo?isAvatar=${isAvatar}`;
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

  formData.append('photo', {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    name: filename,
    type,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: formData,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir la imagen al servidor.');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al subir la imagen (${baseUrl}).`);
    }
    console.error('[Upload Error]:', error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
