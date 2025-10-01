import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  role: string;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 AuthContext: Initierar auth...');
    
    // First, set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event, 'Session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found:', session.user.email);
          // Use setTimeout to defer the Supabase call
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          console.log('❌ No user in session');
          setIsAdmin(false);
          setRole('user');
        }
      }
    );

    // Then get current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      }
      
      console.log('📦 Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Initial user:', session.user.email);
        checkAdminStatus(session.user.id);
      } else {
        console.log('❌ No initial session');
        setIsAdmin(false);
        setRole('user');
      }
      setLoading(false);
    });

    return () => {
      console.log('🔐 AuthContext: Unsubscribing...');
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('🔍 Checking role for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error checking profile role:', error);
        setIsAdmin(false);
        setRole('user');
        return;
      }
      
      const userRole = data?.role || 'user';
      console.log('✅ User role:', userRole);
      setRole(userRole);
      setIsAdmin(userRole === 'admin');
    } catch (error) {
      console.error('❌ Error in checkAdminStatus:', error);
      setIsAdmin(false);
      setRole('user');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      toast.success('Konto skapat! Du är nu inloggad.');
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Kunde inte skapa konto');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Inloggad!');
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Kunde inte logga in');
      throw error;
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      toast.success('Magic link skickad till din e-post!');
    } catch (error: any) {
      toast.error(error.message || 'Kunde inte skicka magic link');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Logged out successfully');
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setRole('user');
      
      toast.success('Utloggad!');
      navigate('/');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      toast.error(error.message || 'Kunde inte logga ut');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, role, loading, signUp, signIn, signOut, sendMagicLink }}>
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