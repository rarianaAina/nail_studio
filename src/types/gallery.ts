export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGalleryItemDto {
  title: string;
  category: string;
  image: string;
  description?: string;
}
