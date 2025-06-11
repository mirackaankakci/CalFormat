import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Review } from '../types/review';

// Örnek yorumlar
const initialReviews: Review[] = [
  {
    id: 1,
    userName: "Ayşe Y.",
    rating: 5,
    title: "Harika ürün!",
    comment: "Meyve ve sebzelerimdeki inatçı kalıntıları temizlemek için mükemmel. Artık daha güvende hissediyorum.",
    date: "2025-04-15",
    verified: true,
    productId: 1
  },
  {
    id: 2,
    userName: "Mehmet K.",
    rating: 4,
    title: "Oldukça etkili",
    comment: "Çok pratik ve kullanımı kolay. Tek eksik yanı biraz daha ekonomik olabilirdi.",
    date: "2025-04-02",
    verified: true,
    productId: 1
  },
  {
    id: 3,
    userName: "Zeynep A.",
    rating: 5,
    title: "Kesinlikle tavsiye ederim",
    comment: "Özellikle çocuklu aileler için vazgeçilmez bir ürün. Artık alışveriş sonrası temizlik çok daha kolay.",
    date: "2025-03-20",
    verified: true,
    productId: 1
  }
];

interface ReviewContextType {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date' | 'verified'>) => void;
  getProductReviews: (productId: number) => Review[];
  getAverageRating: (productId: number) => number;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const addReview = (review: Omit<Review, 'id' | 'date' | 'verified'>) => {
    const newReview: Review = {
      ...review,
      id: reviews.length + 1,
      date: new Date().toISOString().split('T')[0],
      verified: true // Gerçek uygulamada bu doğrulama mantığı değişebilir
    };
    
    setReviews(prev => [...prev, newReview]);
  };

  const getProductReviews = (productId: number) => {
    return reviews.filter(review => review.productId === productId);
  };

  const getAverageRating = (productId: number) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / productReviews.length).toFixed(1));
  };

  return (
    <ReviewContext.Provider value={{ reviews, addReview, getProductReviews, getAverageRating }}>
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