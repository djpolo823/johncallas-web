import { supabase, isSupabaseConfigured } from './supabase';
import { Role, type UserAccount } from '../types';

const USERS_STORAGE_KEY = 'jc_users';
const SESSION_STORAGE_KEY = 'jc_session';

// Pre-configured development users
const MOCK_USERS: UserAccount[] = [
  {
    id: 'mock-admin-id',
    email: 'admin@johncallas.com',
    name: 'Alexandra Von Callas',
    role: Role.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'mock-vendor-id',
    email: 'vendedor@johncallas.com',
    name: 'Carlos Vendedor',
    role: Role.VENDOR,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'mock-client-id',
    email: 'cliente@johncallas.com',
    name: 'Sophia Loren',
    role: Role.CLIENT,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'mock-inventario-id',
    email: 'inventario@johncallas.com',
    name: 'Mateo Sierra (Bodega)',
    role: Role.INVENTARIO,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MS'
  },
  {
    id: 'mock-artesano-id',
    email: 'artesano@johncallas.com',
    name: 'John Callas (Taller)',
    role: Role.ARTESANO,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=JC'
  }
];

// Initialize mock database if empty
const initMockDB = () => {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
  }
};

export const AuthService = {
  login: async (email: string, password?: string): Promise<UserAccount> => {
    if (!isSupabaseConfigured) {
      // Local Storage Fallback Login
      initMockDB();
      const users: UserAccount[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      
      if (!user) {
        throw new Error('Usuario no encontrado en la demostración local.');
      }
      
      // Save session
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return user;
    }

    // Supabase login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password || ''
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al iniciar sesión.');

    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      // If profile is missing, create a default profile with CLIENT role
      const defaultProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata.name || authData.user.email!.split('@')[0],
        role: Role.CLIENT
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: defaultProfile.id,
          email: defaultProfile.email,
          full_name: defaultProfile.name,
          role: defaultProfile.role
        });

      if (insertError) throw insertError;
      return defaultProfile;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.email,
      role: (profile.role as Role) || Role.CLIENT,
      avatar: profile.avatar_url
    };
  },

  register: async (email: string, name: string, password?: string, role: Role = Role.CLIENT): Promise<UserAccount> => {
    if (!isSupabaseConfigured) {
      initMockDB();
      const users: UserAccount[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('El correo ya está registrado en la demo.');
      }

      const newUser: UserAccount = {
        id: `mock-id-${Date.now()}`,
        email,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      };

      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    }

    // Supabase Register
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: password || '',
      options: {
        data: {
          name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al registrar usuario.');

    // Create user profile
    const newUser: UserAccount = {
      id: authData.user.id,
      email,
      name,
      role
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.name,
        role: newUser.role
      });

    if (insertError) throw insertError;
    return newUser;
  },

  logout: async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<UserAccount | null> => {
    if (!isSupabaseConfigured) {
      initMockDB();
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session) {
        return JSON.parse(session) as UserAccount;
      }
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || session.user.email!.split('@')[0],
        role: Role.CLIENT
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.email,
      role: (profile.role as Role) || Role.CLIENT,
      avatar: profile.avatar_url
    };
  }
};
