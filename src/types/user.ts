export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}
