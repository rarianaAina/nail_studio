// src/pages/admin/settings/Hours.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import type { BusinessHours } from '@/types';

export default function HoursSettings() {
  const { settings, updateSettings } = useSettings();
  const [hours, setHours] = useState<BusinessHours[]>([]);

  useEffect(() => {
    if (!settings) return;
    setHours(settings.hours);
  }, [settings]);

  const save = async () => {
    await updateSettings({ hours });
    toast.success('Horaires enregistrés.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Horaires d'ouverture</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.day} className="flex flex-col gap-2 border-b border-border/60 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-24 font-medium sm:w-28">{h.day}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={h.open}
                  disabled={h.closed}
                  onChange={(e) => setHours((prev) => prev.map((x, j) => j === i ? { ...x, open: e.target.value } : x))}
                  className="w-full flex-1 sm:w-28 sm:flex-none"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={h.close}
                  disabled={h.closed}
                  onChange={(e) => setHours((prev) => prev.map((x, j) => j === i ? { ...x, close: e.target.value } : x))}
                  className="w-full flex-1 sm:w-28 sm:flex-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                <input
                  type="checkbox"
                  checked={!!h.closed}
                  onChange={(e) => setHours((prev) => prev.map((x, j) => j === i ? { ...x, closed: e.target.checked } : x))}
                  className="accent-primary"
                />
                Fermé
              </label>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Button className="rounded-full" onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer les horaires
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}