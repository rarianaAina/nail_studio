import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Facebook,
  Instagram,
  MapPin,
  Clock,
  Mail,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { salonInfo } from '@/lib/data';
import { toast } from 'sonner';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message envoyé ! Nous vous répondrons rapidement.');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div>
      <section className="gradient-rose pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Contact
            </Badge>
            <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">
              Nous contacter
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              Une question, une demande spéciale ? Notre équipe est à votre écoute.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Infos */}
            <motion.div {...fadeUp} className="space-y-6">
              <Card className="border-border/60 shadow-soft">
                <CardContent className="p-6">
                  <h3 className="font-display text-2xl font-semibold">Coordonnées</h3>
                  <div className="mt-5 space-y-4">
                    <a href={`tel:${salonInfo.phone}`} className="flex items-center gap-4 transition-colors hover:text-primary">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Phone className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{salonInfo.phone}</p>
                      </div>
                    </a>
                    <a href={`https://wa.me/${salonInfo.whatsapp.replace(/\s/g, '')}`} className="flex items-center gap-4 transition-colors hover:text-primary">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <MessageCircle className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{salonInfo.whatsapp}</p>
                      </div>
                    </a>
                    <a href={`mailto:${salonInfo.email}`} className="flex items-center gap-4 transition-colors hover:text-primary">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{salonInfo.email}</p>
                      </div>
                    </a>
                    <div className="flex items-center gap-4">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Adresse</p>
                        <p className="font-medium">{salonInfo.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <a href={salonInfo.facebook} className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a href={salonInfo.instagram} className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-2xl font-semibold">Horaires</h3>
                  </div>
                  <div className="mt-4 divide-y divide-border/60">
                    {salonInfo.hours.map((h) => (
                      <div key={h.day} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="font-medium">{h.day}</span>
                        <span className={h.closed ? 'text-destructive' : 'text-muted-foreground'}>
                          {h.closed ? 'Fermé' : `${h.open} — ${h.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/60 shadow-soft">
                <div className="aspect-video w-full bg-secondary">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary/10">
                    <div className="text-center">
                      <MapPin className="mx-auto h-10 w-10 text-primary" />
                      <p className="mt-2 text-sm font-medium">Carte Google Maps</p>
                      <p className="text-xs text-muted-foreground">{salonInfo.address}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Form */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card className="border-border/60 shadow-soft">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="font-display text-2xl font-semibold">Envoyez-nous un message</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Réponse sous 24h ouvrées.
                  </p>
                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="vous@email.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+261 ..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Votre message..."
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-full">
                      <Send className="mr-2 h-4 w-4" /> Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
