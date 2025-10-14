import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
}

interface TagManagerProps {
  applicationId: string;
  currentTags: Tag[];
  onTagsChange: () => void;
}

export function TagManager({ applicationId, currentTags, onTagsChange }: TagManagerProps) {
  const { toast } = useToast();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

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

  const addTag = async (tagName: string) => {
    try {
      // Check if tag already exists on this application
      if (currentTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
        toast({
          title: 'Taggen finns redan',
          description: 'Denna tagg är redan tillagd',
          variant: 'destructive',
        });
        return;
      }

      // Find or create tag
      let tagId: string;
      const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: tagError } = await supabase
          .from('application_tags')
          .insert({ name: tagName })
          .select()
          .single();

        if (tagError) throw tagError;
        tagId = newTag.id;
        await fetchAllTags();
      }

      // Create relation
      const { error: relationError } = await supabase
        .from('application_tag_relations')
        .insert({
          application_id: applicationId,
          tag_id: tagId,
        });

      if (relationError) throw relationError;

      toast({
        title: 'Tagg tillagd',
        description: `"${tagName}" har lagts till`,
      });

      setNewTagName('');
      setOpen(false);
      onTagsChange();
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte lägga till tagg',
        variant: 'destructive',
      });
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('application_tag_relations')
        .delete()
        .eq('application_id', applicationId)
        .eq('tag_id', tagId);

      if (error) throw error;

      toast({
        title: 'Tagg borttagen',
        description: 'Taggen har tagits bort',
      });

      onTagsChange();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte ta bort tagg',
        variant: 'destructive',
      });
    }
  };

  const availableTags = allTags.filter(
    tag => !currentTags.some(ct => ct.id === tag.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Lägg till tagg
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Sök eller skapa tagg..." 
              value={newTagName}
              onValueChange={setNewTagName}
            />
            <CommandList>
              <CommandEmpty>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => newTagName && addTag(newTagName)}
                >
                  Skapa "{newTagName}"
                </Button>
              </CommandEmpty>
              <CommandGroup>
                {availableTags
                  .filter(tag => tag.name.toLowerCase().includes(newTagName.toLowerCase()))
                  .map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => addTag(tag.name)}
                    >
                      {tag.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
