import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Loader2, X } from 'lucide-react';
import { getBlog, updateBlogWithImage } from '../../services/blogService';
import { useBlog } from '../../contexts/BlogContext';

const BlogEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshBlogs } = useBlog();
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    tags: '',
    published: false
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Blog verilerini yükle
  useEffect(() => {
    const loadBlog = async () => {
      if (!id) {
        setError('Blog ID bulunamadı');
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        console.log('Blog yükleniyor, ID:', id);
        
        const blog = await getBlog(id);
        
        if (blog) {
          setFormData({
            title: blog.title || '',
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            author: blog.author || '',
            category: blog.category || '',
            tags: blog.tags ? blog.tags.join(', ') : '',
            published: blog.published || false
          });
          
          setCurrentImage(blog.image || '');
          console.log('Blog yüklendi:', blog.title);
        } else {
          setError('Blog bulunamadı');
        }
      } catch (err) {
        console.error('Blog yükleme hatası:', err);
        setError('Blog yüklenirken hata oluştu');
      } finally {
        setPageLoading(false);
      }
    };

    loadBlog();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Başlık ve içerik zorunludur!');
      return;
    }

    if (!id) {
      setError('Blog ID bulunamadı');
      return;
    }

    try {
      setLoading(true);
      setError('');      console.log('Blog güncelleniyor...');

      // Tags'i array'e çevir
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Blog verisini hazırla
      const blogData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        author: formData.author.trim(),
        category: formData.category,
        tags: tagsArray,
        published: formData.published
      };      // ✅ Resimle birlikte blog'u güncelle
      console.log('📝 Blog güncelleniyor:', {
        id,
        blogData,
        hasImageFile: !!imageFile,
        imageFileName: imageFile?.name
      });
      
      await updateBlogWithImage(id, blogData, imageFile || undefined);
      console.log('✅ Blog güncellendi, ID:', id);

      // Blog listesini yenile
      await refreshBlogs();

      alert('Blog başarıyla güncellendi!');
      navigate(`/blog/${id}`);

    } catch (err) {
      console.error('Blog güncelleme hatası:', err);
      setError('Blog güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Resim boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }

      // Dosya türü kontrolü
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir resim dosyası seçin.');
        return;
      }

      setImageFile(file);
      
      // Preview oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const removeNewImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const removeCurrentImage = () => {
    setCurrentImage('');
  };

  if (pageLoading) {
    return (
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
    );
  }

  if (error && !formData.title) {
    return (
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
              <p className="text-gray-600 mb-6">{error}</p>
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Geri Dön */}
        <div className="mb-8">
          <Link
            to={`/blog/${id}`}
            className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Blog Detayına Dön
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            <span className="text-[#ee7f1a]">Blog</span> Düzenle
          </h1>

          {/* Hata Mesajı */}
          {error && formData.title && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Başlığı *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="Blog başlığını girin..."
              />
            </div>

            {/* Özet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Özeti *
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="Blog özetini girin... (Blog listesinde görünecek)"
              />
            </div>

            {/* İçerik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog İçeriği *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="Blog içeriğini girin... (HTML etiketleri kullanabilirsiniz)"
              />
              <p className="text-sm text-gray-500 mt-1">
                HTML etiketleri kullanabilirsiniz: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;
              </p>
            </div>

            {/* Yazar ve Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yazar *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                  placeholder="Yazar adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                >
                  <option value="">Kategori Seçin</option>
                  <option value="Sağlık">Sağlık</option>
                  <option value="Beslenme">Beslenme</option>
                  <option value="Doğal Yaşam">Doğal Yaşam</option>
                  <option value="Temizlik">Temizlik</option>
                  <option value="Tarifler">Tarifler</option>
                  <option value="İpuçları">İpuçları</option>
                </select>
              </div>
            </div>

            {/* Etiketler */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiketler (virgülle ayırın)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee7f1a] focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="sağlık, temizlik, doğal, beslenme"
              />
            </div>

            {/* Mevcut Resim */}
            {currentImage && !imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Resim
                </label>
                <div className="relative">
                  <img
                    src={currentImage}
                    alt="Mevcut resim"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeCurrentImage}
                    disabled={loading}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Yeni Resim Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentImage && !imagePreview ? 'Resmi Değiştir' : 'Blog Resmi'}
              </label>
              
              {!imagePreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#ee7f1a] transition-colors duration-300 cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-2">
                      {currentImage ? 'Yeni resim yüklemek için tıklayın' : 'Resim yüklemek için tıklayın'}
                    </p>
                    <p className="text-sm text-gray-400">PNG, JPG, JPEG - Maksimum 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Yeni resim preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeNewImage}
                    disabled={loading}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Yayınla Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                disabled={loading}
                className="w-4 h-4 text-[#ee7f1a] border-gray-300 rounded focus:ring-[#ee7f1a] disabled:opacity-50"
              />
              <label className="ml-2 text-sm text-gray-700">
                Yayında (İşaretlenmezse taslak olarak kaydedilir)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Blog'u Güncelle
                  </>
                )}
              </button>
              <Link
                to={`/blog/${id}`}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogEdit;