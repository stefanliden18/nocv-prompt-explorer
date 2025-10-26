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
    staleTime: 0, // Tvinga alltid fresh data
    refetchOnMount: true, // Refetch när komponenten mountar
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
      
      // NYA LOGS - Kolla RAW data INNAN return
      console.log('🔍 RAW DATA från Supabase:', {
        totalRows: data?.length,
        firstRow: data?.[0],
        worktimeRows: data?.filter(d => d.type === 'worktime-extent'),
        uniqueTypes: [...new Set(data?.map(d => d.type))]
      });
      
      console.log('✅ useAFTaxonomy: Data fetched:', data?.length, 'items');
      return data as TaxonomyItem[];
    }
  });

  // EXTRA LOG - Kolla vad taxonomyData innehåller EFTER React Query
  console.log('📦 taxonomyData EFTER React Query:', {
    length: taxonomyData.length,
    isArray: Array.isArray(taxonomyData),
    sample: taxonomyData[0],
    worktimeCount: taxonomyData.filter(t => t.type === 'worktime-extent').length
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