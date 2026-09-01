import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Mail, Calendar, Wallet, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import { formatAriary } from '@/utils';
import ClientDetail from '@/components/admin/ClientDetail';
import type { Client } from '@/types';

export default function Clients() {
  const { clients, aggregates, updateClient, deleteClient } = useClients();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    // La recherche porte aussi sur l'adresse électronique : c'est souvent la
    // seule information dont dispose la praticienne au téléphone.
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        (c.email ?? '').toLowerCase().includes(q)
    );
  }, [clients, query]);

  // La fiche ouverte doit refléter les dernières données, notamment après
  // enregistrement des notes.
  const selectedClient = selected ? clients.find((c) => c.id === selected.id) ?? selected : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Base de clientes du salon.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total clientes', value: String(aggregates.totalClients), icon: Users },
          { label: 'Total visites', value: String(aggregates.totalVisits), icon: Calendar },
          { label: 'CA cumulé', value: formatAriary(aggregates.totalRevenue), icon: Wallet },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-soft">
            <CardContent className="flex items-center gap-3 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold sm:text-xl">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom, téléphone ou e-mail…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              onClick={() => setSelected(c)}
              className="h-full cursor-pointer border-border/60 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                    {c.name[0]}
                  </span>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </p>
                  </div>
                </div>
                {c.email && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {c.email}
                  </p>
                )}
                {c.notes && (
                  <p className="mt-3 rounded-lg bg-secondary/60 p-2 text-xs italic text-muted-foreground">
                    "{c.notes}"
                  </p>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Visites</p>
                    <p className="font-semibold">{c.visitCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dernière</p>
                    <p className="text-xs font-medium">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xs font-semibold text-primary">
                      {formatAriary(c.totalSpent)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Voir la fiche complète
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
          {query ? `Aucune cliente ne correspond à « ${query} ».` : 'Aucune cliente enregistrée.'}
        </p>
      )}

      <ClientDetail
        client={selectedClient}
        onClose={() => setSelected(null)}
        onSaveNotes={(id, notes) => updateClient(id, { notes })}
        onDelete={deleteClient}
      />
    </div>
  );
}