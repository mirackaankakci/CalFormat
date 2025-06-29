import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Share2, Loader2 } from 'lucide-react';
import { Blog, getBlogBySlug } from '../../services/blogService';
import { sanitizeHTML } from '../../utils/security';
import SEO from '../common/SEO';

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) {
        setError('Blog slug bulunamadı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Blog getiriliyor, slug:', slug);
        const blogData = await getBlogBySlug(slug);
        
        if (blogData) {
          setBlog(blogData);
          console.log('Blog başarıyla getirildi:', blogData.title);
        } else {
          setError('Blog bulunamadı');
        }
      } catch (err) {
        console.error('Blog getirme hatası:', err);
        setError('Blog yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

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
  // Paylaşma fonksiyonu
  const handleShare = () => {
    if (navigator.share && blog) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback: URL'yi kopyala
      navigator.clipboard.writeText(window.location.href);
      alert('Blog linki kopyalandı!');
    }
  };  // Blog için SEO verileri
  const generateBlogSEO = () => {
    if (!blog) return null;
    
    const currentUrl = `https://www.calformat.com.tr/blog/${blog.slug}`;
    
    // Blog içeriğinden düz metin çıkar (ilk 160 karakter)
    const extractTextFromHTML = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    const metaDescription = blog.excerpt || 
      extractTextFromHTML(blog.content).substring(0, 160) + '...';

    // Anahtar kelimeler - blog tagları + genel anahtar kelimeler
    const metaKeywords = [
      ...blog.tags,
      'CalFormat blog',
      'meyve sebze temizleme',
      'doğal temizlik',
      blog.category
    ].filter(Boolean).join(', ');

    // JSON-LD structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": metaDescription,
      "image": blog.image || "https://www.calformat.com.tr/calformat.webp",
      "author": {
        "@type": "Person",
        "name": blog.author || "CalFormat Editörü"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CalFormat",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calformat.com.tr/logo.png"
        }
      },
      "datePublished": blog.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      "dateModified": blog.updatedAt?.toDate?.()?.toISOString() || blog.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      },
      "keywords": metaKeywords,
      "articleSection": blog.category,
      "inLanguage": "tr-TR"
    };

    return {
      title: blog.title,
      description: metaDescription,
      keywords: metaKeywords,
      canonicalUrl: currentUrl,
      ogTitle: blog.title,
      ogDescription: metaDescription,
      ogImage: blog.image || "https://www.calformat.com.tr/calformat.webp",
      ogUrl: currentUrl,
      twitterTitle: blog.title,
      twitterDescription: metaDescription,
      twitterImage: blog.image || "https://www.calformat.com.tr/calformat.webp",
      structuredData
    };
  };

  const blogSEO = generateBlogSEO();
  if (loading) {
    return (
      <>
        <SEO 
          title="Blog Yükleniyor"
          description="CalFormat blog yazısı yükleniyor..."
          noIndex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#ee7f1a] animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Blog yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (error || !blog) {
    return (
      <>
        <SEO 
          title="Blog Bulunamadı"
          description="Aradığınız blog yazısı bulunamadı."
          noIndex={true}
        />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                Blog Listesine Dön
              </Link>
            </div>
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blog Bulunamadı</h3>
                <p className="text-gray-600 mb-6">{error || 'Aradığınız blog mevcut değil.'}</p>
                <Link
                  to="/blogs"
                  className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 font-semibold"
                >
                  Blog Listesine Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      {/* ✅ Dinamik SEO */}
      {blogSEO && (
        <SEO 
          title={blogSEO.title}
          description={blogSEO.description}
          keywords={blogSEO.keywords}
          canonicalUrl={blogSEO.canonicalUrl}
          ogTitle={blogSEO.ogTitle}
          ogDescription={blogSEO.ogDescription}
          ogImage={blogSEO.ogImage}
          ogUrl={blogSEO.ogUrl}
          twitterTitle={blogSEO.twitterTitle}
          twitterDescription={blogSEO.twitterDescription}
          twitterImage={blogSEO.twitterImage}
          structuredData={blogSEO.structuredData}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Geri Dön */}
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Blog Listesine Dön
          </Link>
        </div>

        {/* Blog Header */}
        <article className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Hero Image */}
          <div className="relative">
            <img
              src={blog.image || '/calformat.webp'}
              alt={blog.title}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-6 left-6 flex gap-2">
              <span className="bg-[#ee7f1a] text-white px-4 py-2 rounded-full font-medium">
                {blog.category}
              </span>
              {!blog.published && (
                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full font-medium">
                  Taslak
                </span>
              )}
            </div>
          </div>

          {/* Blog Content */}
          <div className="p-8">
            {/* Meta Bilgiler */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{blog.author}</span>
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-[#ee7f1a] hover:text-[#d62d27] transition-colors duration-300"
              >
                <Share2 className="w-4 h-4" />
                <span>Paylaş</span>
              </button>
            </div>

            {/* Başlık */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {blog.title}
            </h1>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Blog İçeriği */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-[#ee7f1a]">
              {/* Eğer content HTML ise */}
              <div 
                className="blog-content"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHTML(blog.content) 
                }}
              />
            </div>

            {/* CTA Section */}
            <div className="mt-12 p-6 bg-gradient-to-r from-[#ee7f1a]/10 to-[#d62d27]/10 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                CalFormat ile Doğal Temizlik
              </h3>
              <p className="text-gray-700 mb-4">
                Meyve ve sebzelerinizi güvenle temizlemek için CalFormat'ı deneyin. 
                %100 doğal içerikli formülümüz ile ailece sağlıklı beslenin.
              </p>
              <Link
                to="/"
                className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold inline-block"
              >
                Ürünü İncele
              </Link>            </div>
          </div>
        </article>
      </div>
    </div>
    </>
  );
};

export default BlogDetail;