import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaxonomyItem {
  concept_id: string;
  type: string;
  version: number;
  label: string;
}

export const useAFTaxonomy = () => {
  const { data: taxonomyData = [], isLoading } = useQuery({
    queryKey: ['af-taxonomy'],
    queryFn: async () => {
      console.log('🔍 Fetching AF taxonomy data...');
      
      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('concept_id, type, version, label')
        .order('label');

      if (error) {
        console.error('❌ Error fetching taxonomy:', error);
        throw error;
      }

      console.log('✅ Fetched taxonomy items:', data?.length);
      return data as TaxonomyItem[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Helper to get latest version for each type
  const getLatestVersion = (items: TaxonomyItem[]) => {
    const uniqueMap = new Map<string, TaxonomyItem>();
    
    items.forEach(item => {
      const existing = uniqueMap.get(item.label);
      if (!existing || item.version > existing.version) {
        uniqueMap.set(item.label, item);
      }
    });
    
    return Array.from(uniqueMap.values());
  };

  // Filter by type and get latest versions
  const occupationCodes = getLatestVersion(
    taxonomyData.filter(item => item.type === 'occupation-name')
  );

  const municipalityCodes = getLatestVersion(
    taxonomyData.filter(item => item.type === 'municipality')
  );

  const employmentTypeCodes = getLatestVersion(
    taxonomyData.filter(item => item.type === 'employment-type')
  );

  const durationCodes = getLatestVersion(
    taxonomyData.filter(item => item.type === 'employment-duration')
  );

  const worktimeExtentCodes = getLatestVersion(
    taxonomyData.filter(item => item.type === 'worktime-extent')
  );

  return {
    occupationCodes,
    municipalityCodes,
    employmentTypeCodes,
    durationCodes,
    worktimeExtentCodes,
    isLoading,
  };
};
