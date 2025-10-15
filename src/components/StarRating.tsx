import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface StarRatingProps {
  rating: number | null;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, onRatingChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseDown = (value: number) => {
    if (!readonly) {
      setIsDragging(true);
      setHoverRating(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (isDragging && !readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && hoverRating && onRatingChange && !readonly) {
      onRatingChange(hoverRating);
    }
    setIsDragging(false);
    setHoverRating(null);
  };

  const handleTouchStart = (value: number, e: React.TouchEvent) => {
    if (!readonly) {
      e.preventDefault();
      setIsDragging(true);
      setHoverRating(value);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || readonly) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const starButton = element?.closest('button');
    
    if (starButton) {
      const value = parseInt(starButton.getAttribute('data-value') || '0');
      if (value > 0) {
        setHoverRating(value);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && hoverRating && onRatingChange && !readonly) {
      onRatingChange(hoverRating);
    }
    setIsDragging(false);
    setHoverRating(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, hoverRating]);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          data-value={value}
          onClick={() => handleClick(value)}
          onMouseDown={() => handleMouseDown(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onTouchStart={(e) => handleTouchStart(value, e)}
          onTouchMove={handleTouchMove}
          disabled={readonly}
          className={cn(
            'transition-colors',
            !readonly && 'cursor-pointer hover:scale-110 select-none touch-none',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) && value <= (hoverRating || rating || 0)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground',
              isDragging && hoverRating && value <= hoverRating && 'scale-110'
            )}
          />
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-sm text-muted-foreground">
          ({rating}/5)
        </span>
      )}
    </div>
  );
}
