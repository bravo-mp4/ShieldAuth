import axios from "axios";

// Relative path: Vite proxies /api to the backend in development, and the
// host (e.g. a Vercel rewrite) does the same in production.
const API_BASE = "/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or revoked session sends the user back to sign in rather than
// leaving every dashboard page showing errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  register: (email, password, name) =>
    api.post("/auth/register", { email, password, name }),

  me: () => api.get("/auth/me"),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),

  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword }),

  verifyEmail: (token) => api.post("/auth/verify-email", { token }),

  resendVerification: () => api.post("/auth/resend-verification"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
};

export const applications = {
  list: () => api.get("/admin/applications"),

  create: (data) => api.post("/admin/app/create", data),

  get: (appId) => api.get(`/admin/app/${appId}`),
};

export const users = {
  list: () => api.get("/users"),

  delete: (userId) => api.delete(`/users/${userId}`),
};

export const logs = {
  list: (filters = {}) => api.get("/admin/logs", { params: filters }),
};

export default api;
