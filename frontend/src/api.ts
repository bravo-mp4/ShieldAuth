import apiClient from "./services/api";

// One row per license key, as shown on the Users page.
export interface User {
  id: string;
  username: string;
  hwid_hash: string;
  expires_at: string;
  created_at: string;
  status: "active" | "expired" | "banned";
}

export const api = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get("/users");
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
