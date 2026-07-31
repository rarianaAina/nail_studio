import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label'; // ✅ Supprimé car non utilisé
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useConfig } from '@/hooks/useConfig';

const DAYS = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

export default function TimeSlotsSettings() {
  const {
    timeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  } = useConfig();

  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [newSlot, setNewSlot] = useState('');

  // Créneaux du jour sélectionné
  const daySlots = useMemo(() => {
    return timeSlots
      .filter((s) => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [timeSlots, selectedDay]);

  // Ajouter un créneau pour le jour sélectionné
  const handleAdd = async () => {
    if (!newSlot.trim()) return;
    try {
      await createTimeSlot({
        dayOfWeek: selectedDay, // ✅ Ajout du dayOfWeek requis
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

  // Copier les créneaux d'un jour vers un autre
  const handleCopy = async (fromDay: string, toDay: string) => {
    if (fromDay === toDay) return;
    
    const sourceSlots = timeSlots.filter((s) => s.dayOfWeek === fromDay);
    if (sourceSlots.length === 0) {
      toast.error('Aucun créneau à copier pour ce jour.');
      return;
    }

    if (!confirm(`Copier les créneaux de ${DAYS.find(d => d.value === fromDay)?.label} vers ${DAYS.find(d => d.value === toDay)?.label} ?`)) return;

    try {
      // Supprimer les créneaux existants du jour cible
      const targetSlots = timeSlots.filter((s) => s.dayOfWeek === toDay);
      for (const slot of targetSlots) {
        await deleteTimeSlot(slot.id);
      }

      // Créer les nouveaux créneaux
      for (const slot of sourceSlots) {
        await createTimeSlot({
          dayOfWeek: toDay,
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

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Créneaux horaires par jour</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gérez les créneaux disponibles pour chaque jour de la semaine. Chaque jour peut avoir ses propres créneaux.
          </p>

          {/* Sélecteur de jour */}
          <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  selectedDay === day.value
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Liste des créneaux du jour */}
          <div className="min-h-[100px]">
            {daySlots.length === 0 ? (
              <div className="flex h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-border/60">
                <p className="text-sm text-muted-foreground">
                  Aucun créneau pour {DAYS.find(d => d.value === selectedDay)?.label}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => (
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
                ))}
              </div>
            )}
          </div>

          {/* Ajouter un créneau */}
          <div className="flex gap-2 border-t border-border/60 pt-4">
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

          {/* Copier les créneaux */}
          <div className="border-t border-border/60 pt-4">
            <p className="text-sm font-medium mb-2">Copier les créneaux</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground">→</span>
              <select
                id="copy-target"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {DAYS.filter((d) => d.value !== selectedDay).map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = document.getElementById('copy-target') as HTMLSelectElement;
                  if (target) {
                    handleCopy(selectedDay, target.value);
                  }
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" /> Copier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}