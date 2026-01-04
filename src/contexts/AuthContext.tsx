import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserRole, Coach, Client } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  coachData: Coach | null;
  clientData: Client | null;
  loading: boolean;
  roleLoading: boolean;
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
  const [roleLoading, setRoleLoading] = useState(true);
  
  // Prevent stale role checks from overwriting newer results
  const roleCheckIdRef = useRef(0);

  const determineUserRole = async (email: string) => {
    const checkId = ++roleCheckIdRef.current;
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('[Auth] determineUserRole started for:', normalizedEmail, 'checkId:', checkId);
    
    // Clear previous role data before checking
    setCoachData(null);
    setClientData(null);
    setUserRole(null);
    setRoleLoading(true);
    
    try {
      // Check coaches table first
      console.log('[Auth] Checking coaches table...');
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (coachError) {
        console.error('[Auth] Coaches query error:', coachError);
      } else {
        console.log('[Auth] Coaches query result:', coach);
      }

      // Check if this is still the latest request
      if (checkId !== roleCheckIdRef.current) {
        console.log('[Auth] Stale check abandoned, checkId:', checkId, 'current:', roleCheckIdRef.current);
        return;
      }

      if (coach) {
        const role = coach.is_admin ? 'admin' : 'coach';
        console.log('[Auth] Found coach, setting role:', role);
        setCoachData(coach);
        setUserRole(role);
        setRoleLoading(false);
        return;
      }

      // Check clients table
      console.log('[Auth] Checking clients table...');
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (clientError) {
        console.error('[Auth] Clients query error:', clientError);
      } else {
        console.log('[Auth] Clients query result:', client);
      }

      // Check if this is still the latest request
      if (checkId !== roleCheckIdRef.current) {
        console.log('[Auth] Stale check abandoned, checkId:', checkId, 'current:', roleCheckIdRef.current);
        return;
      }

      if (client) {
        console.log('[Auth] Found client, status:', client.status);
        setClientData(client);
        setUserRole('client');
        
        // Update last_login_at for approved clients
        if (client.status === 'approved') {
          console.log('[Auth] Updating last_login_at for client');
          supabase
            .from('clients')
            .update({ last_login_at: new Date().toISOString() })
            .eq('email', normalizedEmail)
            .then(({ error }) => {
              if (error) console.error('[Auth] Failed to update last_login_at:', error);
            });
        }
        
        setRoleLoading(false);
        return;
      }

      console.log('[Auth] No coach or client found, userRole = null');
      setUserRole(null);
    } catch (error) {
      console.error('[Auth] determineUserRole exception:', error);
      // Only set null if this is still the current check
      if (checkId === roleCheckIdRef.current) {
        setUserRole(null);
      }
    } finally {
      // Only finish loading if this is still the current check
      if (checkId === roleCheckIdRef.current) {
        setRoleLoading(false);
        console.log('[Auth] roleLoading set to false, checkId:', checkId);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] onAuthStateChange event:', event, 'user:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          setRoleLoading(true); // Set BEFORE the async call to prevent race condition
          setTimeout(() => {
            determineUserRole(session.user.email!);
          }, 0);
        } else {
          console.log('[Auth] No session/user, clearing role data');
          setRoleLoading(false);
          setUserRole(null);
          setCoachData(null);
          setClientData(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] getSession result:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        determineUserRole(session.user.email);
      } else {
        console.log('[Auth] No existing session, roleLoading = false');
        setRoleLoading(false);
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
      roleLoading,
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
