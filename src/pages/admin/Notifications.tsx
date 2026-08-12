import { motion } from 'framer-motion';
import {
  Bell, Clock, User, ShieldCheck, Users, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useReminders } from '@/hooks/useReminders';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Reminder } from '@/types/reminder';

const RECIPIENT_ICON: Record<Reminder['recipients'], typeof User> = {
  client: User,
  admin: ShieldCheck,
  both: Users,
};

const RECIPIENT_LABEL: Record<Reminder['recipients'], string> = {
  client: 'Cliente',
  admin: 'Administratrice',
  both: 'Les deux',
};

const DELAY_LABEL: Record<number, string> = {
  24: '24 h avant',
  12: '12 h avant',
  2: '2 h avant',
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatApptDate(date: string, time: string): string {
  return `${new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${time}`;
}

export default function Notifications() {
  const { reminders, pending, loading, refresh, remove } = useReminders();
  const { reminderSettings } = useReminderSettings();
  const [sending, setSending] = useState(false);

  const sent = reminders.filter((r) => r.sent);
  const upcoming = pending.filter((r) => new Date(r.scheduledAt) > new Date());
  const overdue = pending.filter((r) => new Date(r.scheduledAt) <= new Date());

  const sendRemindersNow = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reminders');
      if (error) throw error;
      toast.success(data?.message || '✅ Rappels envoyés avec succès');
      refresh();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de l\'envoi des rappels');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notifications & Rappels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des rappels automatiques programmés pour les rendez-vous.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            className="rounded-full" 
            onClick={sendRemindersNow}
            disabled={sending}
          >
            <Bell className="mr-2 h-4 w-4" /> 
            {sending ? 'Envoi en cours...' : 'Envoyer les rappels maintenant'}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Config active */}
      {reminderSettings && (
        <motion.div {...fadeUp}>
          <Card className={cn(
            'border shadow-soft',
            reminderSettings.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-border/60 bg-secondary/30'
          )}>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'grid h-12 w-12 place-items-center rounded-2xl',
                  reminderSettings.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-secondary text-muted-foreground'
                )}>
                  <Bell className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-medium">
                    Rappels automatiques{' '}
                    <Badge className={cn('ml-1 rounded-full', reminderSettings.enabled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-secondary text-muted-foreground border-border')}>
                      {reminderSettings.enabled ? 'Activés' : 'Désactivés'}
                    </Badge>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {DELAY_LABEL[reminderSettings.delayHours]} · Destinataire : {RECIPIENT_LABEL[reminderSettings.recipients]}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-soft">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{DELAY_LABEL[reminderSettings.delayHours]}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-soft">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{RECIPIENT_LABEL[reminderSettings.recipients]}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Rappels à envoyer plus tard', value: upcoming.length, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'En retard', value: overdue.length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100' },
          { label: 'Envoyés', value: sent.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.07 }}>
            <Card className="border-border/60 shadow-soft">
              <CardContent className="flex items-center gap-3 p-5">
                <span className={cn('grid h-11 w-11 place-items-center rounded-2xl', s.bg, s.color)}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-semibold sm:text-2xl">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rappels programmés */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Clock className="h-5 w-5 text-primary" /> Rappels programmés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
                ))}
              </div>
            ) : upcoming.length === 0 && overdue.length === 0 ? (
              <div className="py-14 text-center">
                <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">Aucun rappel programmé pour le moment.</p>
                <p className="text-xs text-muted-foreground">Les rappels apparaissent dès qu'un rendez-vous est confirmé.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {[...overdue, ...upcoming].map((r, i) => {
                  const Icon = RECIPIENT_ICON[r.recipients];
                  const isOverdue = new Date(r.scheduledAt) <= new Date();
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <span className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                          isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'
                        )}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{r.clientName}</p>
                            <Badge className={cn('rounded-full border text-[10px]',
                              isOverdue ? 'border-rose-200 bg-rose-100 text-rose-700' : 'border-primary/20 bg-primary/10 text-primary'
                            )}>
                              {isOverdue ? 'En retard' : 'Programmé'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{r.serviceName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            RDV : {formatApptDate(r.appointmentDate, r.appointmentTime)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-14 flex flex-col items-start gap-1 sm:ml-0 sm:items-end">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatScheduledAt(r.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          <span>{RECIPIENT_LABEL[r.recipients]}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 h-7 px-2 text-xs text-muted-foreground hover:text-rose-600"
                          title="Supprimer ce rappel"
                          onClick={async () => {
                            if (!confirm(`Supprimer le rappel pour ${r.clientName} ?`)) return;
                            try {
                              await remove(r.id);
                              toast.success('Rappel supprimé.');
                            } catch {
                              toast.error('Impossible de supprimer ce rappel.');
                            }
                          }}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Historique envoyés */}
      {sent.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Rappels envoyés
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {sent.map((r) => {
                  const Icon = RECIPIENT_ICON[r.recipients];
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-4 opacity-70">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">{r.clientName} — {r.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            Envoyé le {formatScheduledAt(r.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" /> {RECIPIENT_LABEL[r.recipients]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}