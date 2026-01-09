import axios from "axios";

const API_BASE = "/api/v1";

// Add axios interceptor for auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.url?.startsWith(API_BASE)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  hwid_hash: string;
  expires_at: string;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  hwid: string;
  expires_at?: string;
}

export interface CheckHWIDRequest {
  hwid: string;
}

export const api = {
  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${API_BASE}/users`);
    return response.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${API_BASE}/users`, data);
    return response.data;
  },

  async checkHWID(
    data: CheckHWIDRequest
  ): Promise<{ valid: boolean; user?: User }> {
    const response = await axios.post(`${API_BASE}/check-hwid`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/users/${id}`);
  },
};
