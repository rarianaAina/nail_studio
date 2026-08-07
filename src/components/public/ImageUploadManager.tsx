import { motion } from 'framer-motion';
import { X, Image as Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export interface ReferenceImage {
  id: string;
  file?: File;
  url?: string;
  side: 'left' | 'right' | 'both' | 'other';
  caption?: string;
}

interface ImageUploadManagerProps {
  images: ReferenceImage[];
  onChange: (images: ReferenceImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const SIDE_OPTIONS = [
  { value: 'left', label: 'Main gauche' },
  { value: 'right', label: 'Main droite' },
  { value: 'both', label: 'Les deux' },
  { value: 'other', label: 'Autre' },
];

export function ImageUploadManager({ 
  images, 
  onChange, 
  maxImages = 4,
  disabled = false 
}: ImageUploadManagerProps) {

  const handleFileSelect = (file: File, side: string) => {
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = () => {
      const newImage: ReferenceImage = {
        id: Date.now().toString(),
        file: file,
        side: side as ReferenceImage['side'],
        url: reader.result as string,
      };
      onChange([...images, newImage]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const handleSideChange = (id: string, side: string) => {
    onChange(images.map(img => 
      img.id === id ? { ...img, side: side as ReferenceImage['side'] } : img
    ));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(images.map(img => 
      img.id === id ? { ...img, caption } : img
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Photos de référence</Label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Liste des images */}
      <div className="space-y-3">
        {images.map((img) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 p-3 rounded-xl border border-border/60 bg-secondary/30"
          >
            <div className="flex items-start gap-3">
              {/* Aperçu */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60">
                <img
                  src={img.url}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={img.side}
                    onValueChange={(v) => handleSideChange(img.id, v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Côté" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIDE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    onClick={() => handleRemove(img.id)}
                    className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Légende (optionnel)"
                  value={img.caption || ''}
                  onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                  className="w-full text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                  disabled={disabled}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bouton d'ajout */}
      {images.length < maxImages && !disabled && (
        <div
          className="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer hover:border-primary/40"
          onClick={() => document.getElementById('image-upload-input')?.click()}
        >
          <input
            id="image-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            multiple={false}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Demander le côté avant l'upload
                const side = prompt('Quel côté ? (left, right, both, other)', 'left');
                if (side && SIDE_OPTIONS.some(o => o.value === side)) {
                  handleFileSelect(file, side);
                } else {
                  toast.error('Côté invalide');
                }
              }
              e.target.value = '';
            }}
          />
          <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Ajouter une image
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP • Max 5 Mo
          </p>
        </div>
      )}
    </div>
  );
}