import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useReviews } from '../../contexts/ReviewContext';

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const { addReview } = useReviews();
  const [formData, setFormData] = useState({
    userName: '',
    rating: 5,
    title: '',
    comment: ''
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addReview({
      ...formData,
      productId
    });
    
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
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-green-500 fill-current" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Yorumunuz için teşekkürler!</h3>
        <p className="text-green-600">Değerlendirmeniz incelendikten sonra yayınlanacaktır.</p>
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
        
        <button
          type="submit"
          className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 w-full"
        >
          Yorum Gönder
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;