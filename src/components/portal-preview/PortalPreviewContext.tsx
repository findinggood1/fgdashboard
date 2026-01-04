import { createContext, useContext, ReactNode } from 'react';
import { Client } from '@/lib/supabase';

interface PortalPreviewContextValue {
  clientEmail: string;
  clientData: Client;
  isPreviewMode: boolean;
}

const PortalPreviewContext = createContext<PortalPreviewContextValue | null>(null);

export function PortalPreviewProvider({ 
  children, 
  clientEmail, 
  clientData 
}: { 
  children: ReactNode; 
  clientEmail: string; 
  clientData: Client;
}) {
  return (
    <PortalPreviewContext.Provider value={{ clientEmail, clientData, isPreviewMode: true }}>
      {children}
    </PortalPreviewContext.Provider>
  );
}

export function usePortalPreview() {
  return useContext(PortalPreviewContext);
}
