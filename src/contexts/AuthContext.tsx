import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserRole, Coach, Client } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  coachData: Coach | null;
  clientData: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// Keep a single context instance even during Vite HMR / fast refresh.
const AUTH_CONTEXT_KEY = '__FG_AUTH_CONTEXT__';
const AuthContext = (
  ((globalThis as any)[AUTH_CONTEXT_KEY] as React.Context<AuthContextType | undefined> | undefined) ??
  createContext<AuthContextType | undefined>(undefined)
);
(globalThis as any)[AUTH_CONTEXT_KEY] = AuthContext;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [coachData, setCoachData] = useState<Coach | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const determineUserRole = async (email: string) => {
    // Check coaches table first
    const { data: coach } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (coach) {
      setCoachData(coach);
      setUserRole(coach.is_admin ? 'admin' : 'coach');
      return;
    }

    // Check clients table
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (client) {
      setClientData(client);
      setUserRole('client');
      return;
    }

    setUserRole(null);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          setTimeout(() => {
            determineUserRole(session.user.email!);
          }, 0);
        } else {
          setUserRole(null);
          setCoachData(null);
          setClientData(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        determineUserRole(session.user.email);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setCoachData(null);
    setClientData(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      coachData,
      clientData,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
