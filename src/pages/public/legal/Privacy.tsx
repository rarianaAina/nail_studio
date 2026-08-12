import { useSettings } from '@/hooks/useSettings';
import LegalPage, { LegalSection, LegalTodo } from './LegalPage';

export default function Privacy() {
  const { settings } = useSettings();
  const name = settings?.name ?? 'Le salon';
  const email = settings?.email ?? '';
  const address = settings?.address ?? '';

  return (
    <LegalPage
      badge="Confidentialité"
      title="Politique de confidentialité"
      intro={`Quelles données ${name} collecte, pourquoi, combien de temps elles sont conservées, et comment en obtenir la suppression.`}
      updatedAt="12 août 2026"
    >
      <LegalSection title="Responsable du traitement">
        <p>
          {name}
          {address ? `, ${address}` : ''}. Pour toute question relative à vos données,
          écrivez à {email ? <a className="text-primary underline" href={`mailto:${email}`}>{email}</a> : 'l’adresse de contact du salon'}.
        </p>
        <LegalTodo>
          Forme juridique, numéro d’immatriculation et nom du responsable désigné.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Données que nous collectons">
        <p>Nous ne collectons que ce qui est nécessaire à la prise de rendez-vous et au suivi des soins.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Réservation</strong> — nom, téléphone, adresse électronique, prestations
            choisies, date et heure, moyen de paiement annoncé, et les précisions que vous
            saisissez librement. Une réservation est possible sans créer de compte.
          </li>
          <li>
            <strong>Compte cliente</strong> — les mêmes informations, ainsi qu’un mot de passe.
            Celui-ci n’est jamais stocké en clair : seule une empreinte chiffrée est conservée,
            et le salon n’y a pas accès.
          </li>
          <li>
            <strong>Photographies</strong> — les photos de vos mains et vos images d’inspiration,
            que vous déposez volontairement pour préciser le rendu souhaité.
          </li>
          <li>
            <strong>Historique</strong> — vos rendez-vous passés, le nombre de visites, le montant
            cumulé, vos points de fidélité, et les notes de suivi rédigées par la praticienne.
          </li>
          <li>
            <strong>Rappels</strong> — vos coordonnées sont reprises pour l’envoi du rappel
            précédant votre rendez-vous.
          </li>
        </ul>
        <p>
          Nous ne collectons aucune donnée bancaire : le règlement s’effectue sur place, au salon.
        </p>
      </LegalSection>

      <LegalSection title="Pourquoi ces données">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Enregistrer et honorer votre rendez-vous — l’exécution de notre prestation.</li>
          <li>Vous envoyer confirmation et rappel — l’exécution de la prestation.</li>
          <li>Retrouver l’historique de vos soins pour assurer leur continuité — notre intérêt légitime à un suivi de qualité.</li>
          <li>Gérer les points de fidélité — votre adhésion au programme.</li>
          <li>Tenir notre comptabilité — nos obligations légales.</li>
        </ul>
        <p>
          Vos données ne sont ni vendues, ni louées, ni transmises à des fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="Photographies de vos mains">
        <p>
          Le dépôt de photos est facultatif : vous pouvez réserver sans en fournir. Elles servent
          uniquement à préparer votre prestation et ne sont consultables que par la praticienne.
        </p>
        <p>
          <strong>Elles ne sont jamais publiées dans la galerie ni sur les réseaux sociaux sans
          votre accord exprès</strong>, demandé séparément. Vous pouvez en obtenir la suppression à
          tout moment sans que cela affecte vos rendez-vous.
        </p>
      </LegalSection>

      <LegalSection title="Qui accède à vos données">
        <p>
          Seule la praticienne accède à votre dossier. Deux prestataires techniques hébergent les
          données pour notre compte, sans droit de les exploiter :
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Supabase</strong> — base de données, comptes et stockage des photographies.</li>
          <li><strong>Vercel</strong> — hébergement du site.</li>
        </ul>
        <LegalTodo>
          Localisation exacte des serveurs des deux prestataires, à indiquer ici.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Dossier cliente et historique : trois ans après votre dernier rendez-vous.</li>
          <li>Photographies de référence : supprimées avec le dossier, ou plus tôt sur demande.</li>
          <li>Pièces comptables : la durée imposée par la réglementation applicable.</li>
        </ul>
        <LegalTodo>
          Durées à valider avec un conseil juridique au regard de la réglementation malgache.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez demander l’accès à vos données, leur rectification, leur suppression, ou vous
          opposer à leur traitement. Depuis votre espace personnel, vous consultez déjà vos
          rendez-vous et vos points de fidélité.
        </p>
        <p>
          Pour toute autre demande, écrivez à {email ? <a className="text-primary underline" href={`mailto:${email}`}>{email}</a> : 'l’adresse de contact du salon'}.
          Nous répondons sous trente jours. La suppression de votre compte entraîne celle de vos
          photographies et de vos notes de suivi ; les pièces comptables sont conservées lorsque la
          loi l’exige.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage local">
        <p>
          <strong>Ce site n’utilise aucun cookie publicitaire ni aucun outil de mesure d’audience.</strong>{' '}
          Ni Google Analytics, ni pixel de réseau social, ni traceur tiers.
        </p>
        <p>
          Seul un jeton de connexion est enregistré dans votre navigateur lorsque vous vous
          identifiez, afin de vous éviter de saisir votre mot de passe à chaque page. Il est
          strictement nécessaire au fonctionnement du service et disparaît à la déconnexion.
          C’est pourquoi aucun bandeau de consentement ne vous est présenté.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés. L’accès aux données est cloisonné au niveau de la
          base : une cliente connectée ne peut consulter que ses propres rendez-vous, et les
          informations des autres clientes lui sont techniquement inaccessibles.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
