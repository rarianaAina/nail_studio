import { useState } from 'react';
import { Star, ImagePlus, X, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Appointment } from '@/types';
import { getServiceNames } from '@/types';
import { reviewService } from '@/services/reviewService';
import { uploadImage } from '@/services/storageService';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

interface ReviewDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewDialog({ appointment, onClose, onSubmitted }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!appointment) return null;

  const reset = () => {
    setRating(0);
    setHovered(0);
    setComment('');
    setPhoto(null);
  };

  const handlePhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Merci d\'attribuer une note.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Merci d\'écrire quelques mots.');
      return;
    }

    setSubmitting(true);
    try {
      // La photo n'est envoyée qu'une fois l'avis validé côté saisie, pour ne
      // pas laisser de fichier orphelin si la cliente renonce.
      let imageUrl: string | undefined;
      if (photo) {
        imageUrl = await uploadImage(photo.file, 'reviews', undefined, 'appointments');
      }

      await reviewService.submit({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim(),
        imageUrl,
      });

      toast.success('Merci ! Votre avis sera publié après relecture par le salon.');
      reset();
      onSubmitted();
      onClose();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        toast.error('Un avis a déjà été déposé pour ce rendez-vous.');
      } else if (code === '42501') {
        toast.error('Ce rendez-vous ne permet pas de déposer un avis.');
      } else {
        toast.error('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = hovered || rating;

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Votre avis</DialogTitle>
          <DialogDescription>
            {getServiceNames(appointment) || 'Prestation'} du {formatDate(appointment.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Votre note</Label>
            <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHovered(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-7 w-7',
                      n <= displayed ? 'fill-primary text-primary' : 'text-muted-foreground/40'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Votre commentaire</Label>
            <Textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ce que vous avez apprécié, ce qui pourrait être amélioré…"
            />
          </div>

          <div className="space-y-2">
            <Label>Une photo du résultat (facultatif)</Label>
            {photo ? (
              <div className="relative inline-block">
                <img
                  src={photo.preview}
                  alt="Photo jointe à votre avis"
                  className="h-28 w-28 rounded-xl border border-border/60 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="Retirer la photo"
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/40">
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhoto(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            Votre avis est relu par le salon avant publication. Votre prénom et la
            prestation concernée apparaîtront ; ni votre téléphone ni votre adresse
            électronique ne sont publiés.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="mr-1.5 h-4 w-4" />
              {submitting ? 'Envoi…' : 'Envoyer mon avis'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
