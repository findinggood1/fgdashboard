import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Prediction {
  id: string;
  title: string;
  type: string | null;
  status: string | null;
  current_predictability_score: number | null;
  created_at: string;
  updated_at: string | null;
}

export function useClientPredictions(clientEmail: string | undefined) {
  return useQuery({
    queryKey: ['client-predictions', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return [];

      const { data, error } = await supabase
        .from('predictions')
        .select('id, title, type, status, current_predictability_score, created_at, updated_at')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Prediction[];
    },
    enabled: !!clientEmail,
  });
}
