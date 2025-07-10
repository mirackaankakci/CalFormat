import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Review } from '../types/review';
import reviewService, { CreateReviewData } from '../services/reviewService';

interface ReviewContextType {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  addReview: (review: CreateReviewData) => Promise<void>;
  getProductReviews: (productId: number) => Review[];
  getAverageRating: (productId: number) => number;
  refreshReviews: () => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  updateReviewVerification: (reviewId: string, verified: boolean) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tüm yorumları yükle
  const loadAllReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const allReviews = await reviewService.getAllReviews();
      setReviews(allReviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorumlar yüklenirken hata oluştu');
      console.error('❌ Yorumları yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda yorumları yükle
  useEffect(() => {
    loadAllReviews();
  }, []);

  // Yeni yorum ekleme
  const addReview = async (reviewData: CreateReviewData) => {
    try {
      setLoading(true);
      setError(null);
      const reviewId = await reviewService.addReview(reviewData);
      
      // Yeni yorumu local state'e ekle
      const newReview: Review = {
        id: reviewId,
        ...reviewData,
        verified: reviewData.verified || false,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setReviews(prev => [newReview, ...prev]);
      console.log('✅ Yorum başarıyla eklendi ve state güncellendi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum eklenirken hata oluştu');
      console.error('❌ Yorum ekleme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Belirli ürünün yorumlarını getir
  const getProductReviews = (productId: number): Review[] => {
    return reviews.filter(review => review.productId === productId);
  };

  // Ortalama puan hesapla
  const getAverageRating = (productId: number): number => {
    const productReviews = getProductReviews(productId);
    return reviewService.calculateAverageRating(productReviews);
  };

  // Yorumları yenile
  const refreshReviews = async () => {
    await loadAllReviews();
  };

  // Yorum silme (admin)
  const deleteReview = async (reviewId: string) => {
    try {
      setLoading(true);
      setError(null);
      await reviewService.deleteReview(reviewId);
      
      // Local state'den kaldır
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      console.log('✅ Yorum başarıyla silindi ve state güncellendi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum silinirken hata oluştu');
      console.error('❌ Yorum silme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Yorum onaylama (admin)
  const updateReviewVerification = async (reviewId: string, verified: boolean) => {
    try {
      setLoading(true);
      setError(null);
      await reviewService.updateReviewVerification(reviewId, verified);
      
      // Local state'i güncelle
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, verified, updatedAt: new Date() }
          : review
      ));
      console.log(`✅ Yorum ${verified ? 'onaylandı' : 'reddedildi'} ve state güncellendi`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum güncellenirken hata oluştu');
      console.error('❌ Yorum güncelleme hatası:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReviewContext.Provider value={{ 
      reviews, 
      loading, 
      error,
      addReview, 
      getProductReviews, 
      getAverageRating,
      refreshReviews,
      deleteReview,
      updateReviewVerification
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};