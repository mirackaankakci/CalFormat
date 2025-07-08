// components/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Activity,
  Truck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBlog } from '../../contexts/BlogContext';
import { deleteBlog } from '../../services/blogService';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { blogs, refreshBlogs } = useBlog();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0
  });

  useEffect(() => {
    // İstatistikleri hesapla
    const published = blogs.filter(blog => blog.published).length;
    const draft = blogs.filter(blog => !blog.published).length;
    
    setStats({
      totalBlogs: blogs.length,
      publishedBlogs: published,
      draftBlogs: draft,
      totalViews: blogs.length * 150 // Simulated views
    });
  }, [blogs]);

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" başlıklı blogu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteBlog(id);
      await refreshBlogs();
      alert('Blog başarıyla silindi!');
    } catch (error: any) {
      alert('Blog silinirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin <span className="text-[#ee7f1a]">Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Hoş geldiniz, {userProfile?.displayName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Blog</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBlogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Yayınlanan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedBlogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taslak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draftBlogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Görüntüleme</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hızlı İşlemler</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/blogs/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Yeni Blog Oluştur
            </Link>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              Tüm Blogları Görüntüle
            </Link>
            <Link
              to="/admin/shipping-settings"
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-200 transition-all duration-300"
            >
              <Truck className="w-5 h-5" />
              Kargo Ayarları
            </Link>
          </div>
        </div>

        {/* Recent Blogs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Son Bloglar</h2>
            <Link
              to="/blogs"
              className="text-[#ee7f1a] hover:text-[#d62d27] font-medium"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Başlık</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Kategori</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tarih</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {blogs.slice(0, 5).map((blog) => (
                  <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{blog.title}</div>
                      <div className="text-sm text-gray-500">{blog.excerpt?.substring(0, 60)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        blog.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {blog.published ? 'Yayınlandı' : 'Taslak'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{blog.category}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {blog.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'Bilinmiyor'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/blogs/${blog.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/blogs/edit/${blog.id}`}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBlog(blog.id!, blog.title)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {blogs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz blog oluşturulmamış</p>
                <Link
                  to="/blogs/create"
                  className="inline-flex items-center gap-2 mt-4 text-[#ee7f1a] hover:text-[#d62d27] font-medium"
                >
                  <Plus className="w-4 h-4" />
                  İlk blogunuzu oluşturun
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;