import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Copy, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useConfig } from '@/hooks/useConfig';
import { toDateString, isToday } from '@/utils/date';

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function TimeSlotsSettings() {
  const {
    timeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  } = useConfig();

  const [selectedDate, setSelectedDate] = useState<string>(
    toDateString(new Date())
  );
  const [newSlot, setNewSlot] = useState('');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daySlots = useMemo(() => {
    return timeSlots
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [timeSlots, selectedDate]);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, typeof timeSlots> = {};
    timeSlots.forEach((slot) => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    });
    return grouped;
  }, [timeSlots]);

  const handleAdd = async () => {
    if (!newSlot.trim()) return;
    try {
      await createTimeSlot({
        date: selectedDate,
        label: newSlot,
        sortOrder: daySlots.length,
        active: true,
      });
      setNewSlot('');
      toast.success('Créneau ajouté.');
    } catch {
      toast.error('Erreur lors de l\'ajout du créneau.');
    }
  };

  const handleCopy = async (fromDate: string, toDate: string) => {
    if (fromDate === toDate) return;
    
    const sourceSlots = timeSlots.filter((s) => s.date === fromDate);
    if (sourceSlots.length === 0) {
      toast.error('Aucun créneau à copier pour cette date.');
      return;
    }

    const fromLabel = new Date(fromDate + 'T00:00:00').toLocaleDateString('fr-FR');
    const toLabel = new Date(toDate + 'T00:00:00').toLocaleDateString('fr-FR');
    if (!confirm(`Copier les créneaux du ${fromLabel} vers le ${toLabel} ?`)) return;

    try {
      const targetSlots = timeSlots.filter((s) => s.date === toDate);
      for (const slot of targetSlots) {
        await deleteTimeSlot(slot.id);
      }

      for (const slot of sourceSlots) {
        await createTimeSlot({
          date: toDate,
          label: slot.label,
          sortOrder: slot.sortOrder,
          active: slot.active,
        });
      }

      toast.success('Créneaux copiés avec succès.');
    } catch {
      toast.error('Erreur lors de la copie.');
    }
  };

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Créneaux horaires par date</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Gérez les créneaux disponibles pour chaque date spécifique. Chaque date peut avoir ses propres créneaux.
          </p>

          {/* Calendrier */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-medium uppercase text-muted-foreground">
                  {d}
                </div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="min-h-[56px] rounded-xl bg-secondary/20" />;
                
                const iso = toDateString(d);
                const isTodayDate = isToday(iso);
                const isSelected = iso === selectedDate;
                const hasSlots = slotsByDate[iso] && slotsByDate[iso].length > 0;
                const activeSlots = slotsByDate[iso]?.filter(s => s.active).length || 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(iso)}
                    className={cn(
                      'min-h-[56px] rounded-xl border p-1 text-left transition-all sm:p-2',
                      isSelected ? 'border-primary bg-primary/5 shadow-glow' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'grid h-6 w-6 place-items-center rounded-full text-xs font-semibold',
                        isTodayDate ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      )}>
                        {d.getDate()}
                      </span>
                      {hasSlots && (
                        <span className="text-[9px] font-medium text-primary">
                          {activeSlots} créneau{activeSlots > 1 ? 'x' : ''}
                        </span>
                      )}
                    </div>
                    {hasSlots && (
                      <div className="mt-1 hidden sm:block">
                        {slotsByDate[iso]?.slice(0, 2).map((s) => (
                          <div key={s.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[8px] text-primary">
                            {s.label} {!s.active && '(off)'}
                          </div>
                        ))}
                        {slotsByDate[iso]?.length > 2 && (
                          <div className="text-[8px] text-muted-foreground">+{slotsByDate[iso].length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Créneaux du jour sélectionné */}
          <div className="border-t border-border/60 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                Créneaux du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fromDate = prompt('Copier depuis quelle date ? (YYYY-MM-DD)');
                  if (fromDate) handleCopy(fromDate, selectedDate);
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copier depuis
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[50px]">
              {daySlots.length === 0 ? (
                <div className="w-full py-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-xl border-border/60">
                  Aucun créneau pour cette date
                </div>
              ) : (
                daySlots.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                      s.active
                        ? 'border-primary/30 bg-primary/5 text-foreground'
                        : 'border-border bg-secondary text-muted-foreground line-through'
                    )}
                  >
                    <span>{s.label}</span>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(v) => updateTimeSlot(s.id, { active: v })}
                      className="scale-75"
                    />
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le créneau ${s.label} ?`)) {
                          deleteTimeSlot(s.id);
                          toast.success('Créneau supprimé.');
                        }
                      }}
                      className="text-muted-foreground hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <Input
                type="time"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="w-32"
                placeholder="HH:MM"
              />
              <Button variant="outline" onClick={handleAdd}>
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}