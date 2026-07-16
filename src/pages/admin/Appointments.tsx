import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Eye,
  Pencil,
  Check,
  X,
  CalendarPlus,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { appointments as initial, formatAriary, statusColors, statusLabels, type Appointment, type AppointmentStatus } from '@/lib/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const filters: ('Tous' | AppointmentStatus)[] = ['Tous', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function Appointments() {
  const [list, setList] = useState<Appointment[]>(initial);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Tous' | AppointmentStatus>('Tous');
  const [viewing, setViewing] = useState<Appointment | null>(null);

  const filtered = useMemo(
    () =>
      list.filter((a) => {
        const matchQ =
          a.clientName.toLowerCase().includes(query.toLowerCase()) ||
          a.phone.includes(query) ||
          a.serviceName.toLowerCase().includes(query.toLowerCase());
        const matchF = filter === 'Tous' || a.status === filter;
        return matchQ && matchF;
      }),
    [list, query, filter]
  );

  const setStatus = (id: string, status: AppointmentStatus) => {
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Statut mis à jour : ${statusLabels[status]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Rendez-vous</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez et suivez tous les rendez-vous du salon.
          </p>
        </div>
        <Button className="rounded-full">
          <CalendarPlus className="mr-2 h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une cliente, un téléphone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    filter === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground/70 hover:border-primary/40'
                  )}
                >
                  {f === 'Tous' ? 'Tous' : statusLabels[f]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                  >
                    <TableCell className="font-medium">{a.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                    <TableCell>{a.serviceName}</TableCell>
                    <TableCell className="font-medium text-primary">{formatAriary(a.price)}</TableCell>
                    <TableCell>
                      {new Date(a.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', statusColors[a.status])}>
                        {statusLabels[a.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(a)} title="Voir">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {a.status === 'pending' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => setStatus(a.id, 'confirmed')}
                            title="Confirmer"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => setStatus(a.id, 'cancelled')}
                            title="Annuler"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      Aucun rendez-vous trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
            <DialogDescription>
              Informations complètes du rendez-vous sélectionné.
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{viewing.clientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{viewing.phone}</span></div>
              {viewing.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewing.email}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Prestation</span><span>{viewing.serviceName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Prix</span><span className="font-medium text-primary">{formatAriary(viewing.price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(viewing.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heure</span><span>{viewing.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge className={cn('border', statusColors[viewing.status])}>{statusLabels[viewing.status]}</Badge></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
