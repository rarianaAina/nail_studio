import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Clock, Sparkles, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useNailServices } from '@/hooks/useNailServices';
import { useConfig } from '@/hooks/useConfig';
import { uploadImage } from '@/services/storageService';
import { formatAriary } from '@/utils';
import type { Service } from '@/types';

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop';

type DraftService = Omit<Service, 'id'> & { id?: string };

// ✅ Options pour les heures (0-12)
const HOURS_OPTIONS = Array.from({ length: 13 }, (_, i) => ({ value: i, label: `${i}h` }));

// ✅ Options pour les minutes (0-59, par pas de 1)
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}min` }));

// ✅ Convertir heures + minutes en minutes totales
const toTotalMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;

// ✅ Convertir minutes totales en heures et minutes
const toHoursAndMinutes = (totalMinutes: number): { hours: number; minutes: number } => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

const blank: DraftService = {
  name: '',
  category: '',
  description: '',
  duration: 30,
  price: 0,
  image: DEFAULT_IMAGE,
};

export default function AdminServices() {
  const { services, createService, updateService, deleteService } = useNailServices();
  const { categories } = useConfig();
  const [editing, setEditing] = useState<DraftService | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeCategoryNames = categories.filter((c) => c.active).map((c) => c.name);

  // ✅ État pour les heures et minutes sélectionnées
  const [selectedHours, setSelectedHours] = useState<number>(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);

  // ✅ Quand on ouvre le dialog d'édition
  const handleEdit = (service?: DraftService) => {
    if (service) {
      const { hours, minutes } = toHoursAndMinutes(service.duration);
      setSelectedHours(hours);
      setSelectedMinutes(minutes);
      setEditing(service);
    } else {
      setSelectedHours(0);
      setSelectedMinutes(30);
      setEditing({ ...blank });
    }
  };

  // ✅ Mettre à jour la durée quand heures ou minutes changent
  const updateDuration = (hours: number, minutes: number) => {
    if (!editing) return;
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
    setEditing({ ...editing, duration: toTotalMinutes(hours, minutes) });
  };

  const save = async (svc: DraftService) => {
    if (svc.id) {
      await updateService(svc.id, svc);
      toast.success('Prestation modifiée.');
    } else {
      await createService(svc);
      toast.success('Prestation ajoutée.');
    }
    setEditing(null);
  };

  const remove = async (id: string) => {
    await deleteService(id);
    toast.success('Prestation supprimée.');
    setDeleting(null);
  };

  const handleUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'services');
      setEditing({ ...editing, image: url });
      toast.success('Image importée.');
    } catch {
      toast.error("Erreur lors de l'import de l'image.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Formater la durée pour l'affichage
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Prestations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez, modifiez ou supprimez des prestations.</p>
        </div>
        <Button className="rounded-full" onClick={() => handleEdit()}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une prestation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="group overflow-hidden border-border/60 shadow-soft transition-all hover:shadow-glow">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                {s.popular && (
                  <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
                    <Sparkles className="h-3 w-3" /> Populaire
                  </Badge>
                )}
                <Badge className="absolute right-3 top-3 rounded-full bg-white/90 text-foreground">{s.category}</Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <span className="text-sm font-semibold text-primary">
                    {s.price === 0 ? 'Devis' : formatAriary(s.price)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {formatDuration(s.duration)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => handleEdit(s)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setDeleting(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Modifier la prestation' : 'Nouvelle prestation'}</DialogTitle>
            <DialogDescription>Renseignez les informations de la prestation.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat">Catégorie</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                    <SelectContent>
                      {activeCategoryNames.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="img">Image</Label>
                  <div className="flex gap-2">
                    <Input id="img" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="URL de l'image" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploading}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleUpload(file);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ✅ Sélecteur de durée en heures et minutes (0-59) */}
                <div className="space-y-1.5">
                  <Label>Durée</Label>
                  <div className="flex gap-2">
                    <Select
                      value={String(selectedHours)}
                      onValueChange={(v) => updateDuration(Number(v), selectedMinutes)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Heures" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {HOURS_OPTIONS.map((h) => (
                          <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(selectedMinutes)}
                      onValueChange={(v) => updateDuration(selectedHours, Number(v))}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Minutes" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {MINUTES_OPTIONS.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total : {formatDuration(toTotalMinutes(selectedHours, selectedMinutes))}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editing.price === 0 ? '' : editing.price}
                    placeholder="Laisser vide pour 'Devis'"
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setEditing({ ...editing, price: value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editing.price === 0 ? 'Le prix sera affiché comme "Devis"' : `Prix : ${formatAriary(editing.price)}`}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={() => editing && save(editing)} disabled={!editing?.name}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la prestation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La prestation "{deleting?.name}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}