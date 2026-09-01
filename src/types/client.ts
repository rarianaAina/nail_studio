export interface Client {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  visitCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientDto {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  userId?: string;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  visitCount?: number;
  totalSpent?: number;
  lastVisit?: string;
}

/**
 * Compte rendu d'une suppression de fiche cliente.
 *
 * L'historique n'est pas effacé mais anonymisé : les pièces comptables sont
 * conservées dix ans par obligation légale. Ces nombres permettent d'annoncer
 * à la gérante ce que l'opération a réellement emporté.
 */
export interface SuppressionCliente {
  nom: string;
  rendezVousAnonymises: number;
  avisAnonymises: number;
  rappelsSupprimes: number;
  courrielsSupprimes: number;
  compteSupprime: boolean;
}
