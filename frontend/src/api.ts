import axios from "axios";

const API_BASE = "/api/v1";

// Create axios instance with interceptor for auth token
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
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
    const response = await apiClient.get("/users");
    return response.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post("/users", data);
    return response.data;
  },

  async checkHWID(
    data: CheckHWIDRequest
  ): Promise<{ valid: boolean; user?: User }> {
    const response = await apiClient.post("/check-hwid", data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
