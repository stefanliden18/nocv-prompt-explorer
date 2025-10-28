import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaxonomyType = 
  | "occupation-name"
  | "municipality" 
  | "employment-type"
  | "employment-duration"
  | "worktime-extent";

export interface TaxonomyItem {
  concept_id: string;
  label: string;
  type: string;
  version: number;
  is_common?: boolean;
}

export const useAFTaxonomy = (type: TaxonomyType) => {
  return useQuery({
    queryKey: ["af-taxonomy", type],
    queryFn: async () => {
      console.log(`Fetching taxonomy for type: ${type}`);

      // Fetch WITHOUT ordering from Supabase - let React handle sorting
      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('concept_id, type, version, label, is_common');

      if (error) {
        console.error("Error fetching taxonomy:", error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Filter by type
      const filtered = data.filter(item => item.type === type);

      // Remove duplicates based on concept_id
      const uniqueMap = new Map<string, TaxonomyItem>();
      filtered.forEach(item => {
        if (!uniqueMap.has(item.concept_id)) {
          uniqueMap.set(item.concept_id, item as TaxonomyItem);
        }
      });

      // Sort ONCE with correct Swedish locale
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        // 1. Prioritize common items first
        if (a.is_common && !b.is_common) return -1;
        if (!a.is_common && b.is_common) return 1;
        
        // 2. Then alphabetically with Swedish locale (Å, Ä, Ö in correct places)
        return a.label.localeCompare(b.label, 'sv-SE');
      });

      console.log(`Loaded ${sorted.length} items for ${type}`);
      return sorted;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
