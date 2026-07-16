import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { services as initial, formatAriary, type Service } from '@/lib/data';
import { toast } from 'sonner';

const blank: Service = {
  id: '',
  name: '',
  category: 'Manucure',
  description: '',
  duration: 30,
  price: 0,
  image: 'https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
};

export default function AdminServices() {
  const [list, setList] = useState<Service[]>(initial);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const save = (svc: Service) => {
    if (svc.id) {
      setList((prev) => prev.map((s) => (s.id === svc.id ? svc : s)));
      toast.success('Prestation modifiée.');
    } else {
      const id = 'svc-' + Date.now();
      setList((prev) => [...prev, { ...svc, id }]);
      toast.success('Prestation ajoutée.');
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    setList((prev) => prev.filter((s) => s.id !== id));
    toast.success('Prestation supprimée.');
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Prestations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez, modifiez ou supprimez des prestations.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setEditing({ ...blank })}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une prestation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group overflow-hidden border-border/60 shadow-soft transition-all hover:shadow-glow">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                {s.popular && (
                  <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
                    <Sparkles className="h-3 w-3" /> Populaire
                  </Badge>
                )}
                <Badge className="absolute right-3 top-3 rounded-full bg-white/90 text-foreground">
                  {s.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <span className="text-sm font-semibold text-primary">{formatAriary(s.price)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.duration} min
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setEditing(s)}>
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

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Modifier la prestation' : 'Nouvelle prestation'}</DialogTitle>
            <DialogDescription>
              Renseignez les informations de la prestation.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat">Catégorie</Label>
                  <Input
                    id="cat"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as Service['category'] })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="img">Image (URL)</Label>
                  <Input
                    id="img"
                    value={editing.image}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dur">Durée (min)</Label>
                  <Input
                    id="dur"
                    type="number"
                    value={editing.duration}
                    onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Prix (Ar)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={() => editing && save(editing)} disabled={!editing?.name}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
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
