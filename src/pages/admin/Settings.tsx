import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Palette, Clock, Share2, Store, Bell, User, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useSettings } from '@/hooks/useSettings';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { COLOR_PRESETS } from '@/utils/constants';
import type { SalonSettings, BusinessHours } from '@/types';
import type { ReminderDelay, ReminderRecipients } from '@/types/reminder';

const DELAYS: { value: ReminderDelay; label: string }[] = [
  { value: 24, label: '24 heures avant' },
  { value: 12, label: '12 heures avant' },
  { value: 2, label: '2 heures avant' },
];

const RECIPIENTS: { value: ReminderRecipients; label: string; icon: typeof User; desc: string }[] = [
  { value: 'client', label: 'Cliente uniquement', icon: User, desc: 'Le rappel est envoyé uniquement à la cliente.' },
  { value: 'admin', label: 'Administratrice uniquement', icon: ShieldCheck, desc: 'Le rappel est envoyé uniquement à l\'administratrice.' },
  { value: 'both', label: 'Les deux', icon: Users, desc: 'Le rappel est envoyé à la cliente et à l\'administratrice.' },
];

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { reminderSettings, updateReminderSettings } = useReminderSettings();

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
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [color, setColor] = useState<{ name: string; primary: string; accent: string }>(COLOR_PRESETS[0]);

  useEffect(() => {
    if (!settings) return;
    const { hours: h, primaryColor: _p, accentColor: _a, logoUrl: _l, updatedAt: _u, id: _i, ...rest } = settings;
    setInfo(rest);
    setHours(h);
  }, [settings]);

  const save = async () => {
    await updateSettings({ ...info, hours });
    toast.success('Paramètres enregistrés.');
  };

  const saveReminders = async () => {
    if (!reminderSettings) return;
    await updateReminderSettings(reminderSettings);
    toast.success('Paramètres de rappels enregistrés.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisez les informations et l'apparence de votre salon.
        </p>
      </div>

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

      <Card className="border-border/60 shadow-soft">
        <CardHeader><CardTitle className="font-display text-lg">Logo</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
            <span className="font-display text-3xl font-semibold">{info.name[0] ?? 'N'}</span>
          </div>
          <div>
            <Button variant="outline" className="rounded-full">
              <Upload className="mr-2 h-4 w-4" /> Téléverser un logo
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG ou SVG. 1 Mo max.</p>
          </div>
        </CardContent>
      </Card>

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
        </CardContent>
      </Card>

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

      {/* ===== RAPPELS ===== */}
      {reminderSettings && (
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="font-display text-lg">Rappels automatiques</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{reminderSettings.enabled ? 'Activés' : 'Désactivés'}</span>
                <Switch
                  checked={reminderSettings.enabled}
                  onCheckedChange={(v) => updateReminderSettings({ enabled: v })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn('space-y-6', !reminderSettings.enabled && 'pointer-events-none opacity-50')}>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
              <Bell className="mb-1.5 h-4 w-4" />
              <p className="font-medium">Prototype — rappels visuels uniquement</p>
              <p className="mt-1 text-primary/80">
                Les rappels sont enregistrés et affichés dans la section Notifications. Aucun SMS ou email n'est envoyé automatiquement pour l'instant.
              </p>
            </div>

            {/* Délai */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Délai du rappel</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {DELAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => updateReminderSettings({ delayHours: d.value })}
                    className={cn(
                      'flex flex-col items-center rounded-2xl border p-4 text-center transition-all',
                      reminderSettings.delayHours === d.value
                        ? 'border-primary bg-primary/5 shadow-glow'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className={cn('grid h-11 w-11 place-items-center rounded-full text-2xl font-bold',
                      reminderSettings.delayHours === d.value ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>
                      {d.value}
                    </span>
                    <span className="mt-2 text-sm font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Destinataires */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Destinataires</Label>
              <div className="space-y-2">
                {RECIPIENTS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => updateReminderSettings({ recipients: r.value })}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                      reminderSettings.recipients === r.value
                        ? 'border-primary bg-primary/5 shadow-glow'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                      reminderSettings.recipients === r.value ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>
                      <r.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    {reminderSettings.recipients === r.value && (
                      <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Contacts admin */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Coordonnées de l'administratrice</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-phone">Téléphone admin</Label>
                  <Input
                    id="admin-phone"
                    value={reminderSettings.adminPhone ?? ''}
                    onChange={(e) => updateReminderSettings({ adminPhone: e.target.value })}
                    placeholder="+261 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email">Email admin</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={reminderSettings.adminEmail ?? ''}
                    onChange={(e) => updateReminderSettings({ adminEmail: e.target.value })}
                    placeholder="admin@nida.mg"
                  />
                </div>
              </div>
            </div>

            <Button className="w-full rounded-full sm:w-auto" onClick={saveReminders}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer les rappels
            </Button>
          </CardContent>
        </Card>
      )}

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
