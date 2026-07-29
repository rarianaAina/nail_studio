export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  service?: string;
  verified?: boolean;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReviewDto {
  name: string;
  rating: number;
  comment: string;
  service?: string;
  date?: string;
}
