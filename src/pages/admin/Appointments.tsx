import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Pencil, Check, X, CalendarPlus, Bell } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useAppointments } from '@/hooks/useAppointments';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { reminderService } from '@/services/reminderService';
import { formatAriary, STATUS_COLORS, STATUS_LABELS } from '@/utils';
import type { Appointment, AppointmentStatus } from '@/types';

const FILTERS: ('Tous' | AppointmentStatus)[] = ['Tous', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function Appointments() {
  const { appointments, updateStatus } = useAppointments();
  const { reminderSettings } = useReminderSettings();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Tous' | AppointmentStatus>('Tous');
  const [viewing, setViewing] = useState<Appointment | null>(null);

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        const matchQ =
          a.clientName.toLowerCase().includes(query.toLowerCase()) ||
          a.phone.includes(query) ||
          a.serviceName.toLowerCase().includes(query.toLowerCase());
        const matchF = filter === 'Tous' || a.status === filter;
        return matchQ && matchF;
      }),
    [appointments, query, filter]
  );

  const handleStatus = async (id: string, status: AppointmentStatus) => {
    await updateStatus(id, status);

    if (status === 'confirmed' && reminderSettings?.enabled) {
      const appt = appointments.find((a) => a.id === id);
      if (appt) {
        try {
          await reminderService.create({
            appointmentId: appt.id,
            clientName: appt.clientName,
            clientPhone: appt.phone,
            clientEmail: appt.email,
            serviceName: appt.serviceName,
            appointmentDate: appt.date,
            appointmentTime: appt.time,
            recipients: reminderSettings.recipients,
            delayHours: reminderSettings.delayHours,
          });
          toast.success(
            `Rendez-vous confirmé. Un rappel sera envoyé ${reminderSettings.delayHours} h avant à : ${
              reminderSettings.recipients === 'client' ? 'la cliente' :
              reminderSettings.recipients === 'admin' ? "l'administratrice" : 'la cliente et l\'administratrice'
            }.`,
            { duration: 5000, icon: <Bell className="h-4 w-4" /> }
          );
        } catch {
          toast.success(`Statut mis à jour : ${STATUS_LABELS[status]}`);
        }
      }
    } else if (status === 'cancelled') {
      try {
        await reminderService.deleteByAppointmentId(id);
      } catch { /* silent — rappel peut ne pas exister */ }
      toast.success(`Statut mis à jour : ${STATUS_LABELS[status]}`);
    } else {
      toast.success(`Statut mis à jour : ${STATUS_LABELS[status]}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Rendez-vous</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez et suivez tous les rendez-vous du salon.
          </p>
        </div>
        <Button className="rounded-full">
          <CalendarPlus className="mr-2 h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      {/* Info rappel actif */}
      {reminderSettings?.enabled && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Bell className="h-4 w-4 shrink-0" />
          <span>
            Rappels activés — envoi automatique{' '}
            <span className="font-semibold">{reminderSettings.delayHours} h avant</span>{' '}
            chaque rendez-vous confirmé.
          </span>
        </div>
      )}

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une cliente, un téléphone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    filter === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground/70 hover:border-primary/40'
                  )}
                >
                  {f === 'Tous' ? 'Tous' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                  >
                    <TableCell className="font-medium">{a.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                    <TableCell>{a.serviceName}</TableCell>
                    <TableCell className="font-medium text-primary">{formatAriary(a.price)}</TableCell>
                    <TableCell>
                      {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', STATUS_COLORS[a.status])}>
                          {STATUS_LABELS[a.status]}
                        </span>
                        {a.status === 'confirmed' && reminderSettings?.enabled && (
                          <span title="Rappel programmé" className="text-primary">
                            <Bell className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {a.status === 'pending' && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleStatus(a.id, 'confirmed')}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => handleStatus(a.id, 'cancelled')}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      Aucun rendez-vous trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-border/60 md:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.status === 'confirmed' && reminderSettings?.enabled && (
                      <Bell className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-xs', STATUS_COLORS[a.status])}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm">{a.serviceName}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {a.time}
                  </span>
                  <span className="text-sm font-semibold text-primary">{formatAriary(a.price)}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  <Button size="sm" variant="outline" className="h-8 flex-1 rounded-full" onClick={() => setViewing(a)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Voir
                  </Button>
                  {a.status === 'pending' && (
                    <Button size="sm" variant="outline" className="h-8 flex-1 rounded-full text-emerald-600" onClick={() => handleStatus(a.id, 'confirmed')}>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Confirmer
                    </Button>
                  )}
                  {a.status !== 'cancelled' && a.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="h-8 flex-1 rounded-full text-rose-600" onClick={() => handleStatus(a.id, 'cancelled')}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun rendez-vous trouvé.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
            <DialogDescription>Informations complètes du rendez-vous sélectionné.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{viewing.clientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{viewing.phone}</span></div>
              {viewing.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewing.email}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Prestation</span><span>{viewing.serviceName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Prix</span><span className="font-medium text-primary">{formatAriary(viewing.price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(viewing.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heure</span><span>{viewing.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge className={cn('border', STATUS_COLORS[viewing.status])}>{STATUS_LABELS[viewing.status]}</Badge></div>
              {viewing.status === 'confirmed' && reminderSettings?.enabled && (
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">
                    Rappel programmé {reminderSettings.delayHours} h avant le rendez-vous.
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
