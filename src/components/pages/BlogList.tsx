import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, ArrowRight, Loader2, Trash2, Edit } from 'lucide-react';
import { useBlog } from '../../contexts/BlogContext';
import { useAuth } from '../../contexts/AuthContext';
import { deleteBlog } from '../../services/blogService';
import { sanitizeHTML } from '../../utils/security';
import SEO from '../common/SEO';

const BlogList: React.FC = () => {
  const { blogs, loading, error, refreshBlogs } = useBlog();
  const { isAdmin } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Blog silme fonksiyonu
  const handleDeleteBlog = async (blogId: string, blogTitle: string) => {
    if (!window.confirm(`"${blogTitle}" adlı blog'u silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setDeletingId(blogId);
      console.log('Blog siliniyor, ID:', blogId);
      
      await deleteBlog(blogId);
      await refreshBlogs();
      
      alert('Blog başarıyla silindi!');
      console.log('Blog silindi:', blogId);
    } catch (err) {
      console.error('Blog silme hatası:', err);
      alert('Blog silinirken hata oluştu!');
    } finally {
      setDeletingId(null);
    }
  };

  // Tarih formatı
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Tarih belirtilmemiş';
    
    // Firebase Timestamp'i Date'e çevir
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#ee7f1a] animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Bloglar yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl mb-4">
                <p className="font-semibold">Hata!</p>
                <p>{error}</p>
              </div>
              <button
                onClick={refreshBlogs}
                className="bg-[#ee7f1a] text-white px-6 py-3 rounded-xl hover:bg-[#d62d27] transition-colors duration-300"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );  }

  // Blog listesi için SEO verileri
  const blogListSEO = {
    title: "Blog Yazıları",
    description: "CalFormat blog sayfasında sağlıklı yaşam, doğal beslenme ve meyve-sebze temizliği hakkında uzman görüşleri ve faydalı bilgiler bulabilirsiniz.",
    keywords: "CalFormat blog, sağlıklı yaşam, doğal beslenme, meyve sebze temizliği, pestisit temizleme, doğal temizlik yöntemleri, organik yaşam",
    canonicalUrl: "https://www.calformat.com.tr/blogs",
    ogTitle: "CalFormat Blog - Sağlıklı Yaşam Rehberi",
    ogDescription: "Uzman yazarlarımızdan sağlıklı yaşam, doğal beslenme ve meyve-sebze temizliği konularında faydalı bilgiler.",
    ogImage: "https://www.calformat.com.tr/blog-og.jpg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "CalFormat Blog",
      "description": "Sağlıklı yaşam ve doğal beslenme blog yazıları",
      "url": "https://www.calformat.com.tr/blogs",
      "publisher": {
        "@type": "Organization",
        "name": "CalFormat",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calformat.com.tr/logo.png"
        }
      },
      "blogPost": blogs.filter(blog => blog.published).map(blog => ({
        "@type": "BlogPosting",
        "headline": blog.title,
        "description": blog.excerpt,
        "url": `https://www.calformat.com.tr/blog/${blog.slug}`,
        "author": {
          "@type": "Person",
          "name": blog.author || "CalFormat Editörü"
        },
        "datePublished": blog.createdAt?.toDate?.()?.toISOString(),
        "image": blog.image || "https://www.calformat.com.tr/calformat.webp"
      }))
    }
  };

  return (
    <>
      <SEO 
        title={blogListSEO.title}
        description={blogListSEO.description}
        keywords={blogListSEO.keywords}
        canonicalUrl={blogListSEO.canonicalUrl}
        ogTitle={blogListSEO.ogTitle}
        ogDescription={blogListSEO.ogDescription}
        ogImage={blogListSEO.ogImage}
        ogUrl={blogListSEO.canonicalUrl}
        structuredData={blogListSEO.structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            CalFormat <span className="text-[#ee7f1a]">Blog</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sağlıklı yaşam, doğal beslenme ve meyve-sebze temizliği hakkında 
            uzman görüşleri ve faydalı bilgiler.
          </p>
        </div>

        {/* Blog sayısı */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Toplam <span className="font-semibold text-[#ee7f1a]">{blogs.length}</span> blog yazısı
          </p>
        </div>

        {blogs.length === 0 ? (
          // Boş durum
          <div className="text-center py-16">
            <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Henüz Blog Yok</h3>
              <p className="text-gray-600 mb-6">
                {isAdmin 
                  ? "İlk blog yazısını eklemek için aşağıdaki butonu kullanın." 
                  : "Henüz yayınlanmış blog yazısı bulunmamaktadır."
                }
              </p>
              {/* ✅ Sadece admin kullanıcılar için göster */}
              {isAdmin && (
                <Link
                  to="/admin/blog/create"
                  className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  İlk Blog'u Oluştur
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Blog Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Blog Resmi */}
                  <div className="relative overflow-hidden">
                    <img
                      src={blog.image || '/calformat.webp'} // Varsayılan resim
                      alt={blog.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#ee7f1a] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {blog.category}
                      </span>
                    </div>
                    {!blog.published && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Taslak
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Blog İçeriği */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{blog.author}</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#ee7f1a] transition-colors duration-300">
                      {blog.title}
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag, index) => ( // İlk 3 tag'i göster
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {blog.tags.length > 3 && (
                          <span className="text-gray-400 text-xs">+{blog.tags.length - 3} daha</span>
                        )}
                      </div>
                    )}

                    {/* Blog Aksiyonları */}
                    <div className="flex items-center justify-between">                      {/* Devamını Oku */}
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-2 text-[#ee7f1a] font-semibold hover:text-[#d62d27] transition-colors duration-300 group/link"
                      >
                        Devamını Oku
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>

                      {/* Admin Butonları */}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          {/* Düzenle Butonu */}
                          <Link
                            to={`/admin/blog/edit/${blog.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                            title="Blog'u Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Silme Butonu */}
                          <button
                            onClick={() => blog.id && handleDeleteBlog(blog.id, blog.title)}
                            disabled={deletingId === blog.id}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Blog'u Sil"
                          >
                            {deletingId === blog.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* ✅ Admin Butonu - Sadece admin kullanıcılar için */}
            {isAdmin && (
              <div className="text-center mt-12">
                <Link
                  to="/admin/blog/create"
                  className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  Yeni Blog Ekle
                </Link>
              </div>            )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default BlogList;