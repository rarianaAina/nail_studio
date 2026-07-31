import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Tag, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useConfig } from '@/hooks/useConfig';

export default function CategoriesSettings() {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useConfig();

  const [newCat, setNewCat] = useState('');

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    try {
      await createCategory({ name: newCat.trim(), sortOrder: categories.length + 1 });
      setNewCat('');
      toast.success('Catégorie ajoutée.');
    } catch {
      toast.error('Cette catégorie existe déjà.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
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
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}