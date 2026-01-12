import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ValidationActivity {
  id: string;
  proof_line: string | null;
  fires_extracted: Record<string, unknown> | null;
  created_at: string;
  prediction_id: string | null;
}

export function useClientActivity(clientEmail: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['client-activity', clientEmail, limit],
    queryFn: async () => {
      if (!clientEmail) return [];

      const { data, error } = await supabase
        .from('validations')
        .select('id, proof_line, fires_extracted, created_at, prediction_id')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ValidationActivity[];
    },
    enabled: !!clientEmail,
  });
}
