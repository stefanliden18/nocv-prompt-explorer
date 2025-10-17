import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAFTaxonomy = () => {
  const { data: occupationCodes = [], isLoading: occupationsLoading } = useQuery({
    queryKey: ['af-occupation-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('af_occupation_codes')
        .select('*')
        .order('label_sv');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: municipalityCodes = [], isLoading: municipalitiesLoading } = useQuery({
    queryKey: ['af-municipality-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('af_municipality_codes')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: employmentTypeCodes = [], isLoading: employmentTypesLoading } = useQuery({
    queryKey: ['af-employment-type-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('af_employment_type_codes')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: durationCodes = [], isLoading: durationsLoading } = useQuery({
    queryKey: ['af-duration-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('af_duration_codes')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data;
    }
  });

  return {
    occupationCodes,
    municipalityCodes,
    employmentTypeCodes,
    durationCodes,
    isLoading: occupationsLoading || municipalitiesLoading || 
               employmentTypesLoading || durationsLoading
  };
};