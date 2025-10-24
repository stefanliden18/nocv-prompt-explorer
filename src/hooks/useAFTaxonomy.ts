import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaxonomyItem {
  concept_id: string;
  type: string;
  version: number;
  code: string | null;
  label: string;
}

export const useAFTaxonomy = () => {
  const { data: taxonomyData = [], isLoading } = useQuery({
    queryKey: ['af-taxonomy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('*')
        .order('type, label');
      
      if (error) throw error;
      return data as TaxonomyItem[];
    }
  });

  // Gruppera per typ
  const occupationCodes = taxonomyData.filter(t => t.type === 'occupation-name');
  const municipalityCodes = taxonomyData.filter(t => t.type === 'municipality');
  const employmentTypeCodes = taxonomyData.filter(t => t.type === 'employment-type');
  const durationCodes = taxonomyData.filter(t => t.type === 'duration');
  const worktimeExtentCodes = taxonomyData.filter(t => t.type === 'worktime-extent');

  return {
    occupationCodes,
    municipalityCodes,
    employmentTypeCodes,
    durationCodes,
    worktimeExtentCodes,
    isLoading
  };
};