export interface PaymentMethod {
  id: string;
  name: string;
  label: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentMethodDto {
  name: string;
  label: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  label?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}