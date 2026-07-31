import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Pencil, CreditCard, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

export default function PaymentMethodsSettings() {
  const {
    paymentMethods,
    loading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
  } = usePaymentMethods();

  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: '', label: '', icon: '' });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentData, setEditPaymentData] = useState({ name: '', label: '', icon: '' });

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

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
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

          {loading ? (
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
    </motion.div>
  );
}