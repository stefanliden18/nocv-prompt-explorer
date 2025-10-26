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
      console.log('🔄 useAFTaxonomy: Fetching taxonomy data...');
      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('*')
        .order('type, label');
      
      if (error) {
        console.error('❌ useAFTaxonomy: Error fetching data:', error);
        throw error;
      }
      console.log('✅ useAFTaxonomy: Data fetched:', data?.length, 'items');
      return data as TaxonomyItem[];
    }
  });

  // Gruppera per typ
  const occupationCodes = taxonomyData.filter(t => t.type === 'occupation-name');
  const municipalityCodes = taxonomyData.filter(t => t.type === 'municipality');
  const employmentTypeCodes = taxonomyData.filter(t => t.type === 'employment-type');
  const durationCodes = taxonomyData.filter(t => t.type === 'duration');
  const worktimeExtentCodes = taxonomyData.filter(t => t.type === 'worktime-extent');

  console.log('📊 useAFTaxonomy: Filtered data:', {
    occupationCodes: occupationCodes.length,
    municipalityCodes: municipalityCodes.length,
    employmentTypeCodes: employmentTypeCodes.length,
    durationCodes: durationCodes.length,
    worktimeExtentCodes: worktimeExtentCodes.length,
    isLoading
  });

  console.log('🔍 useAFTaxonomy: worktimeExtentCodes details:', worktimeExtentCodes);

  return {
    occupationCodes,
    municipalityCodes,
    employmentTypeCodes,
    durationCodes,
    worktimeExtentCodes,
    isLoading
  };
};