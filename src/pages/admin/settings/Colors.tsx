import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { COLOR_PRESETS } from '@/utils/constants';
import { useSettings } from '@/hooks/useSettings';

export default function ColorsSettings() {
  const { settings, updateSettings } = useSettings();
  const [color, setColor] = useState<{ name: string; primary: string; accent: string }>(COLOR_PRESETS[0]);

  const save = async () => {
    await updateSettings({ 
      primaryColor: color.primary, 
      accentColor: color.accent 
    });
    toast.success('Couleurs enregistrées.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Couleurs du site</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c)}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-all',
                  color.name === c.name ? 'border-primary shadow-glow' : 'border-border hover:border-primary/40'
                )}
              >
                <div className="flex gap-1.5">
                  <span className="h-8 w-8 rounded-full" style={{ background: c.primary }} />
                  <span className="h-8 w-8 rounded-full" style={{ background: c.accent }} />
                </div>
                <p className="mt-2 text-xs font-medium">{c.name}</p>
              </button>
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-4">
            <span className="h-12 w-12 rounded-full" style={{ background: color.primary }} />
            <div>
              <p className="text-sm font-medium">Aperçu principal</p>
              <p className="text-xs text-muted-foreground">{color.primary}</p>
            </div>
            <span className="h-12 w-12 rounded-full" style={{ background: color.accent }} />
            <div>
              <p className="text-sm font-medium">Aperçu accent</p>
              <p className="text-xs text-muted-foreground">{color.accent}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="rounded-full" onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer les couleurs
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}