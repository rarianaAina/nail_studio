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

/** Le contrôle est repris côté base : `submit_review()` refuse au-delà. */
const MAX_PHOTOS = 6;

interface ReviewDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewDialog({ appointment, onClose, onSubmitted }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!appointment) return null;

  const reset = () => {
    setRating(0);
    setHovered(0);
    setComment('');
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
  };

  const handlePhotos = (files: FileList) => {
    const retenus: Array<{ file: File; preview: string }> = [];

    for (const file of Array.from(files)) {
      if (photos.length + retenus.length >= MAX_PHOTOS) {
        toast.error(`${MAX_PHOTOS} photos au maximum.`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`« ${file.name} » n'est pas une image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      retenus.push({ file, preview: URL.createObjectURL(file) });
    }

    if (retenus.length > 0) setPhotos((prev) => [...prev, ...retenus]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
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
      // Les photos ne partent qu'une fois la saisie validée, pour ne pas
      // laisser de fichiers orphelins si la cliente renonce. Envoi séquentiel :
      // une rafale d'envois parallèles met en difficulté les connexions lentes.
      const imageUrls: string[] = [];
      for (const p of photos) {
        imageUrls.push(await uploadImage(p.file, 'reviews', undefined, 'appointments'));
      }

      await reviewService.submit({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim(),
        imageUrls,
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
            <div className="flex items-center justify-between">
              <Label>Photos du résultat (facultatif)</Label>
              <span className="text-xs text-muted-foreground">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={p.preview} className="relative">
                  <img
                    src={p.preview}
                    alt={`Photo ${i + 1} jointe à votre avis`}
                    className="h-24 w-24 rounded-xl border border-border/60 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Retirer la photo ${i + 1}`}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/40">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) handlePhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
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
