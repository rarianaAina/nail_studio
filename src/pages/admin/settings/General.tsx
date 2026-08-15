import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Store, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import { uploadImage } from '@/services/storageService';
import type { SalonSettings } from '@/types';

// ✅ Logo par défaut (si aucun logo n'est configuré)
const DEFAULT_LOGO = 'https://tzgcyehdjgqxljjttflj.supabase.co/storage/v1/object/public/images/logos/logo.webp';

export default function GeneralSettings() {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO);
  const [hero, setHero] = useState({ heroTitle: '', heroTitleAccent: '', heroSubtitle: '' });
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [heroUploading, setHeroUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const {
      hours: _h, primaryColor: _p, accentColor: _a, logoUrl: _l, updatedAt: _u, id: _i,
      heroTitle: _t, heroTitleAccent: _ta, heroSubtitle: _st, heroImageUrl: _hi,
      ...rest
    } = settings;
    setInfo(rest);
    setLogoUrl(settings.logoUrl || DEFAULT_LOGO);
    setHero({
      heroTitle: settings.heroTitle ?? '',
      heroTitleAccent: settings.heroTitleAccent ?? '',
      heroSubtitle: settings.heroSubtitle ?? '',
    });
    setHeroImageUrl(settings.heroImageUrl ?? '');
  }, [settings]);

  const save = async () => {
    await updateSettings({ ...info, logoUrl, ...hero, heroImageUrl });
    toast.success('Paramètres enregistrés.');
  };

  const handleHeroUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }
    setHeroUploading(true);
    try {
      const url = await uploadImage(file, 'hero');
      setHeroImageUrl(url);
      // Enregistrement immédiat : sans cela, quitter l'onglet sans cliquer sur
      // « Enregistrer » laisserait un fichier en ligne que rien ne référence.
      await updateSettings({ heroImageUrl: url });
      toast.success('Image du bandeau mise à jour.');
    } catch {
      toast.error('Le téléversement a échoué.');
    } finally {
      setHeroUploading(false);
    }
  };

  // ✅ Gestion de l'upload du logo avec compression automatique et renommage
  const handleLogoUpload = async (file: File) => {
    // Vérifier la taille (max 2 Mo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2 Mo)');
      return;
    }

    // Vérifier le type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Format non supporté (JPG, PNG, WebP, SVG)');
      return;
    }

    setUploading(true);
    try {
      // ✅ Renommer le fichier en "logo.webp" avant upload
      const renamedFile = new File(
        [file],
        'logo.webp',
        { type: 'image/webp' }
      );
      
      // ✅ Upload avec nom fixe "logo"
      const url = await uploadImage(renamedFile, 'logos', 'logo');
      setLogoUrl(url);
      toast.success('Logo téléversé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors du téléversement du logo');
    } finally {
      setUploading(false);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ Aperçu avant upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader automatiquement
    handleLogoUpload(file);
  };

  // ✅ Supprimer le logo (retour au défaut)
  const handleRemoveLogo = async () => {
    setLogoUrl(DEFAULT_LOGO);
    toast.success('Logo supprimé, retour au logo par défaut');
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
          
          {/* ✅ Upload du logo */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex flex-wrap items-center gap-4">
              {/* Aperçu du logo */}
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border/60 bg-secondary/30">
                {(previewUrl || logoUrl) ? (
                  <img
                    src={previewUrl || logoUrl}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-display text-muted-foreground">
                    {info.name[0] || 'N'}
                  </div>
                )}
                {logoUrl !== DEFAULT_LOGO && !previewUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90"
                    title="Supprimer le logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Téléversement...' : 'Téléverser un logo'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP ou SVG. Max 2 Mo. Format carré recommandé.
                </p>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Compression en cours...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-4 border-t border-border/60 pt-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Bandeau d'accueil</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Le premier bloc que voient vos visiteuses. Laissez un champ vide pour
                revenir au texte d'origine.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="hero-title">Titre, première ligne</Label>
                <Input
                  id="hero-title"
                  value={hero.heroTitle}
                  onChange={(e) => setHero((p) => ({ ...p, heroTitle: e.target.value }))}
                  placeholder="L'art des ongles,"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-accent">Titre, seconde ligne</Label>
                <Input
                  id="hero-accent"
                  value={hero.heroTitleAccent}
                  onChange={(e) => setHero((p) => ({ ...p, heroTitleAccent: e.target.value }))}
                  placeholder={`sublimé avec ${info.name || 'votre salon'}`}
                />
                <p className="text-xs text-muted-foreground">
                  Affichée en italique, dans la couleur d'accentuation.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-subtitle">Texte d'introduction</Label>
              <Textarea
                id="hero-subtitle"
                rows={3}
                value={hero.heroSubtitle}
                onChange={(e) => setHero((p) => ({ ...p, heroSubtitle: e.target.value }))}
                placeholder="Des mains soignées, des ongles sublimes…"
              />
            </div>

            <div className="space-y-2">
              <Label>Image du bandeau</Label>
              <div className="flex flex-wrap items-start gap-4">
                <div className="h-32 w-[102px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-secondary">
                  {heroImageUrl ? (
                    <img src={heroImageUrl} alt="Bandeau d'accueil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center px-2 text-center text-[10px] text-muted-foreground">
                      Image d'origine
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" disabled={heroUploading} asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {heroUploading ? 'Téléversement…' : 'Téléverser une image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={heroUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleHeroUpload(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </Button>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Format portrait recommandé, 4 sur 5. L'image est compressée
                    automatiquement et enregistrée dès le téléversement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button className="rounded-full" onClick={save} disabled={uploading}>
              <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}