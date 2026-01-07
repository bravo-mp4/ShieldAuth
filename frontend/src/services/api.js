import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies/credentials
});

// Add auth token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication endpoints
export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  register: (email, password, name) =>
    api.post("/auth/register", { email, password, name }),

  logout: () => {
    localStorage.removeItem("token");
    return Promise.resolve();
  },
};

// Applications endpoints
export const applications = {
  list: () => api.get("/admin/applications"),

  create: (data) => api.post("/admin/app/create", data),

  get: (appId) => api.get(`/admin/app/${appId}`),

  update: (appId, data) => api.put(`/admin/app/${appId}`, data),

  delete: (appId) => api.delete(`/admin/app/${appId}`),

  stats: (appId) => api.get(`/admin/app/${appId}/stats`),
};

// Users/Licenses endpoints
export const users = {
  list: () => api.get("/users"),

  create: (data) => api.post("/users", data),

  get: (userId) => api.get(`/users/${userId}`),

  delete: (userId) => api.delete(`/users/${userId}`),

  checkHWID: (hwid) => api.post("/check-hwid", { hwid }),
};

// Logs endpoints
export const logs = {
  list: (filters = {}) => api.get("/admin/logs", { params: filters }),

  export: (filters = {}) => api.get("/admin/logs/export", { params: filters }),
};

// Settings endpoints
export const settings = {
  get: () => api.get("/admin/settings"),

  update: (data) => api.put("/admin/settings", data),

  generateAPIKey: () => api.post("/admin/api-keys/generate"),

  revokeAPIKey: (keyId) => api.delete(`/admin/api-keys/${keyId}`),
};

export default api;
