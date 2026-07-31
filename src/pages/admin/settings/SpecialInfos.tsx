import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Save, X, GripVertical, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useSpecialInfos } from '@/hooks/useSpecialInfos';

export default function SpecialInfosSettings() {
  const { infos, loading, create, update, delete: deleteInfo, toggleActive } = useSpecialInfos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newInfo, setNewInfo] = useState({ title: '', content: '', icon: '✨' });
  const [editData, setEditData] = useState({ title: '', content: '', icon: '✨' });

  const handleCreate = async () => {
    if (!newInfo.title || !newInfo.content) {
      toast.error('Titre et contenu sont requis');
      return;
    }
    try {
      await create({ ...newInfo, sortOrder: infos.length });
      setNewInfo({ title: '', content: '', icon: '✨' });
      toast.success('Information ajoutée');
    } catch {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleEdit = (info: any) => {
    setEditingId(info.id);
    setEditData({ title: info.title, content: info.content, icon: info.icon || '✨' });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await update(id, editData);
      setEditingId(null);
      toast.success('Information mise à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active);
      toast.success(active ? 'Activée' : 'Désactivée');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette information ?')) return;
    try {
      await deleteInfo(id);
      toast.success('Supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Informations spéciales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gérez les informations spéciales affichées sur la page d'accueil.
          </p>

          {/* Formulaire d'ajout */}
          <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-icon">Icône</Label>
                <Input
                  id="si-icon"
                  value={newInfo.icon}
                  onChange={(e) => setNewInfo({ ...newInfo, icon: e.target.value })}
                  placeholder="✨"
                  className="text-center"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="si-title">Titre</Label>
                <Input
                  id="si-title"
                  value={newInfo.title}
                  onChange={(e) => setNewInfo({ ...newInfo, title: e.target.value })}
                  placeholder="Nouveauté, Offre, Événement..."
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full rounded-full" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="si-content">Contenu</Label>
              <Textarea
                id="si-content"
                value={newInfo.content}
                onChange={(e) => setNewInfo({ ...newInfo, content: e.target.value })}
                placeholder="Description de l'information..."
                rows={2}
              />
            </div>
          </div>

          {/* Liste */}
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : infos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune information spéciale.</p>
          ) : (
            <div className="space-y-2">
              {infos.map((info) => (
                <motion.div
                  key={info.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-all',
                    !info.active && 'opacity-50'
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-move" />

                  {editingId === info.id ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <Input
                        value={editData.icon}
                        onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                        className="w-16 text-center"
                        maxLength={2}
                      />
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="flex-1 min-w-[120px]"
                      />
                      <Textarea
                        value={editData.content}
                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                        className="flex-1 min-w-[150px]"
                        rows={1}
                      />
                      <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => handleSaveEdit(info.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl">{info.icon || '✨'}</span>
                      <div className="flex-1">
                        <p className="font-medium">{info.title}</p>
                        <p className="text-sm text-muted-foreground">{info.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={info.active}
                          onCheckedChange={(v) => handleToggle(info.id, v)}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(info)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(info.id)}>
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
    </motion.div>
  );
}