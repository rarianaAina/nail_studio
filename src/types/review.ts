export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  appointmentId?: string;
  clientId?: string;
  name: string;
  rating: number;
  comment: string;
  service?: string;
  /** Identifiants des prestations commentées, pour un filtrage exact. */
  serviceIds: string[];
  imageUrl?: string;
  /** Vrai par construction : un avis est toujours rattaché à un rendez-vous. */
  verified?: boolean;
  status: ReviewStatus;
  date: string;
  moderatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmitReviewDto {
  appointmentId: string;
  rating: number;
  comment: string;
  imageUrl?: string;
}
