import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  role: 'employee' | 'hr_reviewer' | 'hr_resolver' | 'legal' | 'hr_lead' | 'admin';
  department?: string;
  team?: string;
  is_active: boolean;
  consent_to_store: boolean;
  consent_timestamp?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const savedToken = localStorage.getItem('hr_token');
const savedUser = localStorage.getItem('hr_user');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  setAuth: (user, token) => {
    localStorage.setItem('hr_token', token);
    localStorage.setItem('hr_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
