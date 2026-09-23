import api from './api';
import { User } from '../store/authStore';

export interface LoginPayload {
  email: string;
  password: string;
  consent_to_store?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: any): Promise<User> => {
    const res = await api.post<User>('/auth/register', payload);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};
