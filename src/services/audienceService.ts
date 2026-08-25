import { supabase } from '@/lib/supabase';
import type { FrequentationStats } from '@/types/audience';

/** Forme brute renvoyée par `statistiques_frequentation`, en clés serveur. */
interface FrequentationRow {
  periode_jours: number;
  debut: string;
  fin: string;
  total_visites: number;
  total_pages_vues: number;
  pages_par_visite: number;
  delta_visites: number | null;
  serie: { jour: string; visites: number; pages_vues: number }[];
  pages: { chemin: string; vues: number; visites: number }[];
  provenances: { source: string; visites: number }[];
  appareils: { type: string; visites: number }[];
}

function rowToStats(r: FrequentationRow): FrequentationStats {
  return {
    periodeJours: r.periode_jours,
    debut: r.debut,
    fin: r.fin,
    totalVisites: r.total_visites,
    totalPagesVues: r.total_pages_vues,
    pagesParVisite: Number(r.pages_par_visite),
    deltaVisites: r.delta_visites === null ? null : Number(r.delta_visites),
    serie: (r.serie ?? []).map((p) => ({
      jour: p.jour,
      visites: p.visites,
      pagesVues: p.pages_vues,
    })),
    pages: r.pages ?? [],
    provenances: r.provenances ?? [],
    appareils: r.appareils ?? [],
  };
}

export const audienceService = {
  /**
   * Consigne la consultation d'une page.
   *
   * Volontairement silencieuse : la mesure d'audience est accessoire, et son
   * échec — hors ligne, bloqueur de publicité, table indisponible — ne doit
   * jamais se manifester à une visiteuse venue réserver.
   *
   * Rien d'identifiant n'est transmis : le chemin et le référent suffisent.
   * Appareil, provenance et empreinte du visiteur sont déduits côté serveur à
   * partir des en-têtes de la requête.
   */
  async enregistrerVisite(chemin: string, referent?: string | null): Promise<void> {
    // Le développement local fausserait les chiffres du salon : chaque
    // rechargement à chaud compterait pour une consultation.
    if (import.meta.env.DEV) return;

    try {
      await supabase.rpc('enregistrer_visite', {
        p_chemin: chemin,
        p_referent: referent && referent.length > 0 ? referent.slice(0, 300) : null,
      });
    } catch {
      // Sans effet visible, par construction.
    }
  },

  /** Fréquentation agrégée sur les `jours` derniers jours. Réservé à l'administration. */
  async getFrequentation(jours: number): Promise<FrequentationStats | null> {
    const { data, error } = await supabase.rpc('statistiques_frequentation', {
      p_jours: jours,
    });
    if (error) throw error;
    if (!data) return null;
    return rowToStats(data as FrequentationRow);
  },
};
