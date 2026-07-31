import { motion } from 'framer-motion';
import { Save, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAppointmentSettings } from '@/hooks/useAppointmentSettings';

export default function CancellationSettings() {
  const { settings, updateSettings } = useAppointmentSettings();

  const handleSave = async () => {
    if (!settings) return;
    await updateSettings(settings);
    toast.success('Paramètres d\'annulation enregistrés.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Annulation de rendez-vous</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configurez les règles d'annulation pour vos clientes.
          </p>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Autoriser les annulations</Label>
              <p className="text-sm text-muted-foreground">
                Si désactivé, les clientes ne pourront pas annuler leurs rendez-vous.
              </p>
            </div>
            <Switch
              checked={settings?.allowCancellation ?? true}
              onCheckedChange={(v) => updateSettings({ allowCancellation: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="cancel-deadline">Délai d'annulation minimum</Label>
            <div className="flex items-center gap-4">
              <Input
                id="cancel-deadline"
                type="number"
                min={1}
                max={72}
                value={settings?.cancellationDeadlineHours ?? 24}
                onChange={(e) => updateSettings({ 
                  cancellationDeadlineHours: Number(e.target.value) 
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">heures avant le rendez-vous</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Les clientes ne pourront pas annuler après ce délai.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-label">Libellé affiché</Label>
            <Input
              id="cancel-label"
              value={settings?.cancellationDeadlineLabel ?? '24 heures avant'}
              onChange={(e) => updateSettings({ 
                cancellationDeadlineLabel: e.target.value 
              })}
              placeholder="Ex: 24 heures avant"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button className="rounded-full" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}