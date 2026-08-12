import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ReferenceImage } from '@/types';

interface ImageUploadSectionProps {
  type: 'left' | 'right' | 'inspiration';
  label: string;
  description?: string;
  images: ReferenceImage[];
  onChange: (images: ReferenceImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploadSection({
  type,
  label,
  description,
  images,
  onChange,
  maxImages = 4,
  disabled = false,
}: ImageUploadSectionProps) {
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImage: ReferenceImage = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        url: reader.result as string,
        type: type,
        file: file,
      };
      onChange([...images, newImage]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(images.map(img => 
      img.id === id ? { ...img, caption } : img
    ));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Images existantes */}
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative group"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border/60">
              <img
                src={img.url}
                alt={`${label} ${img.caption || ''}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90"
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Légende..."
              value={img.caption || ''}
              onChange={(e) => handleCaptionChange(img.id, e.target.value)}
              className="mt-1 w-full text-[10px] bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              disabled={disabled}
            />
          </motion.div>
        ))}

        {/* Bouton d'ajout */}
        {images.length < maxImages && !disabled && (
          <div
            className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 transition-colors hover:border-primary/40"
            onClick={() => document.getElementById(`upload-${type}`)?.click()}
          >
            <input
              id={`upload-${type}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
            />
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Ajouter</span>
          </div>
        )}
      </div>
    </div>
  );
}