import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Gift, Euro } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface LoyaltySettings {
  id: string;
  points_per_euro: number;
  updated_at: string;
}

export default function LoyaltySettings() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsPerEuro, setPointsPerEuro] = useState<number>(1);

  // Charger les paramètres
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('loyalty_settings')
          .select('*')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings(data);
          setPointsPerEuro(data.points_per_euro);
        } else {
          // Créer les paramètres par défaut
          const { data: created, error: createError } = await supabase
            .from('loyalty_settings')
            .insert({ points_per_euro: 1 })
            .select()
            .single();

          if (createError) throw createError;
          setSettings(created);
          setPointsPerEuro(created.points_per_euro);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const save = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('loyalty_settings')
        .update({ 
          points_per_euro: pointsPerEuro,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success(`Paramètres enregistrés : ${pointsPerEuro} point(s) par euro`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Points de fidélité</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configurez le nombre de points gagnés par euro dépensé.
          </p>

          <div className="space-y-2">
            <Label htmlFor="points-per-euro">Points par euro dépensé</Label>
            <div className="flex items-center gap-4">
              <Input
                id="points-per-euro"
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={pointsPerEuro}
                onChange={(e) => setPointsPerEuro(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                point(s) pour 1€ dépensé
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Exemple : 1 point = 1€, 2 points = 2€, 0.5 = 0.5€
            </p>
          </div>

          <div className="rounded-xl bg-secondary/50 p-4 text-sm">
            <p className="font-medium">Aperçu</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>• 10€ dépensés → {Math.round(10 * pointsPerEuro)} points</p>
              <p>• 25€ dépensés → {Math.round(25 * pointsPerEuro)} points</p>
              <p>• 50€ dépensés → {Math.round(50 * pointsPerEuro)} points</p>
              <p>• 100€ dépensés → {Math.round(100 * pointsPerEuro)} points</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="rounded-full" onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}