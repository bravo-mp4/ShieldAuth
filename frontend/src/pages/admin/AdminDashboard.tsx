import { useState, useEffect } from 'react';
import { Users, Package, Key, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import axios from 'axios';

interface Stats {
  totalUsers: number;
  totalApplications: number;
  totalLicenses: number;
  activeLicenses: number;
  validationsToday: number;
  failedValidationsToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load stats');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity size={32} className="text-primary-500" />
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-error-bg border border-error text-error p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Activity size={32} className="text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">System overview and metrics</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Users size={24} className="text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.totalApplications.toLocaleString()}
                </p>
              </div>
              <div className="bg-info/20 p-3 rounded-lg">
                <Package size={24} className="text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Licenses</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.totalLicenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-warning/20 p-3 rounded-lg">
                <Key size={24} className="text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Licenses</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.activeLicenses.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats && stats.totalLicenses > 0 
                    ? Math.round((stats.activeLicenses / stats.totalLicenses) * 100)
                    : 0}% activation rate
                </p>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <TrendingUp size={24} className="text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Validations Today</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.validationsToday.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Activity size={24} className="text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed Validations</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.failedValidationsToday.toLocaleString()}
                </p>
                <p className="text-xs text-error mt-1">
                  Requires attention
                </p>
              </div>
              <div className="bg-error/20 p-3 rounded-lg">
                <AlertCircle size={24} className="text-error" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Activity feed coming soon...</p>
              <p className="text-xs text-gray-500">
                This will show recent admin actions, user signups, license creations, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">API Status</span>
                <span className="text-success flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database</span>
                <span className="text-success flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Redis Cache</span>
                <span className="text-warning flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  Not configured
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
