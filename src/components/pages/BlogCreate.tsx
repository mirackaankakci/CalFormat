import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { createBlogWithImage } from '../../services/blogService';
import { useBlog } from '../../contexts/BlogContext';
import DOMPurify from 'dompurify'; // npm install dompurify @types/dompurify

const BlogCreate: React.FC = () => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ✅ Input sanitization
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };

  // ✅ Gelişmiş validasyon
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Başlık kontrolü
    if (!formData.title.trim()) {
      errors.push('Başlık zorunludur');
    } else if (formData.title.length < 5) {
      errors.push('Başlık en az 5 karakter olmalıdır');
    } else if (formData.title.length > 200) {
      errors.push('Başlık en fazla 200 karakter olabilir');
    }
    
    // İçerik kontrolü
    if (!formData.content.trim()) {
      errors.push('İçerik zorunludur');
    } else if (formData.content.length < 50) {
      errors.push('İçerik en az 50 karakter olmalıdır');
    } else if (formData.content.length > 50000) {
      errors.push('İçerik çok uzun (max 50.000 karakter)');
    }
    
    // Özet kontrolü
    if (!formData.excerpt.trim()) {
      errors.push('Özet zorunludur');
    } else if (formData.excerpt.length < 20) {
      errors.push('Özet en az 20 karakter olmalıdır');
    } else if (formData.excerpt.length > 500) {
      errors.push('Özet en fazla 500 karakter olabilir');
    }
    
    // Yazar kontrolü
    if (!formData.author.trim()) {
      errors.push('Yazar adı zorunludur');
    } else if (formData.author.length < 2) {
      errors.push('Yazar adı en az 2 karakter olmalıdır');
    }
    
    // Kategori kontrolü
    const allowedCategories = ['Sağlık', 'Beslenme', 'Doğal Yaşam', 'Temizlik', 'Tarifler', 'İpuçları'];
    if (!allowedCategories.includes(formData.category)) {
      errors.push('Geçersiz kategori seçimi');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Form validasyonu
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Blog oluşturuluyor...');

      // ✅ Input sanitization
      const sanitizedData = {
        title: sanitizeInput(formData.title),
        excerpt: sanitizeInput(formData.excerpt),
        content: sanitizeInput(formData.content), // HTML içeriği için
        author: sanitizeInput(formData.author),
        category: formData.category, // Dropdown'dan geldiği için güvenli
        tags: formData.tags
          .split(',')
          .map(tag => sanitizeInput(tag))
          .filter(tag => tag.length > 0)
          .slice(0, 10), // Max 10 tag
        published: formData.published
      };

      // ✅ Rate limiting check (basit)
      const lastSubmission = localStorage.getItem('lastBlogSubmission');
      const now = Date.now();
      if (lastSubmission && (now - parseInt(lastSubmission)) < 30000) { // 30 saniye
        throw new Error('Çok hızlı gönderim. Lütfen 30 saniye bekleyin.');
      }

      // ✅ Resimle birlikte blog oluştur
      const blogId = await createBlogWithImage(sanitizedData, imageFile || undefined);
      console.log('Blog oluşturuldu, ID:', blogId);

      // Blog listesini yenile
      await refreshBlogs();

      // ✅ Rate limiting için timestamp kaydet
      localStorage.setItem('lastBlogSubmission', now.toString());
      
      alert('Blog başarıyla oluşturuldu!');
      navigate('/blogs');

    } catch (err: any) {
      console.error('Blog oluşturma hatası:', err);
      setError(err.message || 'Blog oluşturulurken hata oluştu');
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
      // Dosya boyutu kontrolü (25MB GitHub limit)
      if (file.size > 25 * 1024 * 1024) {
        setError('Resim boyutu 25MB\'dan küçük olmalıdır.');
        return;
      }

      // Dosya türü kontrolü
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Sadece JPEG, PNG, WebP ve GIF formatları desteklenir.');
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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    // File input'u temizle
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
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

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Yeni <span className="text-[#ee7f1a]">Blog</span> Oluştur
          </h1>

          {/* Hata Mesajı */}
          {error && (
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

            {/* ✅ RESİM UPLOAD ALANI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Kapak Resmi
              </label>
              
              {/* Resim Preview */}
              {imagePreview ? (
                <div className="relative mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={loading}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-300 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {imageFile?.name}
                  </div>
                </div>
              ) : (
                /* Upload Area */
                <label
                  htmlFor="image-upload"
                  className={`
                    w-full h-64 border-2 border-dashed border-gray-300 rounded-xl 
                    flex flex-col items-center justify-center cursor-pointer
                    hover:border-[#ee7f1a] hover:bg-orange-50 transition-all duration-300
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Kapak Resmi Yükle
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Sürükle bırak veya tıklayarak dosya seç
                    </p>
                    <div className="inline-flex items-center gap-2 bg-[#ee7f1a] text-white px-4 py-2 rounded-lg hover:bg-[#d62d27] transition-colors duration-300">
                      <Upload className="w-4 h-4" />
                      Dosya Seç
                    </div>
                  </div>
                </label>
              )}

              {/* Hidden File Input */}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />

              {/* Dosya Bilgileri */}
              <div className="mt-3 text-sm text-gray-500">
                <p>• Desteklenen formatlar: JPEG, PNG, WebP, GIF</p>
                <p>• Maksimum dosya boyutu: 25MB</p>
                <p>• Önerilen boyut: 1200x600 piksel</p>
                {imageFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <ImageIcon className="w-4 h-4" />
                      <span className="font-medium">{imageFile.name}</span>
                    </div>
                    <p className="text-green-600 text-xs mt-1">
                      Boyut: {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
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
                placeholder="Blog içeriğini girin... (HTML etiketleri kullanabilirsiniz: <h2>, <p>, <strong>, <em>, <ul>, <ol>, <li>)"
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
              <p className="text-sm text-gray-500 mt-1">
                Örnek: sağlık, temizlik, doğal, beslenme
              </p>
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
                Hemen yayınla (İşaretlenmezse taslak olarak kaydedilir)
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
                    {imageFile ? 'Resim yükleniyor...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Blog Oluştur
                  </>
                )}
              </button>
              <Link
                to="/blogs"
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

export default BlogCreate;