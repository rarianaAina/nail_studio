export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface ColorPreset {
  name: string;
  primary: string;
  accent: string;
}

export interface SalonSettings {
  id?: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  email: string;
  hours: BusinessHours[];
  /** Bandeau d'accueil. Le titre est en deux parties : la seconde est composée
   *  en italique et dans la couleur d'accentuation. */
  heroTitle?: string;
  heroTitleAccent?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  updatedAt?: string;
}
