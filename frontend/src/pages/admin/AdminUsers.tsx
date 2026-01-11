import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, UserCog, Eye, Filter } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';
import axios from 'axios';

interface User {
  user_id: number;
  email: string;
  role: string;
  is_banned: boolean;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('[ERR_ADMIN_002] Failed to fetch users:', err);
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${userId}/ban`,
        { is_banned: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Failed to change user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users size={32} className="text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 text-sm">Manage all platform users</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={10} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Login</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.user_id, e.target.value)}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                      >
                        <option value="user">User</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.is_banned ? (
                        <span className="px-2 py-1 bg-error/20 text-error rounded text-xs">Banned</span>
                      ) : (
                        <span className="px-2 py-1 bg-success/20 text-success rounded text-xs">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBanUser(user.user_id, user.is_banned)}
                        >
                          <Ban size={14} />
                          {user.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
