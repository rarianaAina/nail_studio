import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments, statusColors, statusLabels, formatAriary, type AppointmentStatus } from '@/lib/data';
import { cn } from '@/lib/utils';

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(new Date().toISOString().slice(0, 10));

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const byDate = useMemo(() => {
    const map: Record<string, typeof appointments> = {};
    appointments.forEach((a) => {
      (map[a.date] ||= []).push(a);
    });
    return map;
  }, []);

  const selectedAppointments = selected ? byDate[selected] || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Calendrier</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue mensuelle des rendez-vous du salon.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-soft lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                {cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1">
              {weekdays.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
                  {d}
                </div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="min-h-[56px] rounded-xl bg-secondary/20 sm:min-h-[80px]" />;
                const iso = d.toISOString().slice(0, 10);
                const appts = byDate[iso] || [];
                const isToday = iso === new Date().toISOString().slice(0, 10);
                const isSelected = iso === selected;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(iso)}
                    className={cn(
                      'min-h-[56px] rounded-xl border p-1 text-left transition-all sm:min-h-[80px] sm:p-2',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-glow'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold sm:h-6 sm:w-6 sm:text-xs',
                          isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {appts.length > 0 && (
                        <span className="text-[9px] font-medium text-primary sm:text-[10px]">
                          {appts.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 hidden space-y-0.5 sm:block">
                      {appts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className="truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        >
                          {a.time} {a.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {appts.length > 2 && (
                        <div className="px-1.5 text-[10px] text-muted-foreground">
                          +{appts.length - 2} autres
                        </div>
                      )}
                    </div>
                    {/* Mobile: dot indicator instead of chips */}
                    {appts.length > 0 && (
                      <div className="mt-1 flex justify-center gap-0.5 sm:hidden">
                        {appts.slice(0, 3).map((a) => (
                          <span key={a.id} className="h-1 w-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {selected
                ? new Date(selected).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Sélectionnez une date'}
            </h2>
            <div className="mt-4 space-y-2">
              {selectedAppointments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucun rendez-vous ce jour.
                </p>
              ) : (
                selectedAppointments.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/60 bg-secondary/30 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {a.time}
                      </span>
                      <Badge className={cn('border', statusColors[a.status as AppointmentStatus])}>
                        {statusLabels[a.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{a.serviceName}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{formatAriary(a.price)}</p>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
