import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import LegalPage, { LegalSection, LegalTodo } from './LegalPage';

export default function LegalNotice() {
  const { settings } = useSettings();
  const name = settings?.name ?? 'Le salon';
  const address = settings?.address ?? '';
  const phone = settings?.phone ?? '';
  const email = settings?.email ?? '';

  return (
    <LegalPage
      badge="Mentions légales"
      title="Mentions légales"
      intro="Qui édite ce site, qui l’héberge, et à qui appartiennent les contenus qui s’y trouvent."
      updatedAt="16 août 2026"
    >
      <LegalSection title="Éditeur du site">
        <ul className="space-y-1.5">
          <li><strong>Dénomination</strong> — {name}</li>
          {address && <li><strong>Adresse</strong> — {address}</li>}
          {phone && <li><strong>Téléphone</strong> — {phone}</li>}
          {email && (
            <li>
              <strong>Courriel</strong> —{' '}
              <a className="text-primary underline" href={`mailto:${email}`}>{email}</a>
            </li>
          )}
        </ul>
        <LegalTodo>
          Mentions imposées par l’article 6 III-1 de la loi pour la confiance dans l’économie
          numérique : forme juridique et capital social, numéro d’immatriculation au registre du
          commerce et des sociétés avec la ville du greffe, numéro de TVA intracommunautaire, et
          nom du directeur de la publication. Pour une activité artisanale, y ajouter le numéro au
          répertoire des métiers.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Le site est hébergé par :</p>
        <ul className="space-y-1.5">
          <li>
            <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
            Contact :{' '}
            <a className="text-primary underline" href="https://vercel.com/help">
              vercel.com/help
            </a>
          </li>
          <li>
            <strong>Supabase, Inc.</strong> — 65 Chulia Street #38-02/03, OCBC Centre, Singapour
            049513. Contact :{' '}
            <a className="text-primary underline" href="https://supabase.com/support">
              supabase.com/support
            </a>
          </li>
        </ul>
        <p>
          Vercel assure la diffusion du site ; Supabase héberge les données — comptes, rendez-vous
          et photographies. Ni l’un ni l’autre ne publie de numéro de téléphone dédié au support :
          leurs formulaires de contact en tiennent lieu.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L’ensemble des contenus de ce site — textes, photographies de réalisations, identité
          visuelle — est la propriété de {name}, sauf mention contraire. Toute reproduction ou
          diffusion, même partielle, est soumise à autorisation écrite préalable.
        </p>
        <p>
          Les photographies de la galerie représentent des réalisations du salon. Si l’une d’elles
          vous concerne et que vous souhaitez son retrait, il suffit de nous écrire : elle sera
          retirée sans délai ni justification à fournir.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement de vos données est détaillé dans notre{' '}
          <Link className="text-primary underline" to="/confidentialite">
            politique de confidentialité
          </Link>
          , qui précise ce qui est collecté, pourquoi, pendant combien de temps, et comment obtenir
          la suppression de vos informations.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Les informations publiées — tarifs, durées, disponibilités — sont tenues à jour avec soin.
          Une erreur d’affichage ou une indisponibilité momentanée du service ne saurait toutefois
          engager la responsabilité du salon. Les tarifs et durées définitifs sont confirmés lors de
          votre rendez-vous.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
