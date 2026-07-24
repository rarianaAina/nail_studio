export interface Review {
  id: string;
  name: string;
  rating: number; // 1-5
  date: string; // ISO date
  comment: string;
  service?: string;
  verified?: boolean;
  createdAt?: string;
}
