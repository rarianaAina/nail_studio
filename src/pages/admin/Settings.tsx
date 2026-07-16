import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Palette, Clock, Share2, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { salonInfo } from '@/lib/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const colorPresets = [
  { name: 'Rose poudré', primary: 'hsl(340 55% 62%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Nude beige', primary: 'hsl(24 30% 65%)', accent: 'hsl(40 50% 60%)' },
  { name: 'Corail doux', primary: 'hsl(12 65% 65%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Bordeaux', primary: 'hsl(345 50% 45%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Lavande poudré', primary: 'hsl(280 35% 65%)', accent: 'hsl(40 55% 62%)' },
];

export default function Settings() {
  const [info, setInfo] = useState({
    name: salonInfo.name,
    tagline: salonInfo.tagline,
    address: salonInfo.address,
    phone: salonInfo.phone,
    whatsapp: salonInfo.whatsapp,
    facebook: salonInfo.facebook,
    instagram: salonInfo.instagram,
    email: salonInfo.email,
  });
  const [hours, setHours] = useState(salonInfo.hours);
  const [color, setColor] = useState(colorPresets[0]);

  const save = () => toast.success('Paramètres enregistrés.');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisez les informations et l'apparence de votre salon.
        </p>
      </div>

      {/* Salon info */}
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Logo */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
            <span className="font-display text-3xl font-semibold">É</span>
          </div>
          <div>
            <Button variant="outline" className="rounded-full">
              <Upload className="mr-2 h-4 w-4" /> Téléverser un logo
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG ou SVG. 1 Mo max.</p>
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
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
                  onChange={(e) => setHours((prev) => prev.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))}
                  className="w-full flex-1 sm:w-28 sm:flex-none"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={h.close}
                  disabled={h.closed}
                  onChange={(e) => setHours((prev) => prev.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))}
                  className="w-full flex-1 sm:w-28 sm:flex-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                <input
                  type="checkbox"
                  checked={!!h.closed}
                  onChange={(e) => setHours((prev) => prev.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)))}
                  className="accent-primary"
                />
                Fermé
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social */}
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
            <Input id="fb" value={info.facebook} onChange={(e) => setInfo({ ...info, facebook: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram</Label>
            <Input id="ig" value={info.instagram} onChange={(e) => setInfo({ ...info, instagram: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa">WhatsApp</Label>
            <Input id="wa" value={info.whatsapp} onChange={(e) => setInfo({ ...info, whatsapp: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Couleurs du site</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {colorPresets.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c)}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-all',
                  color.name === c.name
                    ? 'border-primary shadow-glow'
                    : 'border-border hover:border-primary/40'
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" className="w-full rounded-full sm:w-auto" onClick={save}>
          <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
