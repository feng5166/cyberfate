'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isSubscribed?: boolean;
}

export type AuthStatus = 'guest' | 'free' | 'paid';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: AuthUser; isPaid?: boolean } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  status: 'guest',
  user: null,
  isLoading: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN': {
      const { user, isPaid } = action.payload;
      return {
        status: isPaid ? 'paid' : 'free',
        user,
        isLoading: false,
      };
    }
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (user: AuthUser, isPaid?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback((user: AuthUser, isPaid?: boolean) => {
    dispatch({ type: 'LOGIN', payload: { user, isPaid } });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthStore must be used within an AuthProvider');
  }
  return ctx;
}
