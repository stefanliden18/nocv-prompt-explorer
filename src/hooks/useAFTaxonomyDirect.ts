import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAFTaxonomyDirect = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirect = async () => {
      console.log('🔄 DIRECT FETCH: Fetching worktime-extent taxonomy...');
      const { data: result, error } = await supabase
        .from('af_taxonomy')
        .select('*')
        .eq('type', 'worktime-extent');
      
      console.log('📊 DIRECT FETCH result:', {
        error,
        dataLength: result?.length,
        data: result
      });
      
      if (!error && result) {
        setData(result);
      }
      setLoading(false);
    };

    fetchDirect();
  }, []);

  return { data, loading };
};
