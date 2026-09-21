import axios from 'axios';

export const TOKEN_KEY = 'classroom.token';

const baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`;

export const api = axios.create({ baseURL });

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Private browsing can throw; the session simply will not persist. */
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * A 401 means the stored token is gone or stale, so the session is cleared and
 * the app is sent to sign-in. Everything else is left to the caller, which
 * knows what the failure means in context.
 */
let onUnauthorized = () => {};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Pulls the server's message out of an axios error, with a sane fallback. */
export const errorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Is the backend running?';
  }
  return fallback;
};
