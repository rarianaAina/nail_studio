// src/pages/auth/ForgotPassword.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const LOGO_URL = 'https://tzgcyehdjgqxljjttflj.supabase.co/storage/v1/object/public/images/logos/logo.webp';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialisation`,
      });

      if (error) throw error;
      
      setSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-rose p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold">Email envoyé !</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                <br />
                Consultez votre boîte de réception et suivez les instructions.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Le lien expirera dans 1 heure.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-rose p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-8">
            <div className="text-center">
              <img
                src={LOGO_URL}
                alt="Harrys Studio"
                className="mx-auto h-16 w-16 rounded-full object-cover"
              />
              <h2 className="mt-4 font-display text-2xl font-semibold">Mot de passe oublié</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@email.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>

              <div className="text-center text-sm">
                <Link
                  to="/connexion"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}