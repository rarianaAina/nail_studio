import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Scale } from 'lucide-react';

interface LegalPageProps {
  badge: string;
  title: string;
  intro: string;
  updatedAt: string;
  children: React.ReactNode;
}

/**
 * Coquille commune aux pages légales : même en-tête, même largeur de lecture,
 * même rythme typographique. Le contenu reste propre à chaque page.
 */
export default function LegalPage({ badge, title, intro, updatedAt, children }: LegalPageProps) {
  return (
    <div>
      <section className="gradient-rose pt-32 pb-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="secondary"
              className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur"
            >
              <Scale className="h-3.5 w-3.5" /> {badge}
            </Badge>
            <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">{intro}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article className="space-y-10 text-sm leading-relaxed text-foreground/80">
            {children}
          </article>
          <p className="mt-12 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            Dernière mise à jour : {updatedAt}
          </p>
        </div>
      </section>
    </div>
  );
}

/** Section titrée, pour homogénéiser la hiérarchie des trois pages. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Information que seul l'exploitant peut fournir.
 *
 * Volontairement muet : ces encadrés s'affichaient aux visiteuses, qui n'ont
 * que faire de nos notes de rédaction — un « À compléter » sur une page légale
 * donne surtout l'impression d'un site inachevé.
 *
 * Le composant est conservé plutôt que les appels supprimés : le texte de
 * chaque encadré reste lisible dans le source et recense ce qu'il manque. Au
 * fur et à mesure que ces informations sont connues, remplacez l'encadré par
 * le contenu correspondant. Quand il n'en restera aucun, ce composant pourra
 * disparaître.
 *
 * Le paramètre est ignoré : le préfixe `_` l'exempte de `noUnusedParameters`.
 */
export function LegalTodo(_props: { children: React.ReactNode }) {
  return null;
}
