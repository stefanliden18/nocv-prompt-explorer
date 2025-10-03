import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook för att kontrollera om Time Debug Panel ska visas
 * 
 * Villkor (ALLA måste vara uppfyllda):
 * 1. Miljö !== production (import.meta.env.MODE !== 'production')
 * 2. Användare är Admin eller Rekryterare
 * 3. URL innehåller ?debug=1
 * 
 * Exempel: http://localhost:8080/admin/jobs/abc123/edit?debug=1
 */
export const useDebugMode = () => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  
  const isDebugEnabled = 
    import.meta.env.MODE !== 'production' && // INTE produktion
    (role === 'admin' || role === 'recruiter') && // Admin eller rekryterare
    (searchParams.get('debug') === '1'); // ?debug=1 i URL
  
  return { isDebugEnabled };
};
