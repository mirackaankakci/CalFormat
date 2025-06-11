export interface Review {
  id: number;
  userName: string;
  rating: number; // 1-5 arası yıldız değeri
  title: string;
  comment: string;
  date: string;
  avatarUrl?: string;
  verified: boolean;
  productId: number;
}