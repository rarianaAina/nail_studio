import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import type { SalonSettings } from '@/types';

export default function SocialSettings() {
  const { settings, updateSettings } = useSettings();
  const [info, setInfo] = useState({
    facebook: '',
    instagram: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (!settings) return;
    setInfo({
      facebook: settings.facebook || '',
      instagram: settings.instagram || '',
      whatsapp: settings.whatsapp || '',
    });
  }, [settings]);

  const save = async () => {
    await updateSettings(info);
    toast.success('Réseaux sociaux enregistrés.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Réseaux sociaux</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fb">Facebook</Label>
            <Input id="fb" value={info.facebook} onChange={(e) => setInfo({ ...info, facebook: e.target.value })} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram</Label>
            <Input id="ig" value={info.instagram} onChange={(e) => setInfo({ ...info, instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="wa">WhatsApp</Label>
            <Input id="wa" value={info.whatsapp} onChange={(e) => setInfo({ ...info, whatsapp: e.target.value })} placeholder="+33 6 12 34 56 78" />
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