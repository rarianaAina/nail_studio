import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Upload, Palette, Clock, Share2, Store, Bell, User, ShieldCheck, Users, 
  Plus, Trash2, GripVertical, Tag, CreditCard, Pencil, Settings as SettingsIcon,
  Calendar, DollarSign, MessageSquare, Sparkles, Layout
} from 'lucide-react';
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
import { useConfig } from '@/hooks/useConfig';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { COLOR_PRESETS } from '@/utils/constants';
import type { SalonSettings, BusinessHours } from '@/types';
import type { ReminderDelay, ReminderRecipients } from '@/types/reminder';
import { useAppointmentSettings } from '@/hooks/useAppointmentSettings';

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

// ✅ Sous-menus de navigation
const SECTIONS = [
  { id: 'general', label: 'Général', icon: Store },
  { id: 'hours', label: 'Horaires', icon: Clock },
  { id: 'social', label: 'Réseaux sociaux', icon: Share2 },
  { id: 'payment', label: 'Paiements', icon: CreditCard },
  { id: 'cancellation', label: 'Annulation', icon: Calendar },
  { id: 'reminders', label: 'Rappels', icon: Bell },
  { id: 'colors', label: 'Couleurs', icon: Palette },
  { id: 'categories', label: 'Catégories', icon: Tag },
  { id: 'timeslots', label: 'Créneaux', icon: Clock },
];

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { reminderSettings, loading, error, updateReminderSettings } = useReminderSettings();
  const { settings: appointmentSettings, updateSettings: updateAppointmentSettings } = useAppointmentSettings();
  const {
    categories, timeSlots,
    createCategory, updateCategory, deleteCategory,
    createTimeSlot, updateTimeSlot, deleteTimeSlot,
  } = useConfig();
  const {
    paymentMethods,
    loading: loadingPayments,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
  } = usePaymentMethods();

  // ✅ État pour la section active (mobile)
  const [activeSection, setActiveSection] = useState<string>('general');

  const [newCat, setNewCat] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: '', label: '', icon: '' });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentData, setEditPaymentData] = useState({ name: '', label: '', icon: '' });

  useEffect(() => {
    console.log('📦 reminderSettings:', reminderSettings);
    console.log('🔄 loading:', loading);
    console.log('❌ error:', error);
  }, [reminderSettings, loading, error]);

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

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.name || !newPaymentMethod.label) {
      toast.error('Nom et libellé sont requis');
      return;
    }
    try {
      await createPaymentMethod({
        name: newPaymentMethod.name,
        label: newPaymentMethod.label,
        icon: newPaymentMethod.icon || undefined,
        sortOrder: paymentMethods.length,
      });
      setNewPaymentMethod({ name: '', label: '', icon: '' });
      toast.success('Mode de paiement ajouté');
    } catch {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleEditPayment = (method: any) => {
    setEditingPaymentId(method.id);
    setEditPaymentData({ name: method.name, label: method.label, icon: method.icon || '' });
  };

  const handleSavePaymentEdit = async (id: string) => {
    try {
      await updatePaymentMethod(id, editPaymentData);
      setEditingPaymentId(null);
      toast.success('Mode de paiement mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleTogglePayment = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active);
      toast.success(active ? 'Activé' : 'Désactivé');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Supprimer ce mode de paiement ?')) return;
    try {
      await deletePaymentMethod(id);
      toast.success('Supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Fonction pour faire défiler jusqu'à une section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisez les informations et l'apparence de votre salon.
        </p>
      </div>

      {/* ✅ Navigation par sous-menus (visible sur mobile) */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/80 px-4 py-2 backdrop-blur-xl md:hidden">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ Navigation par sous-menus (desktop) */}
      <div className="hidden flex-wrap gap-2 md:flex">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* ===== SECTION GÉNÉRAL ===== */}
      <section id="general">
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
      </section>

      {/* ===== SECTION HORAIRES ===== */}
      <section id="hours">
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
      </section>

      {/* ===== SECTION RÉSEAUX SOCIAUX ===== */}
      <section id="social">
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
      </section>

      {/* ===== SECTION MODES DE PAIEMENT ===== */}
      <section id="payment">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">Modes de paiement</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gérez les moyens de paiement disponibles pour vos clientes lors de la réservation.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="pm-name">Nom technique</Label>
                <Input
                  id="pm-name"
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                  placeholder="ex: cash, card..."
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="pm-label">Libellé affiché</Label>
                <Input
                  id="pm-label"
                  value={newPaymentMethod.label}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })}
                  placeholder="ex: Espèces, Carte..."
                />
              </div>
              <div className="w-20 space-y-1.5">
                <Label htmlFor="pm-icon">Icône</Label>
                <Input
                  id="pm-icon"
                  value={newPaymentMethod.icon}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, icon: e.target.value })}
                  placeholder="💳"
                  maxLength={2}
                  className="text-center"
                />
              </div>
              <Button className="rounded-full sm:shrink-0" onClick={handleAddPaymentMethod}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </div>

            {loadingPayments ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun mode de paiement configuré.</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all',
                      !method.active && 'opacity-50'
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-move" />

                    {editingPaymentId === method.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editPaymentData.name}
                          onChange={(e) => setEditPaymentData({ ...editPaymentData, name: e.target.value })}
                          className="w-28"
                        />
                        <Input
                          value={editPaymentData.label}
                          onChange={(e) => setEditPaymentData({ ...editPaymentData, label: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          value={editPaymentData.icon}
                          onChange={(e) => setEditPaymentData({ ...editPaymentData, icon: e.target.value })}
                          className="w-16 text-center"
                          placeholder="💳"
                          maxLength={2}
                        />
                        <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => handleSavePaymentEdit(method.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setEditingPaymentId(null)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl">{method.icon || '💳'}</span>
                        <div className="flex-1">
                          <p className="font-medium">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={method.active}
                            onCheckedChange={(v) => handleTogglePayment(method.id, v)}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditPayment(method)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => handleDeletePayment(method.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ===== SECTION ANNULATION ===== */}
      <section id="cancellation">
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
                checked={appointmentSettings?.allowCancellation ?? true}
                onCheckedChange={(v) => updateAppointmentSettings({ allowCancellation: v })}
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
                  value={appointmentSettings?.cancellationDeadlineHours ?? 24}
                  onChange={(e) => updateAppointmentSettings({ 
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
                value={appointmentSettings?.cancellationDeadlineLabel ?? '24 heures avant'}
                onChange={(e) => updateAppointmentSettings({ 
                  cancellationDeadlineLabel: e.target.value 
                })}
                placeholder="Ex: 24 heures avant"
              />
            </div>

            <Button variant="outline" className="w-full rounded-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Enregistrer les paramètres d'annulation
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ===== SECTION RAPPELS ===== */}
      <section id="reminders">
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

              <div className="space-y-3">
                <Label className="text-base font-semibold">Coordonnées de l'administratrice</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-phone">Téléphone admin</Label>
                    <Input
                      id="admin-phone"
                      value={reminderSettings.adminPhone ?? ''}
                      onChange={(e) => updateReminderSettings({ adminPhone: e.target.value })}
                      placeholder="+33 ..."
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
      </section>

      {/* ===== SECTION COULEURS ===== */}
      <section id="colors">
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
      </section>

      {/* ===== SECTION CATÉGORIES ===== */}
      <section id="categories">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">Catégories de prestations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gérez les catégories affichées sur votre site. Désactivez une catégorie pour la masquer sans la supprimer.
            </p>
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  <Input
                    value={c.name}
                    onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch checked={c.active} onCheckedChange={(v) => updateCategory(c.id, { active: v })} />
                    {c.active ? 'Actif' : 'Masqué'}
                  </label>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => deleteCategory(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={async () => {
                  if (!newCat.trim()) return;
                  try {
                    await createCategory({ name: newCat.trim(), sortOrder: categories.length + 1 });
                    setNewCat('');
                    toast.success('Catégorie ajoutée.');
                  } catch {
                    toast.error('Cette catégorie existe déjà.');
                  }
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== SECTION CRÉNEAUX ===== */}
      <section id="timeslots">
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
              <Button
                variant="outline"
                onClick={async () => {
                  if (!newSlot.trim()) return;
                  try {
                    await createTimeSlot({ label: newSlot, sortOrder: timeSlots.length + 1 });
                    setNewSlot('');
                    toast.success('Créneau ajouté.');
                  } catch {
                    toast.error('Erreur lors de l\'ajout du créneau.');
                  }
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter un créneau
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button size="lg" className="w-full rounded-full sm:w-auto" onClick={save}>
          <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}