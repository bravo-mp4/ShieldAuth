import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import axios from 'axios';

interface ChangelogEntry {
  entry_id: number;
  version: string;
  release_date: string;
  is_published: boolean;
  changes: ChangelogChange[];
}

interface ChangelogChange {
  change_id: number;
  change_type: 'new' | 'improved' | 'fixed' | 'deprecated' | 'security';
  description: string;
  display_order: number;
}

export default function AdminChangelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    release_date: new Date().toISOString().split('T')[0],
    is_published: true,
    changes: [
      { type: 'new', description: '' }
    ]
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/changelog`);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      console.error('[ERR_CHANGELOG_001] Failed to fetch entries:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/changelog`,
        formData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowEditor(false);
      setFormData({
        version: '',
        release_date: new Date().toISOString().split('T')[0],
        is_published: true,
        changes: [{ type: 'new', description: '' }]
      });
      fetchEntries();
    } catch (err) {
      alert('Failed to create changelog entry');
    }
  };

  const addChange = () => {
    setFormData({
      ...formData,
      changes: [...formData.changes, { type: 'new', description: '' }]
    });
  };

  const updateChange = (index: number, field: string, value: string) => {
    const newChanges = [...formData.changes];
    newChanges[index] = { ...newChanges[index], [field]: value };
    setFormData({ ...formData, changes: newChanges });
  };

  const removeChange = (index: number) => {
    setFormData({
      ...formData,
      changes: formData.changes.filter((_, i) => i !== index)
    });
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'new': return 'bg-primary-500/20 text-primary-500';
      case 'improved': return 'bg-info/20 text-info';
      case 'fixed': return 'bg-success/20 text-success';
      case 'security': return 'bg-error/20 text-error';
      case 'deprecated': return 'bg-warning/20 text-warning';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  if (showEditor) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">New Changelog Entry</h1>
          <Button variant="ghost" onClick={() => setShowEditor(false)}>
            Cancel
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Version"
                placeholder="1.2.0"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                required
              />
              <Input
                label="Release Date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({...formData, release_date: e.target.value})}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Changes
                </label>
                <Button type="button" size="sm" onClick={addChange} icon={<Plus size={14} />}>
                  Add Change
                </Button>
              </div>

              <div className="space-y-3">
                {formData.changes.map((change, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <select
                      value={change.type}
                      onChange={(e) => updateChange(index, 'type', e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="new">New</option>
                      <option value="improved">Improved</option>
                      <option value="fixed">Fixed</option>
                      <option value="security">Security</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                    <input
                      type="text"
                      value={change.description}
                      onChange={(e) => updateChange(index, 'description', e.target.value)}
                      placeholder="Description of change..."
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      required
                    />
                    {formData.changes.length > 1 && (
                      <Button type="button" size="sm" variant="danger" onClick={() => removeChange(index)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-300">Publish immediately</label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                Create Entry
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <GitBranch size={32} className="text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Changelog Management</h1>
            <p className="text-gray-400 text-sm">Manage version history and changes</p>
          </div>
        </div>
        <Button onClick={() => setShowEditor(true)} icon={<Plus size={16} />}>
          New Version
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <div className="p-6">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <Card key={entry.entry_id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Version {entry.version}</h3>
                    <p className="text-sm text-gray-400">
                      Released {new Date(entry.release_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit2 size={14} />
                    </Button>
                    <Button size="sm" variant="danger">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {entry.changes.map((change) => (
                    <div key={change.change_id} className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getChangeTypeColor(change.change_type)}`}>
                        {change.change_type.toUpperCase()}
                      </span>
                      <p className="text-gray-300 text-sm flex-1">{change.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
