import React, { useState } from 'react';
import { Star, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useReviews } from '../../contexts/ReviewContext';
import { Review } from '../../types/review';

interface ReviewListProps {
  productId: number;
}

// Tarih formatlama fonksiyonu
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Tarih belirtilmemiş';
  }
};

const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
  return (
    <div className="border-b border-gray-100 py-6 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 flex items-center justify-center text-[#ee7f1a] font-medium">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{review.userName}</div>
            <div className="text-xs text-gray-500">
              {formatDate(review.createdAt || review.date || new Date())}
            </div>
          </div>
        </div>
        
        {review.verified && (
          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full text-xs text-green-700">
            <CheckCircle className="w-3 h-3" />
            <span>Onaylı Alışveriş</span>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star}
                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <div className="font-medium">{review.title}</div>
        </div>
        
        <p className="text-gray-600 whitespace-pre-wrap">{review.comment}</p>
      </div>
    </div>
  );
};

const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
  const { getProductReviews, getAverageRating, loading, error, refreshReviews } = useReviews();
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const reviews = getProductReviews(productId);
  const averageRating = getAverageRating(productId);
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  
  // Puan dağılımını hesapla
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  // Yenile butonu için handler
  const handleRefresh = async () => {
    try {
      await refreshReviews();
    } catch (err) {
      console.error('Yorumları yenileme hatası:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Müşteri Değerlendirmeleri</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm text-[#ee7f1a] hover:text-[#d16c15] font-medium disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {loading && reviews.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Yorumlar yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-500">Henüz değerlendirme yok</h3>
            <p className="text-gray-500 mt-2">İlk değerlendirmeyi siz yapın!</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Ortalama puan */}
              <div>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 pb-2">/ 5</span>
                </div>
                
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  {reviews.length} değerlendirme
                </div>
              </div>
              
              {/* Puan dağılımı */}
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center w-14">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 ml-1 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-[#ee7f1a] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-9 text-sm text-gray-500 text-right">{count}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Yorumlar */}
            <div className="space-y-0">
              {displayedReviews.map(review => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
            
            {/* Daha fazla göster butonu */}
            {reviews.length > 3 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="inline-flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d16c15] transition-colors"
                >
                  {showAllReviews ? (
                    <>
                      <span>Daha az göster</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Tüm değerlendirmeleri gör ({reviews.length})</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewList;