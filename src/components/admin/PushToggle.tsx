import { BellRing, BellOff, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/utils/cn';

/**
 * Activation des notifications sur l'appareil courant.
 *
 * L'abonnement est propre à chaque appareil : l'activer sur l'ordinateur du
 * salon ne notifie pas le téléphone. Le libellé le dit explicitement, faute de
 * quoi la praticienne croirait être couverte partout.
 */
export default function PushToggle() {
  const { etat, occupe, activer, desactiver } = usePushNotifications();

  if (etat === 'indisponible') {
    return (
      <Card className="border-border/60 shadow-soft">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <BellOff className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">Notifications indisponibles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce navigateur ne les prend pas en charge. Sur iPhone, ajoutez d'abord
              l'application à l'écran d'accueil.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etat === 'refuse') {
    return (
      <Card className="border-amber-200 bg-amber-50 shadow-soft">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <BellOff className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-amber-900">Notifications bloquées</p>
            <p className="mt-1 text-sm text-amber-800">
              Vous les avez refusées pour ce site. Le navigateur ne permet plus de vous
              les redemander : rétablissez-les dans ses paramètres, à la rubrique
              autorisations du site.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const actif = etat === 'actif';

  return (
    <Card className={cn('shadow-soft', actif ? 'border-emerald-200 bg-emerald-50' : 'border-border/60')}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
              actif ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'
            )}
          >
            {actif ? <BellRing className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
          </span>
          <div>
            <p className="flex items-center gap-2 font-medium">
              Notifications sur cet appareil
              <Badge
                className={cn(
                  'rounded-full border text-[10px]',
                  actif
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                    : 'border-border bg-secondary text-muted-foreground'
                )}
              >
                {actif ? 'Activées' : 'Désactivées'}
              </Badge>
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {actif
                ? 'Vous êtes prévenue dès qu\'une réservation ou une annulation arrive, même application fermée.'
                : 'Soyez prévenue dès qu\'une réservation arrive, sans avoir à ouvrir l\'administration.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ce réglage ne vaut que pour cet appareil. Activez-le aussi sur votre téléphone.
            </p>
          </div>
        </div>

        <Button
          variant={actif ? 'outline' : 'default'}
          className="shrink-0 rounded-full"
          disabled={occupe}
          onClick={async () => {
            try {
              if (actif) {
                await desactiver();
                toast.success('Notifications désactivées sur cet appareil.');
              } else {
                await activer();
                toast.success('Notifications activées.');
              }
            } catch {
              toast.error('Impossible de modifier les notifications.');
            }
          }}
        >
          {occupe ? 'Patientez…' : actif ? 'Désactiver' : 'Activer'}
        </Button>
      </CardContent>
    </Card>
  );
}
