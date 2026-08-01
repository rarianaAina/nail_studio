import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Save, X, Upload, Image, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useGallery } from '@/hooks/useGallery';
import { toast } from 'sonner';

const CATEGORIES = ['Vernis', 'Nail Art', 'Prothèses', 'Manucure', 'Pédicure', 'Autre'];

export default function GalleryManagement() {
  const { items, loading, add, remove, update, cleanupOrphans } = useGallery();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newItem, setNewItem] = useState({
    title: '',
    category: '',
    description: '',
  });

  const [editItem, setEditItem] = useState({
    title: '',
    category: '',
    description: '',
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!selectedFile || !newItem.title || !newItem.category) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsUploading(true);
    try {
      await add(newItem, selectedFile);
      toast.success('Image ajoutée avec succès');
      setShowAddDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewItem({ title: '', category: '', description: '' });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditItem({
      title: item.title,
      category: item.category,
      description: item.description || '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await update(id, editItem);
      setEditingId(null);
      toast.success('Modifié avec succès');
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Supprimer "${item.title}" ? L'image sera aussi supprimée du stockage.`)) return;
    try {
      await remove(item.id, item.image);
      toast.success('Image supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Supprimer les images orphelines (non liées à la base) ?')) return;
    try {
      const count = await cleanupOrphans();
      toast.success(`${count} image(s) orpheline(s) supprimée(s)`);
    } catch {
      toast.error('Erreur lors du nettoyage');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gestion de la galerie</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les images de la galerie. Les images sont automatiquement compressées en WebP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={handleCleanup}>
            <RefreshCw className="mr-2 h-4 w-4" /> Nettoyer
          </Button>
          <Button className="rounded-full" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une image
          </Button>
        </div>
      </div>

      {/* Liste des images */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <Image className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4">Aucune image dans la galerie</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une image
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative overflow-hidden rounded-2xl shadow-soft"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              
              {editingId === item.id ? (
                <div className="absolute inset-0 bg-black/80 p-4 flex flex-col gap-2">
                  <Input
                    value={editItem.title}
                    onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                    placeholder="Titre"
                    className="h-8 text-sm"
                  />
                  <Select
                    value={editItem.category}
                    onValueChange={(v) => setEditItem({ ...editItem, category: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={editItem.description}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                    placeholder="Description"
                    className="flex-1 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="text-emerald-400" onClick={() => handleSaveEdit(item.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white translate-y-full transition-transform group-hover:translate-y-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-white/70">{item.category}</p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Dialog d'ajout */}
      <Dialog open={showAddDialog} onOpenChange={(o) => !o && setShowAddDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
            <DialogDescription>
              L'image sera automatiquement compressée en WebP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-6 transition-colors hover:border-primary/40">
              {previewUrl ? (
                <div className="relative w-full">
                  <img
                    src={previewUrl}
                    alt="Aperçu"
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez ou glissez-déposez une image
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP • Max 5 Mo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gallery-title">Titre *</Label>
              <Input
                id="gallery-title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Ex: French manucure"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gallery-category">Catégorie *</Label>
              <Select
                value={newItem.category}
                onValueChange={(v) => setNewItem({ ...newItem, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gallery-desc">Description (optionnel)</Label>
              <Textarea
                id="gallery-desc"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description de l'image..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={isUploading || !selectedFile || !newItem.title}>
              {isUploading ? 'Upload en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}