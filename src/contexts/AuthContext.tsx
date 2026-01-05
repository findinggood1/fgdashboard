import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserRole, Coach, Client } from '@/lib/supabase';

export interface UserRoles {
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  userRoles: UserRoles;
  activeView: 'admin' | 'coach' | 'client' | null;
  coachData: Coach | null;
  clientData: Client | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchView: (view: 'admin' | 'coach' | 'client') => void;
}

// Keep a single context instance even during Vite HMR / fast refresh.
const AUTH_CONTEXT_KEY = '__FG_AUTH_CONTEXT__';
const AuthContext = (
  ((globalThis as any)[AUTH_CONTEXT_KEY] as React.Context<AuthContextType | undefined> | undefined) ??
  createContext<AuthContextType | undefined>(undefined)
);
(globalThis as any)[AUTH_CONTEXT_KEY] = AuthContext;

const DEFAULT_ROLES: UserRoles = { isAdmin: false, isCoach: false, isClient: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userRoles, setUserRoles] = useState<UserRoles>(DEFAULT_ROLES);
  const [activeView, setActiveView] = useState<'admin' | 'coach' | 'client' | null>(null);
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
    setUserRoles(DEFAULT_ROLES);
    setActiveView(null);
    setRoleLoading(true);
    
    try {
      const roles: UserRoles = { isAdmin: false, isCoach: false, isClient: true };
      let foundCoachData: Coach | null = null;
      let foundClientData: Client | null = null;

      // Check coaches table (case-insensitive)
      console.log('[Auth] Checking coaches table...');
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .ilike('email', normalizedEmail)
        .limit(1)
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
        foundCoachData = coach;
        roles.isCoach = true;
        if (coach.is_admin) {
          roles.isAdmin = true;
        }
      }

      // Check clients table (case-insensitive)
      console.log('[Auth] Checking clients table...');
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', normalizedEmail)
        .limit(1)
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
        foundClientData = client;
        roles.isClient = true;
        
        // Update last_login_at for approved clients
        if (client.status === 'approved') {
          console.log('[Auth] Updating last_login_at for client');
          supabase
            .from('clients')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', client.id)
            .then(({ error }) => {
              if (error) console.error('[Auth] Failed to update last_login_at:', error);
            });
        }
      }

      // Set all role data
      setUserRoles(roles);
      setCoachData(foundCoachData);
      setClientData(foundClientData);

      // Determine primary role and default active view (highest priority first)
      let primaryRole: UserRole = null;
      let defaultView: 'admin' | 'coach' | 'client' | null = null;

      if (roles.isAdmin) {
        primaryRole = 'admin';
        defaultView = 'admin';
      } else if (roles.isCoach) {
        primaryRole = 'coach';
        defaultView = 'coach';
      } else if (roles.isClient) {
        primaryRole = 'client';
        defaultView = 'client';
      }

      console.log('[Auth] Roles determined:', roles, 'Primary:', primaryRole, 'DefaultView:', defaultView);
      setUserRole(primaryRole);
      setActiveView(defaultView);

    } catch (error) {
      console.error('[Auth] determineUserRole exception:', error);
      // Only set null if this is still the current check
      if (checkId === roleCheckIdRef.current) {
        setUserRole(null);
        setUserRoles(DEFAULT_ROLES);
        setActiveView(null);
      }
    } finally {
      // Only finish loading if this is still the current check
      if (checkId === roleCheckIdRef.current) {
        setRoleLoading(false);
        console.log('[Auth] roleLoading set to false, checkId:', checkId);
      }
    }
  };

  const switchView = (view: 'admin' | 'coach' | 'client') => {
    console.log('[Auth] Switching view to:', view);
    setActiveView(view);
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
          setUserRoles(DEFAULT_ROLES);
          setActiveView(null);
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
    setUserRoles(DEFAULT_ROLES);
    setActiveView(null);
    setCoachData(null);
    setClientData(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      userRoles,
      activeView,
      coachData,
      clientData,
      loading,
      roleLoading,
      signIn,
      signOut,
      switchView,
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
