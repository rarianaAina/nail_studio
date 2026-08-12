export interface LoyaltySettings {
  id: string;
  /** Points attribués par euro dépensé. */
  pointsPerEuro: number;
  updatedAt?: string;
}

export interface LoyaltySettingsUpdateDto {
  pointsPerEuro?: number;
}
