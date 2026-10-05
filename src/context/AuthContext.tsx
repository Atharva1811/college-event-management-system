import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { isMockMode, setApiAuthToken } from '../services/api';

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
  applyOrganizerUpgrade: (data: {
    department?: string;
    reason?: string;
  }) => Promise<any>;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;
  switchDemoRole: (role: UserRole) => Promise<User>;
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
          // If stored token is a legacy mock token and we are now in normal mode, clear it
          if (storedToken.startsWith('mock_') && !isMockMode()) {
            localStorage.removeItem('cems_token');
            localStorage.removeItem('cems_user');
            setApiAuthToken(null);
            setToken(null);
            setCurrentUser(null);
          } else {
            setApiAuthToken(storedToken);
            setToken(storedToken);
            setCurrentUser(JSON.parse(storedUser));
          }
        } else {
          if (isMockMode()) {
            const user = await authService.getMe();
            setCurrentUser(user);
            const mToken = localStorage.getItem('cems_token') || 'mock_token_init';
            setToken(mToken);
            setApiAuthToken(mToken);
          } else {
            setApiAuthToken(null);
            setCurrentUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Requirement 11: Multi-tab session synchronization without manual refresh
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cems_token' || e.key === 'cems_user') {
        const activeToken = localStorage.getItem('cems_token');
        const activeUserStr = localStorage.getItem('cems_user');
        if (!activeToken || !activeUserStr) {
          setApiAuthToken(null);
          setCurrentUser(null);
          setToken(null);
        } else {
          try {
            const parsed = JSON.parse(activeUserStr);
            setApiAuthToken(activeToken);
            setToken(activeToken);
            setCurrentUser(parsed);
          } catch {
            setApiAuthToken(null);
            setCurrentUser(null);
            setToken(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Requirement 12: Periodic heartbeat session validation (approx every 20s)
  useEffect(() => {
    if (!token || !currentUser || isMockMode()) return;

    const interval = setInterval(async () => {
      try {
        const user = await authService.getMe();
        if (user.status === 'suspended' || (user as any).isActive === false) {
          sessionStorage.setItem(
            'cems_suspension_reason',
            (user as any).suspensionReason || 'Your account has been suspended by the administrator.'
          );
          logout();
          const base = import.meta.env.BASE_URL || '/';
          const normalizedBase = base.endsWith('/') ? base : `${base}/`;
          window.location.href = `${normalizedBase}access-denied`;
        }
      } catch (err: any) {
        if (
          err?.response?.status === 403 &&
          (err?.response?.data?.code === 'ACCOUNT_SUSPENDED' ||
            err?.response?.data?.message?.toLowerCase().includes('suspended'))
        ) {
          logout();
          const base = import.meta.env.BASE_URL || '/';
          const normalizedBase = base.endsWith('/') ? base : `${base}/`;
          window.location.href = `${normalizedBase}access-denied`;
        }
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [token, currentUser]);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem('cems_suspension_reason');
      const response = await authService.login(email, password);
      setApiAuthToken(response.token);
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
      sessionStorage.removeItem('cems_suspension_reason');
      const response = await authService.register(userData);
      setApiAuthToken(response.token);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const applyOrganizerUpgrade = async (data: { department?: string; reason?: string }) => {
    const res = await authService.applyOrganizerUpgrade(data);
    if (res.user && currentUser) {
      const updated = { ...currentUser, organizerStatus: res.user.organizerStatus };
      setCurrentUser(updated);
      localStorage.setItem('cems_user', JSON.stringify(updated));
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setApiAuthToken(null);
    setCurrentUser(null);
    setToken(null);
    sessionStorage.removeItem('cems_suspension_reason');
  };

  const updateProfile = (updated: Partial<User>) => {
    if (currentUser) {
      const newObj = { ...currentUser, ...updated };
      setCurrentUser(newObj);
      localStorage.setItem('cems_user', JSON.stringify(newObj));
    }
  };

  const switchDemoRole = async (targetRole: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.switchDemoRole(targetRole);
      setCurrentUser(user);
      setToken(localStorage.getItem('cems_token'));
      return user;
    } finally {
      setIsLoading(false);
    }
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
        applyOrganizerUpgrade,
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
