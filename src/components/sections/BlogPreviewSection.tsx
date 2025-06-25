// components/sections/BlogPreviewSection.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, ChevronRight } from 'lucide-react';
import { Blog, getBlogs } from '../../services/blogService';

const BlogPreviewSection: React.FC = () => {
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBlogs();
  }, []);

  const loadRecentBlogs = async () => {
    try {
      setLoading(true);
      const allBlogs = await getBlogs();
      // Sadece yayınlanmış blogları al ve son 3'ünü seç
      const publishedBlogs = allBlogs
        .filter(blog => blog.published)
        .slice(0, 3);
      setRecentBlogs(publishedBlogs);
    } catch (error) {
      console.error('Blog yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatı
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Tarih belirtilmemiş';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Blog'lar yoksa section'ı gösterme
  if (!loading && recentBlogs.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Arka plan dekoratif elementler */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Son <span className="text-[#ee7f1a]">Blog</span> Yazılarımız
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Sağlıklı yaşam, doğal beslenme ve meyve-sebze temizliği hakkında 
            en güncel bilgileri sizler için hazırlıyoruz.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] mx-auto rounded-full"></div>
        </div>

        {loading ? (
          // Loading State
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Blog Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {recentBlogs.map((blog, index) => (
              <article
                key={blog.id}
                className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                {/* Blog Resmi */}
                <div className="relative overflow-hidden">
                  <img
                    src={blog.image || '/calformat.webp'}
                    alt={blog.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {blog.category}
                    </span>
                  </div>
                </div>

                {/* Blog İçeriği */}
                <div className="p-6">
                  {/* Meta Bilgiler */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{blog.author}</span>
                    </div>
                  </div>

                  {/* Başlık */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#ee7f1a] transition-colors duration-300">
                    {blog.title}
                  </h3>

                  {/* Özet */}
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  {/* Devamını Oku Butonu */}
                  <Link
                    to={`/blog/${blog.id}`}
                    className="inline-flex items-center gap-2 text-[#ee7f1a] font-semibold hover:text-[#d62d27] transition-colors duration-300 group/link"
                  >
                    Devamını Oku
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Tüm Blogları Gör Butonu */}
        {!loading && recentBlogs.length > 0 && (
          <div className="text-center">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-8 py-4 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Tüm Blog Yazılarını Gör
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {/* Dekoratif bottom wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="relative block w-full h-16 text-white/10"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

export default BlogPreviewSection;