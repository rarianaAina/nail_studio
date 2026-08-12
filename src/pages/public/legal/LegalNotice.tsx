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
      updatedAt="12 août 2026"
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
          Forme juridique, numéro d’immatriculation au registre du commerce, numéro
          d’identification fiscale et nom du directeur de la publication.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong> Les données — comptes, rendez-vous et
          photographies — sont hébergées par <strong>Supabase</strong>.
        </p>
        <LegalTodo>
          Adresses postales et coordonnées de contact des deux hébergeurs.
        </LegalTodo>
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
