import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Pencil, Check, X, CalendarPlus, Bell } from 'lucide-react';
import { useNailServices } from '@/hooks/useNailServices';
import { useClients } from '@/hooks/useClients';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useAppointments } from '@/hooks/useAppointments';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { reminderService } from '@/services/reminderService';
import { supabase } from '@/lib/supabase';
import { formatAriary, STATUS_COLORS, STATUS_LABELS } from '@/utils';
import { getTotalPrice, getTotalDuration, getServiceNames } from '@/types';
import type { Appointment, AppointmentStatus } from '@/types';

const FILTERS: ('Tous' | AppointmentStatus)[] = ['Tous', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function Appointments() {
  const { appointments, updateStatus, createAppointment, refresh } = useAppointments();
  const { reminderSettings } = useReminderSettings();
  const { services } = useNailServices();
  const { clients } = useClients();
  const { paymentMethods, loading: loadingPayments } = usePaymentMethods();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Tous' | AppointmentStatus>('Tous');
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAppt, setNewAppt] = useState({
    clientId: '',
    clientName: '',
    phone: '',
    email: '',
    serviceIds: [] as string[], // ✅ Changé de serviceId à serviceIds (tableau)
    date: '',
    time: '09:00',
    paymentMethodId: '',
    notes: '',
  });

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        const serviceNames = getServiceNames(a);
        const matchQ =
          a.clientName.toLowerCase().includes(query.toLowerCase()) ||
          a.phone.includes(query) ||
          serviceNames.toLowerCase().includes(query.toLowerCase());
        const matchF = filter === 'Tous' || a.status === filter;
        return matchQ && matchF;
      }),
    [appointments, query, filter]
  );

  // Récupérer le libellé du moyen de paiement
  const getPaymentMethodLabel = (paymentMethodId?: string) => {
    if (!paymentMethodId) return 'Non renseigné';
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    return method?.label || paymentMethodId;
  };

  const getPaymentMethodIcon = (paymentMethodId?: string) => {
    if (!paymentMethodId) return '💳';
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    return method?.icon || '💳';
  };

  const handleStatus = async (id: string, status: AppointmentStatus) => {
    await updateStatus(id, status);

    if (status === 'confirmed' && reminderSettings?.enabled) {
      const appt = appointments.find((a) => a.id === id);
      if (appt) {
        try {
          const serviceNames = getServiceNames(appt);
          await reminderService.create({
            appointmentId: appt.id,
            clientName: appt.clientName,
            clientPhone: appt.phone,
            clientEmail: appt.email,
            serviceName: serviceNames,
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

  // ✅ Fonction pour basculer la sélection d'un service dans le formulaire de création
  const toggleServiceSelection = (serviceId: string) => {
    setNewAppt(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
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
        <Button className="rounded-full" onClick={() => setShowCreate(true)}>
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
                  <TableHead>Prestation(s)</TableHead>
                  <TableHead>Prix total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const totalPrice = getTotalPrice(a);
                  const serviceNames = getServiceNames(a);
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                    >
                      <TableCell className="font-medium">{a.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={serviceNames}>
                        {serviceNames}
                      </TableCell>
                      <TableCell className="font-medium text-primary">{formatAriary(totalPrice)}</TableCell>
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
                  );
                })}
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
            {filtered.map((a) => {
              const totalPrice = getTotalPrice(a);
              const serviceNames = getServiceNames(a);
              return (
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
                  <p className="mt-2 text-sm truncate">{serviceNames}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {a.time}
                    </span>
                    <span className="text-sm font-semibold text-primary">{formatAriary(totalPrice)}</span>
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
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun rendez-vous trouvé.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>Créez un rendez-vous pour une cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente existante (optionnel)</Label>
              <Select
                value={newAppt.clientId}
                onValueChange={(v) => {
                  const c = clients.find((c) => c.id === v);
                  setNewAppt((p) => ({
                    ...p,
                    clientId: v,
                    clientName: c?.name ?? '',
                    phone: c?.phone ?? '',
                    email: c?.email ?? '',
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner une cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!newAppt.clientId && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="na-name">Nom *</Label>
                  <Input id="na-name" value={newAppt.clientName} onChange={(e) => setNewAppt((p) => ({ ...p, clientName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="na-phone">Téléphone *</Label>
                  <Input id="na-phone" value={newAppt.phone} onChange={(e) => setNewAppt((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="na-email">Email (optionnel)</Label>
                  <Input id="na-email" type="email" value={newAppt.email} onChange={(e) => setNewAppt((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </>
            )}
            
            {/* ✅ Sélection multiple des prestations */}
            <div className="space-y-1.5">
              <Label>Prestations * (sélectionnez une ou plusieurs)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {services.map((s) => {
                  const isSelected = newAppt.serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServiceSelection(s.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2 text-xs transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className={cn(
                        'grid h-5 w-5 place-items-center rounded-full border-2',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatAriary(s.price)}</span>
                    </button>
                  );
                })}
              </div>
              {newAppt.serviceIds.length === 0 && (
                <p className="text-xs text-rose-500">Veuillez sélectionner au moins une prestation</p>
              )}
              {newAppt.serviceIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newAppt.serviceIds.length} prestation(s) sélectionnée(s)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="na-date">Date *</Label>
                <Input id="na-date" type="date" value={newAppt.date} onChange={(e) => setNewAppt((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="na-time">Heure *</Label>
                <Input id="na-time" type="time" value={newAppt.time} onChange={(e) => setNewAppt((p) => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            
            {/* Moyen de paiement */}
            <div className="space-y-1.5">
              <Label>Moyen de paiement</Label>
              <Select
                value={newAppt.paymentMethodId}
                onValueChange={(v) => setNewAppt((p) => ({ ...p, paymentMethodId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner un moyen de paiement" /></SelectTrigger>
                <SelectContent>
                  {loadingPayments ? (
                    <SelectItem value="" disabled>Chargement...</SelectItem>
                  ) : paymentMethods.length === 0 ? (
                    <SelectItem value="" disabled>Aucun moyen de paiement</SelectItem>
                  ) : (
                    paymentMethods.filter(m => m.active).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.icon || '💳'}</span>
                          {m.label}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="na-notes">Notes (optionnel)</Label>
              <Textarea id="na-notes" value={newAppt.notes} onChange={(e) => setNewAppt((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button
              disabled={creating || !newAppt.clientName || !newAppt.phone || newAppt.serviceIds.length === 0 || !newAppt.date}
              onClick={async () => {
                setCreating(true);
                try {
                  let clientId = newAppt.clientId || undefined;
                  let clientName = newAppt.clientName;
                  let phone = newAppt.phone;
                  let email = newAppt.email || undefined;

                  if (!clientId && email) {
                    const { data: existing } = await supabase
                      .from('clients')
                      .select('id, name, phone')
                      .eq('email', email)
                      .maybeSingle();
                    if (existing) {
                      const row = existing as { id: string; name: string; phone: string };
                      clientId = row.id;
                      clientName = row.name;
                      phone = row.phone;
                    }
                  }

                  if (!clientId && clientName && phone) {
                    const { data: created, error: clientErr } = await supabase
                      .from('clients')
                      .insert({ name: clientName, phone, email: email ?? null })
                      .select('id')
                      .single();
                    if (!clientErr) {
                      clientId = (created as { id: string }).id;
                    }
                  }

                  await createAppointment({
                    clientId,
                    clientName,
                    phone,
                    email,
                    serviceIds: newAppt.serviceIds, // ✅ Changé de serviceId à serviceIds
                    date: newAppt.date,
                    time: newAppt.time,
                    paymentMethodId: newAppt.paymentMethodId || undefined,
                    notes: newAppt.notes || undefined,
                  });
                  toast.success('Rendez-vous créé.');
                  setShowCreate(false);
                  setNewAppt({ clientId: '', clientName: '', phone: '', email: '', serviceIds: [], date: '', time: '09:00', paymentMethodId: '', notes: '' });
                  await refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? 'Création...' : 'Créer le rendez-vous'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              
              {/* ✅ Affichage des services */}
              <div className="space-y-1">
                <span className="text-muted-foreground">Prestations</span>
                {viewing.services.map((s, index) => (
                  <div key={index} className="flex justify-between text-sm pl-4">
                    <span>{s.name}</span>
                    <span>{formatAriary(s.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-border/60 pt-1 mt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatAriary(getTotalPrice(viewing))}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Durée totale</span>
                  <span>{getTotalDuration(viewing)} min</span>
                </div>
              </div>

              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(viewing.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heure</span><span>{viewing.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge className={cn('border', STATUS_COLORS[viewing.status])}>{STATUS_LABELS[viewing.status]}</Badge></div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Moyen de paiement</span>
                <span className="font-medium flex items-center gap-2">
                  <span className="text-lg">{getPaymentMethodIcon(viewing.paymentMethodId)}</span>
                  {getPaymentMethodLabel(viewing.paymentMethodId)}
                </span>
              </div>
              
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