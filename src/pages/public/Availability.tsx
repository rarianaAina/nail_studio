import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toDateString, isPastDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import { useSettings } from '@/hooks/useSettings';
import type { BusinessHours } from '@/types';
import Seo from '@/components/Seo';

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export default function Availability() {
  const { settings } = useSettings();
  
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [slotsByDate, setSlotsByDate] = useState<Record<string, number>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Charger les créneaux pour le mois affiché
  useEffect(() => {
    const fetchSlotsForMonth = async () => {
      const year = calendarMonth.getFullYear();
      const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
      const daysInMonth = new Date(year, calendarMonth.getMonth() + 1, 0).getDate();
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;

      const { data } = await supabase
        .from('time_slots')
        .select('date, active')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('active', true);

      const grouped: Record<string, number> = {};
      (data || []).forEach((slot) => {
        grouped[slot.date] = (grouped[slot.date] || 0) + 1;
      });
      setSlotsByDate(grouped);
    };

    fetchSlotsForMonth();
  }, [calendarMonth]);

  // Charger les créneaux pour la date sélectionnée.
  // Sans prestation choisie, la durée transmise est nulle : la fonction renvoie
  // alors les créneaux qu'aucun rendez-vous n'occupe déjà. La liste affichée
  // reflète donc les disponibilités réelles, et non la grille brute.
  useEffect(() => {
    if (!selectedDate) { setAvailableSlots([]); return; }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc('get_available_times', {
        p_date: selectedDate,
        p_duration_minutes: 0,
      });
      if (!mounted) return;
      if (error) {
        console.error(error);
        setAvailableSlots([]);
      } else {
        setAvailableSlots((data as { slot_label: string }[] | null)?.map((r) => r.slot_label) ?? []);
      }
    })();
    return () => { mounted = false; };
  }, [selectedDate]);

  const isDayAvailable = (dateStr: string): boolean => {
    const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayHours = settings?.hours?.find((h: BusinessHours) => h.day === dayName);
    if (!settings?.hours || !dayHours) return true;
    return !dayHours.closed;
  };

  const hasSlots = (dateStr: string): boolean => {
    return !!slotsByDate[dateStr];
  };

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [calendarMonth]);

  return (
    <div>
      <Seo
        title="Créneaux disponibles"
        description="Consultez les créneaux disponibles du salon, jour par jour, avant de réserver votre rendez-vous."
      />
      {/* Hero */}
      <section className="gradient-rose pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Disponibilités
            </Badge>
            <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">
              Créneaux disponibles
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              Consultez les créneaux disponibles pour chaque date.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Calendrier */}
            <motion.div {...fadeUp}>
              <Card className="border-border/60 shadow-soft">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">
                      {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                        aria-label="Mois précédent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                        aria-label="Mois suivant"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekDays.map((d) => (
                      <div key={d} className="py-1 text-[10px] font-medium text-muted-foreground">
                        {d}
                      </div>
                    ))}
                    {calendarCells.map((dateObj, i) => {
                      if (!dateObj) {
                        return <div key={i} className="aspect-square" />;
                      }
                      const iso = toDateString(dateObj);
                      const isToday = iso === toDateString(new Date());
                      const isSelected = iso === selectedDate;
                      const isDayOpen = isDayAvailable(iso);
                      const hasAvailableSlots = hasSlots(iso) && isDayOpen && !isPastDate(iso);
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (hasAvailableSlots) {
                              setSelectedDate(iso);
                            }
                          }}
                          disabled={!hasAvailableSlots}
                          className={cn(
                            'aspect-square rounded-lg text-sm transition-all flex flex-col items-center justify-center',
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-glow'
                              : hasAvailableSlots
                              ? 'bg-primary/5 text-primary hover:bg-primary/10 hover:scale-105 cursor-pointer'
                              : 'text-muted-foreground cursor-default opacity-40',
                            isToday && !isSelected && hasAvailableSlots && 'ring-1 ring-primary/30'
                          )}
                        >
                          <span className={cn(
                            isSelected && 'font-bold',
                            isToday && !isSelected && 'font-bold'
                          )}>
                            {dateObj.getDate()}
                          </span>
                          {hasAvailableSlots && (
                            <div className={cn(
                              'mt-0.5 h-1 w-1 rounded-full',
                              isSelected ? 'bg-primary-foreground' : 'bg-primary'
                            )} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      <span>Créneaux disponibles</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
                      <span>Aucun créneau</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary ring-1 ring-primary/30" />
                      <span>Aujourd'hui</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Liste des créneaux */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card className="border-border/60 shadow-soft h-full">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Créneaux du {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </h3>
                  
                  {availableSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm">Aucun créneau disponible pour cette date</p>
                      <p className="text-xs mt-1">Sélectionnez une autre date dans le calendrier</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {availableSlots.map((slot, index) => (
                        <motion.div
                          key={slot}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
                        >
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">{slot}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {index + 1} / {availableSlots.length}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {availableSlots.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <p className="text-xs text-muted-foreground text-center">
                        {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''} disponible{availableSlots.length > 1 ? 's' : ''} pour cette date
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}