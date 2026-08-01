import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import type { SalonSettings } from '@/types';

export default function GeneralSettings() {
  const { settings, updateSettings } = useSettings();

  const [info, setInfo] = useState<Omit<SalonSettings, 'hours'>>({
    name: '',
    tagline: '',
    address: '',
    phone: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    email: '',
  });

  useEffect(() => {
    if (!settings) return;
    const { hours: _h, primaryColor: _p, accentColor: _a, logoUrl: _l, updatedAt: _u, id: _i, ...rest } = settings;
    setInfo(rest);
  }, [settings]);

  const save = async () => {
    await updateSettings({ ...info });
    toast.success('Paramètres enregistrés.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Informations du salon</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom du salon</Label>
            <Input id="name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Slogan</Label>
            <Input id="tagline" value={info.tagline} onChange={(e) => setInfo({ ...info, tagline: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea id="address" rows={2} value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
                <span className="font-display text-3xl font-semibold">{info.name[0] ?? 'N'}</span>
              </div>
              <div>
                <Button variant="outline" className="rounded-full">
                  <Upload className="mr-2 h-4 w-4" /> Téléverser un logo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">PNG, JPG ou SVG. 1 Mo max.</p>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button className="rounded-full" onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}