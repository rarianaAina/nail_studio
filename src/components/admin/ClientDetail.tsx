import { useEffect, useState } from 'react';
import { Phone, Mail, Calendar, Wallet, Sparkles, ImageIcon, Save, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Client, SuppressionCliente } from '@/types';
import { getTotalPrice, getTotalDuration, getServiceNames } from '@/types';
import { useClientHistory } from '@/hooks/useClientHistory';
import { formatAriary, formatDuration, STATUS_COLORS, STATUS_LABELS } from '@/utils';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

interface ClientDetailProps {
  client: Client | null;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<SuppressionCliente>;
}

const PHOTO_LABELS: Record<string, string> = {
  left: 'Main gauche',
  right: 'Main droite',
  inspiration: 'Inspiration',
};

export default function ClientDetail({ client, onClose, onSaveNotes, onDelete }: ClientDetailProps) {
  const { appointments, photos, completedCount, cancelledCount, loading } = useClientHistory(client?.id);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [suppression, setSuppression] = useState(false);

  // Repartir des notes enregistrées à chaque changement de cliente, sans quoi
  // la saisie en cours suivrait d'une fiche à l'autre.
  useEffect(() => {
    setNotes(client?.notes ?? '');
  }, [client?.id, client?.notes]);

  if (!client) return null;

  const dirty = notes !== (client.notes ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveNotes(client.id, notes);
      toast.success('Notes enregistrées.');
    } catch {
      toast.error('Impossible d\'enregistrer les notes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSuppression(true);
    try {
      const r = await onDelete(client.id);

      // Le détail est annoncé plutôt qu'un simple « supprimée » : la gérante
      // doit pouvoir constater que l'historique comptable est resté en place.
      toast.success(`${r.nom} supprimée.`, {
        description:
          `${r.rendezVousAnonymises} rendez-vous anonymisé(s), conservés pour la comptabilité.` +
          (r.compteSupprime ? ' Son compte de connexion a été supprimé.' : ''),
      });
      setConfirmation(false);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La suppression a échoué.');
    } finally {
      setSuppression(false);
    }
  };

  const stats = [
    { label: 'Visites', value: String(client.visitCount), icon: Calendar },
    { label: 'Total dépensé', value: formatAriary(client.totalSpent), icon: Wallet },
    { label: 'Points fidélité', value: String(client.loyaltyPoints), icon: Sparkles },
  ];

  return (
    <>
      <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{client.name}</DialogTitle>
          <DialogDescription>
            Cliente depuis {client.createdAt ? formatDate(client.createdAt.slice(0, 10)) : 'une date inconnue'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coordonnées */}
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" /> {client.phone}
            </a>
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" /> {client.email}
              </a>
            )}
          </div>

          {/* Chiffres clés */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-center">
                <s.icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1.5 font-semibold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Notes de suivi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notes de suivi</h3>
              {dirty && (
                <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Enregistrer
                </Button>
              )}
            </div>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, préférences, sensibilité, teintes habituelles…"
            />
            <p className="text-xs text-muted-foreground">
              Ces notes sont internes au salon. La cliente n'y a pas accès.
            </p>
          </div>

          {/* Photos de toutes les visites */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 font-medium">
              <ImageIcon className="h-4 w-4" /> Photos des visites
              {photos.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>
              )}
            </h3>
            {photos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                Aucune photo déposée par cette cliente.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                  <a
                    key={`${p.appointmentId}-${p.id}`}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                    title={`${PHOTO_LABELS[p.type] ?? p.type} — ${formatDate(p.date)}`}
                  >
                    <img
                      src={p.url}
                      alt={`${PHOTO_LABELS[p.type] ?? p.type} du ${p.date}`}
                      loading="lazy"
                      className="h-20 w-20 rounded-lg border border-border/60 object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/55 px-1 py-0.5 text-[9px] text-white">
                      {new Date(p.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Historique */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Historique</h3>
              {appointments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {completedCount} terminé{completedCount > 1 ? 's' : ''}
                  {cancelledCount > 0 && ` · ${cancelledCount} annulé${cancelledCount > 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {loading ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Chargement…</p>
            ) : appointments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                Aucun rendez-vous enregistré.
              </p>
            ) : (
              <ul className="space-y-2">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{getServiceNames(a) || 'Prestation'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.date)} à {a.time} · {formatDuration(getTotalDuration(a))}
                      </p>
                      {a.clientNotes && (
                        <p className="mt-1 text-xs italic text-muted-foreground">« {a.clientNotes} »</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge className={cn('mb-1', STATUS_COLORS[a.status])}>
                        {STATUS_LABELS[a.status]}
                      </Badge>
                      <p className="text-sm font-semibold text-primary">
                        {formatAriary(getTotalPrice(a))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setConfirmation(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer la cliente
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="mr-1.5 h-4 w-4" /> Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Une confirmation qui ne dit pas ce qu'elle emporte ne protège de
          rien : les conséquences sont énoncées, et la cliente nommée. */}
      <AlertDialog open={confirmation} onOpenChange={(o) => !o && setConfirmation(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {client.name} ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Sa fiche disparaît définitivement : coordonnées, notes de suivi et points de fidélité.</p>
                <p>
                  <strong>Ses rendez-vous sont conservés</strong> mais anonymisés —
                  montants et dates restent dans vos statistiques, plus rien n'y désigne une personne.
                  La loi impose de garder dix ans les pièces comptables.
                </p>
                <p>Ses photographies et ses avis sont dépouillés de toute identité.</p>
                <p className="text-rose-600">Cette opération est irréversible.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suppression}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={suppression}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={(e) => {
                // La fermeture par défaut interviendrait avant la fin de la
                // requête : un échec passerait alors inaperçu.
                e.preventDefault();
                void handleDelete();
              }}
            >
              {suppression ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
