export interface LoyaltySettings {
  id: string;
  pointsPerVisit: number;
  updatedAt?: string;
}

export interface LoyaltySettingsUpdateDto {
  pointsPerVisit?: number;
}