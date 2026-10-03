import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    role?: UserRole;
  }) => Promise<User>;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;
  switchDemoRole: (role: UserRole) => User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('cems_token');
        const storedUser = localStorage.getItem('cems_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
        } else {
          // In mock mode demo: pre-login as student Alex Johnson for immediate exploration
          const user = await authService.getMe();
          setCurrentUser(user);
          setToken(localStorage.getItem('cems_token') || 'mock_token_init');
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    role?: UserRole;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setToken(null);
  };

  const updateProfile = (updated: Partial<User>) => {
    if (currentUser) {
      const newObj = { ...currentUser, ...updated };
      setCurrentUser(newObj);
      localStorage.setItem('cems_user', JSON.stringify(newObj));
    }
  };

  const switchDemoRole = (targetRole: UserRole): User => {
    const user = authService.switchDemoRole(targetRole);
    setCurrentUser(user);
    setToken(`mock_token_${user._id}`);
    return user;
  };

  const role: UserRole = currentUser?.role || 'student';
  const isAuthenticated = Boolean(currentUser && token);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
