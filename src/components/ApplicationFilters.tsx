import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
}

interface ApplicationFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  minRating: number;
  maxRating: number;
  onRatingChange: (min: number, max: number) => void;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  applicationCounts: {
    total: number;
    new: number;
    viewed: number;
    booked: number;
    rejected: number;
  };
}

export function ApplicationFilters({
  statusFilter,
  onStatusFilterChange,
  minRating,
  maxRating,
  onRatingChange,
  selectedTags,
  onTagsChange,
  applicationCounts,
}: ApplicationFiltersProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAllTags();
  }, []);

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('application_tags')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAllTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onStatusFilterChange('all');
    onRatingChange(1, 5);
    onTagsChange([]);
  };

  const hasActiveFilters = statusFilter !== 'all' || minRating !== 1 || maxRating !== 5 || selectedTags.length > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Rensa alla
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrera status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla ({applicationCounts.total})</SelectItem>
              <SelectItem value="new">Nya ({applicationCounts.new})</SelectItem>
              <SelectItem value="viewed">Sedda ({applicationCounts.viewed})</SelectItem>
              <SelectItem value="booked">Bokade ({applicationCounts.booked})</SelectItem>
              <SelectItem value="rejected">Avvisade ({applicationCounts.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating Filter */}
        <div className="space-y-2">
          <Label>Rating: {minRating} - {maxRating} stjärnor</Label>
          <div className="pt-2">
            <Slider
              min={1}
              max={5}
              step={1}
              value={[minRating, maxRating]}
              onValueChange={([min, max]) => onRatingChange(min, max)}
              className="w-full"
            />
          </div>
        </div>

        {/* Tag Filter */}
        <div className="space-y-2">
          <Label>Taggar</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {selectedTags.length > 0 ? (
                  <span>{selectedTags.length} tagg(ar) valda</span>
                ) : (
                  <span className="text-muted-foreground">Välj taggar...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Sök taggar..." />
                <CommandList>
                  <CommandEmpty>Inga taggar hittades</CommandEmpty>
                  <CommandGroup>
                    {allTags.map((tag) => {
                      const isSelected = selectedTags.some(t => t.id === tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => toggleTag(tag)}
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          {tag.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
