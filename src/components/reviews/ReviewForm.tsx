import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useReviews } from '../../contexts/ReviewContext';

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const { addReview, loading } = useReviews();
  const [formData, setFormData] = useState({
    userName: '',
    rating: 5,
    title: '',
    comment: ''
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata mesajını temizle
    if (formError) {
      setFormError(null);
    }
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.userName.trim()) {
      setFormError('Lütfen adınızı girin');
      return;
    }
    
    if (!formData.title.trim()) {
      setFormError('Lütfen değerlendirme başlığı girin');
      return;
    }
    
    if (!formData.comment.trim()) {
      setFormError('Lütfen yorumunuzu girin');
      return;
    }
    
    try {
      setFormError(null);
      
      await addReview({
        userName: formData.userName.trim(),
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        productId,
        verified: false // Yeni yorumlar varsayılan olarak onaylanmamış
      });
      
      // Form'u temizle
      setFormData({
        userName: '',
        rating: 5,
        title: '',
        comment: ''
      });
      
      setSubmitted(true);
      
      if (onSuccess) {
        onSuccess();
      }

      // 3 saniye sonra submitted durumunu sıfırla
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Yorum gönderme hatası:', error);
      setFormError('Yorumunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Teşekkürler!</h3>
        <p className="text-green-600">
          Yorumunuz başarıyla gönderildi. Moderasyon sürecinden sonra yayınlanacaktır.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-medium text-[#ee7f1a] hover:underline"
        >
          Başka bir yorum ekle
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-6">
      <h3 className="text-xl font-semibold mb-6">Değerlendirme Yap</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => handleStarClick(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoveredStar !== null ? star <= hoveredStar : star <= formData.rating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
            İsminiz
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={formData.userName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none"
            placeholder="İsminizi girin"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Başlık
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none"
            placeholder="Yorumunuz için kısa bir başlık"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Yorumunuz
          </label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-[#ee7f1a] focus:border-[#ee7f1a] outline-none"
            placeholder="Ürün hakkındaki deneyiminizi paylaşın"
            required
          />
        </div>
        
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{formError}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gönderiliyor...</span>
            </div>
          ) : (
            'Yorum Gönder'
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;