import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoginPayload {
  username: string;
  password: string;
  remember: boolean;
}

export interface LoginResult {
  success: boolean;
  code?: 'invalidCredentials' | 'unknown';
  message?: string;
}

interface AuthState {
  status: 'anonymous' | 'authenticated';
  userName: string | null;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'anonymous',
      userName: null,
      login: async ({ username, password }) => {
        if (!username.trim() || !password.trim()) {
          return {
            success: false,
            code: 'invalidCredentials',
            message: '用户名或密码不能为空。',
          };
        }

        set({
          status: 'authenticated',
          userName: username.trim(),
        });

        return {
          success: true,
        };
      },
      logout: () => {
        set({
          status: 'anonymous',
          userName: null,
        });
      },
    }),
    {
      name: 'aionx-auth',
      partialize: (state) => ({
        status: state.status,
        userName: state.userName,
      }),
    }
  )
);
