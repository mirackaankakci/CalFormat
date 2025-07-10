import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review } from '../types/review';

const COLLECTION_NAME = 'reviews';

export interface CreateReviewData {
  userName: string;
  rating: number;
  title: string;
  comment: string;
  productId: number;
  verified?: boolean;
}

class ReviewService {
  // Yorum ekleme
  async addReview(reviewData: CreateReviewData): Promise<string> {
    try {
      const now = new Date();
      const docData = {
        ...reviewData,
        verified: reviewData.verified || false,
        date: now.toISOString().split('T')[0], // YYYY-MM-DD format
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      console.log('✅ Yorum başarıyla eklendi:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Yorum ekleme hatası:', error);
      throw new Error('Yorum eklenirken bir hata oluştu');
    }
  }

  // Ürüne ait yorumları getirme
  async getProductReviews(productId: number): Promise<Review[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          userName: data.userName,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          date: data.date,
          verified: data.verified || false,
          productId: data.productId,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      console.log(`✅ ${reviews.length} yorum getirildi (Ürün ID: ${productId})`);
      return reviews;
    } catch (error) {
      console.error('❌ Yorumları getirme hatası:', error);
      throw new Error('Yorumlar yüklenirken bir hata oluştu');
    }
  }

  // Tüm yorumları getirme (admin paneli için)
  async getAllReviews(limitCount?: number): Promise<Review[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          userName: data.userName,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          date: data.date,
          verified: data.verified || false,
          productId: data.productId,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      console.log(`✅ ${reviews.length} toplam yorum getirildi`);
      return reviews;
    } catch (error) {
      console.error('❌ Tüm yorumları getirme hatası:', error);
      throw new Error('Yorumlar yüklenirken bir hata oluştu');
    }
  }

  // Yorum silme (admin)
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, reviewId));
      console.log('✅ Yorum başarıyla silindi:', reviewId);
    } catch (error) {
      console.error('❌ Yorum silme hatası:', error);
      throw new Error('Yorum silinirken bir hata oluştu');
    }
  }

  // Yorum onaylama/reddetme (admin)
  async updateReviewVerification(reviewId: string, verified: boolean): Promise<void> {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      await updateDoc(reviewRef, {
        verified,
        updatedAt: Timestamp.fromDate(new Date())
      });
      console.log(`✅ Yorum ${verified ? 'onaylandı' : 'reddedildi'}:`, reviewId);
    } catch (error) {
      console.error('❌ Yorum güncelleme hatası:', error);
      throw new Error('Yorum güncellenirken bir hata oluştu');
    }
  }

  // Ortalama puan hesaplama
  calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  // Puan dağılımı hesaplama
  calculateRatingDistribution(reviews: Review[]): { [key: number]: number } {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
      }
    });

    return distribution;
  }
}

const reviewService = new ReviewService();
export default reviewService;
