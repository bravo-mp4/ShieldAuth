import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import axios from 'axios';

interface BlogPost {
  post_id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_email: string;
  category: string;
  is_published: boolean;
  published_at: string | null;
  views: number;
  likes: number;
  created_at: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Technical',
    is_published: false
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/blog`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('[ERR_BLOG_001] Failed to fetch posts:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingPost
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/blog/${editingPost.post_id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/blog`;
      
      const method = editingPost ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowEditor(false);
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Technical',
        is_published: false
      });
      fetchPosts();
    } catch (err) {
      alert('Failed to save blog post');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/blog/${postId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchPosts();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: '',
      category: post.category,
      is_published: post.is_published
    });
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h1>
          <Button variant="ghost" onClick={() => setShowEditor(false)}>
            Cancel
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
            
            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              helpText="Used in URL: /blog/{slug}"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content (Markdown)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono"
                rows={15}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="Technical">Technical</option>
                  <option value="Updates">Updates</option>
                  <option value="Security">Security</option>
                  <option value="Guides">Guides</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-300">Publish immediately</label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                {editingPost ? 'Update Post' : 'Create Post'}
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
          <FileText size={32} className="text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Blog Management</h1>
            <p className="text-gray-400 text-sm">Create and manage blog posts</p>
          </div>
        </div>
        <Button onClick={() => setShowEditor(true)} icon={<Plus size={16} />}>
          New Post
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-12 mb-4" />
            <Skeleton className="h-12 mb-4" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Views</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Published</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.post_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-white">{post.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{post.category}</td>
                    <td className="px-6 py-4 text-sm">
                      {post.is_published ? (
                        <span className="px-2 py-1 bg-success/20 text-success rounded text-xs flex items-center gap-1 w-fit">
                          <Eye size={12} /> Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs flex items-center gap-1 w-fit">
                          <EyeOff size={12} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{post.views}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(post)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(post.post_id)}>
                          <Trash2 size={14} />
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
