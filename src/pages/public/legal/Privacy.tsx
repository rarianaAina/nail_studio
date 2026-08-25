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
      updatedAt="25 août 2026"
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
          Les bases légales correspondantes sont, selon les cas, l’exécution du contrat qui nous
          lie, notre intérêt légitime à assurer la continuité des soins, votre consentement, et le
          respect de nos obligations légales.
        </p>
        <p>
          Vos données ne sont ni vendues, ni louées, ni transmises à des fins publicitaires. Elles
          ne font l’objet d’aucune décision automatisée ni d’aucun profilage.
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
        <p>
          Ces prestataires étant susceptibles d’opérer des serveurs hors de l’Union européenne, les
          transferts éventuels sont encadrés par les clauses contractuelles types de la Commission
          européenne.
        </p>
        <LegalTodo>
          Région d’hébergement retenue chez Supabase et chez Vercel, à préciser ici. Si les serveurs
          sont situés dans l’Union européenne, la mention de transfert ci-dessus doit être retirée.
        </LegalTodo>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Dossier cliente et historique : <strong>trois ans à compter de votre dernier
            rendez-vous</strong>, conformément à la recommandation de la CNIL en matière de
            prospection et de relation commerciale.
          </li>
          <li>Photographies de référence : supprimées avec le dossier, ou plus tôt sur demande.</li>
          <li>
            Pièces comptables : <strong>dix ans</strong>, en application de l'article L123-22 du
            Code de commerce.
          </li>
          <li>Compte cliente : jusqu'à sa suppression, à votre initiative ou à la nôtre après trois ans d'inactivité.</li>
          <li>
            Mesures d’audience anonymes : <strong>treize mois</strong>, durée recommandée par la
            CNIL, afin de pouvoir comparer une saison à la précédente.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Le règlement général sur la protection des données vous reconnaît un droit d’accès, de
          rectification, d’effacement, de limitation du traitement, d’opposition et de portabilité
          de vos données. Lorsqu’un traitement repose sur votre consentement — le dépôt de photos,
          par exemple — vous pouvez le retirer à tout moment, sans que cela remette en cause ce qui
          a été fait auparavant.
        </p>
        <p>
          Depuis votre espace personnel, vous consultez déjà vos rendez-vous et vos points de
          fidélité. Pour toute autre demande, écrivez à {email ? <a className="text-primary underline" href={`mailto:${email}`}>{email}</a> : 'l’adresse de contact du salon'}.
          Nous répondons sous un mois. La suppression de votre compte entraîne celle de vos
          photographies et de vos notes de suivi ; les pièces comptables sont conservées lorsque la
          loi l’exige.
        </p>
        <p>
          Si notre réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de
          la <strong>Commission nationale de l’informatique et des libertés</strong> —{' '}
          <a
            className="text-primary underline"
            href="https://www.cnil.fr/fr/plaintes"
            target="_blank"
            rel="noopener noreferrer"
          >
            cnil.fr
          </a>{' '}
          — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage local">
        <p>
          <strong>Ce site n’utilise aucun cookie publicitaire ni aucun traceur tiers.</strong>{' '}
          Ni Google Analytics, ni pixel de réseau social.
        </p>
        <p>
          Seul un jeton de connexion est enregistré dans votre navigateur lorsque vous vous
          identifiez, afin de vous éviter de saisir votre mot de passe à chaque page. Il est
          strictement nécessaire au fonctionnement du service et disparaît à la déconnexion.
          C’est pourquoi aucun bandeau de consentement ne vous est présenté.
        </p>
      </LegalSection>

      <LegalSection title="Mesure d’audience">
        <p>
          Nous comptons les pages consultées afin de savoir ce qui intéresse nos visiteuses et
          d’améliorer le site. Cette mesure est réalisée par nos propres moyens, sans recourir à
          un service tiers : <strong>rien n’est déposé dans votre navigateur, et aucune donnée
          n’est transmise à qui que ce soit.</strong>
        </p>
        <p>Pour chaque page ouverte, nous conservons uniquement :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>la page consultée et la date ;</li>
          <li>le site depuis lequel vous êtes arrivée — un réseau social, un moteur de recherche — sans l’adresse précise ;</li>
          <li>la catégorie d’appareil : mobile, tablette ou ordinateur.</li>
        </ul>
        <p>
          Pour distinguer deux visiteuses sans les identifier, une empreinte est calculée à partir
          de votre adresse IP et de votre navigateur. <strong>Cette adresse n’est jamais
          enregistrée</strong> : seule l’empreinte l’est, et elle est renouvelée chaque nuit. Il
          nous est donc impossible de vous reconnaître d’un jour à l’autre, de relier ces
          consultations à votre dossier de cliente, ou de remonter jusqu’à vous.
        </p>
        <p>
          Ce dispositif répond aux conditions posées par la CNIL pour les mesures d’audience
          exemptées de consentement. Il ne produit ni profilage, ni publicité ciblée. Si vous
          préférez ne pas y figurer, le mode de navigation privée de votre navigateur ou une
          extension de blocage suffisent à vous en soustraire.
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
