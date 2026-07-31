import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useConfig } from '@/hooks/useConfig';

export default function TimeSlotsSettings() {
  const {
    timeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  } = useConfig();

  const [newSlot, setNewSlot] = useState('');

  const handleAdd = async () => {
    if (!newSlot.trim()) return;
    try {
      await createTimeSlot({ label: newSlot, sortOrder: timeSlots.length + 1 });
      setNewSlot('');
      toast.success('Créneau ajouté.');
    } catch {
      toast.error('Erreur lors de l\'ajout du créneau.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Créneaux horaires disponibles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gérez les créneaux proposés lors de la réservation. Désactivez un créneau pour le rendre indisponible.
          </p>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((s) => (
              <div key={s.id} className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                s.active ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border bg-secondary text-muted-foreground line-through'
              )}>
                <span>{s.label}</span>
                <Switch
                  checked={s.active}
                  onCheckedChange={(v) => updateTimeSlot(s.id, { active: v })}
                  className="scale-75"
                />
                <button onClick={() => deleteTimeSlot(s.id)} className="text-muted-foreground hover:text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="time"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="w-32"
            />
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter un créneau
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}