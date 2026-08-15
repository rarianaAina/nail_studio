import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAppointmentSettings } from '@/hooks/useAppointmentSettings';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import LegalPage, { LegalSection } from './LegalPage';

export default function Terms() {
  const { settings } = useSettings();
  const { settings: appointmentSettings } = useAppointmentSettings();
  const { paymentMethods } = usePaymentMethods();

  const name = settings?.name ?? 'Le salon';
  const email = settings?.email ?? '';
  const phone = settings?.phone ?? '';

  // Le délai affiché ici est celui réellement appliqué par l'application, et non
  // une valeur recopiée : modifier le réglage met la page à jour.
  const allowCancellation = appointmentSettings?.allowCancellation ?? true;
  const deadlineHours = appointmentSettings?.cancellationDeadlineHours ?? 24;
  const deadlineLabel = appointmentSettings?.cancellationDeadlineLabel || `${deadlineHours} heures avant`;
  const activeMethods = paymentMethods.filter((m) => m.active);

  return (
    <LegalPage
      badge="Conditions"
      title="Conditions de réservation"
      intro="Comment se déroulent la prise de rendez-vous, l’annulation et le règlement."
      updatedAt="16 août 2026"
    >
      <LegalSection title="Objet">
        <p>
          Ces conditions régissent la réservation d’une prestation auprès de {name} par
          l’intermédiaire de ce site. Réserver un créneau vaut acceptation.
        </p>
      </LegalSection>

      <LegalSection title="Réservation">
        <p>
          La réservation s’effectue en ligne, avec ou sans compte. Elle est enregistrée avec le
          statut <strong>en attente</strong> jusqu’à confirmation par le salon.
        </p>
        <p>
          Les créneaux proposés tiennent compte de la durée réelle des prestations choisies : un
          créneau disponible pour une prestation courte peut ne pas l’être pour une plus longue.
          Sélectionner plusieurs prestations allonge d’autant le temps réservé.
        </p>
      </LegalSection>

      <LegalSection title="Annulation et modification">
        {allowCancellation ? (
          <>
            <p>
              Vous pouvez annuler votre rendez-vous depuis votre espace personnel jusqu’à{' '}
              <strong>{deadlineLabel}</strong>. Passé ce délai, l’annulation en ligne n’est plus
              possible : contactez directement le salon
              {phone ? <> au <strong>{phone}</strong></> : ''}.
            </p>
            <p>
              Ce délai permet de proposer le créneau libéré à une autre cliente. Un rendez-vous non
              annulé immobilise le salon pour toute sa durée.
            </p>
          </>
        ) : (
          <p>
            L’annulation en ligne n’est pas activée. Pour modifier ou annuler un rendez-vous,
            contactez directement le salon
            {phone ? <> au <strong>{phone}</strong></> : ''}.
          </p>
        )}
        <p>
          Pour déplacer un rendez-vous, annulez-le puis réservez un nouveau créneau, ou
          contactez-nous.
        </p>
      </LegalSection>

      <LegalSection title="Retard et absence">
        <p>
          Les rendez-vous s’enchaînent : un retard réduit le temps disponible pour votre prestation
          et peut conduire à l’écourter, ou à la reporter si elle ne peut plus être réalisée
          correctement. Prévenez-nous dès que possible en cas d’imprévu.
        </p>
        <p>
          Une absence sans nouvelle immobilise un créneau qu’une autre cliente aurait pu prendre.
          Aucun frais n’est réclamé, mais des absences répétées peuvent conduire le salon à ne plus
          accepter de réservation en ligne de votre part, et à vous proposer de convenir de vos
          rendez-vous directement avec lui.
        </p>
      </LegalSection>

      <LegalSection title="Tarifs et règlement">
        <p>
          Les tarifs affichés lors de la réservation sont ceux en vigueur. Ils s’entendent par
          prestation ; le total indiqué correspond à la somme des prestations sélectionnées.
        </p>
        <p>
          <strong>Aucun paiement n’est effectué en ligne.</strong> Le moyen de paiement choisi à la
          réservation est une simple indication ; le règlement s’effectue sur place à l’issue de la
          prestation
          {activeMethods.length > 0 && (
            <> — moyens acceptés : {activeMethods.map((m) => m.label).join(', ')}</>
          )}
          .
        </p>
        <p>
          Une prestation affichée sans tarif fait l’objet d’un devis établi sur place, selon le
          travail demandé.
        </p>
      </LegalSection>

      <LegalSection title="Droit de rétractation">
        <p>
          Les prestations de soins corporels fournies à une date déterminée relèvent de l’exception
          prévue à l’article L221-28 du Code de la consommation : le droit de rétractation de
          quatorze jours ne s’y applique pas. Les conditions d’annulation décrites plus haut
          demeurent, elles, pleinement applicables.
        </p>
      </LegalSection>

      <LegalSection title="Photographies de référence">
        <p>
          Les photos que vous joignez servent uniquement à préparer votre prestation. Leur traitement
          est décrit dans notre{' '}
          <Link className="text-primary underline" to="/confidentialite">
            politique de confidentialité
          </Link>
          . Elles ne sont jamais publiées sans votre accord exprès.
        </p>
      </LegalSection>

      <LegalSection title="Nous contacter">
        <p>
          Pour toute question relative à un rendez-vous, écrivez-nous
          {email ? (
            <> à <a className="text-primary underline" href={`mailto:${email}`}>{email}</a></>
          ) : ''}
          {phone ? <> ou appelez le <strong>{phone}</strong></> : ''}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
