import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  onRemove,
  accept = "image/jpeg,image/png,image/jpg,image/webp",
  maxSizeMB = 5,
  className
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.some(type => file.type === type)) {
      setError("Endast JPEG, PNG och WEBP-filer tillåts");
      return false;
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Filen är för stor. Max ${maxSizeMB}MB tillåts`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onChange(file);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, []);

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-contain rounded-lg border border-border bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            error && "border-destructive"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <Upload className="h-12 w-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Klicka för att välja eller dra och släpp
              </p>
              <p className="text-xs text-muted-foreground">
                Du kan också klistra in en bild (Ctrl+V)
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG eller WEBP (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
