import api, { isMockMode, setApiAuthToken } from './api';
import { AuthResponse, User, UserRole } from '../types';
import { mockUsers } from '../data/mock/mockUsers';

export const authService = {
  async login(email: string, password?: string): Promise<AuthResponse> {
    sessionStorage.removeItem('cems_suspension_reason');
    if (isMockMode()) {
      // Simulate realistic network delay
      await new Promise((res) => setTimeout(res, 400));

      const normalizedEmail = email.toLowerCase().trim();
      const foundUser = mockUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (!foundUser) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }

      if (!foundUser.isActive) {
        throw new Error('This account is deactivated. Please contact support.');
      }

      if (foundUser.role === 'organizer') {
        if (foundUser.organizerStatus === 'pending') {
          throw new Error('Your organizer application is currently pending admin approval.');
        }
        if (foundUser.organizerStatus === 'denied') {
          throw new Error('Your organizer application has been denied.');
        }
      }

      const token = `mock_jwt_token_${foundUser._id}_${Date.now()}`;
      setApiAuthToken(token);
      localStorage.setItem('cems_token', token);
      localStorage.setItem('cems_user', JSON.stringify(foundUser));

      return { user: foundUser, token };
    }

    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    setApiAuthToken(token);
    localStorage.setItem('cems_token', token);
    localStorage.setItem('cems_user', JSON.stringify(user));
    return { user, token };
  },

  async applyOrganizer(applicationData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    reason?: string;
  }): Promise<{ user: User; message: string }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 500));
      const normalizedEmail = applicationData.email.toLowerCase().trim();
      const existing = mockUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        throw new Error('A user with this email address already exists.');
      }

      const newUser: User = {
        _id: `org_app_${Date.now()}`,
        name: applicationData.name,
        email: normalizedEmail,
        role: 'organizer',
        phone: applicationData.phone || '',
        department: (applicationData.department as User['department']) || 'Computer Science',
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150`,
        isActive: true,
        organizerStatus: 'pending',
        applicationReason: applicationData.reason || '',
        createdAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      return {
        user: newUser,
        message: 'Organizer application submitted successfully. It is pending admin review.',
      };
    }

    const response = await api.post('/auth/apply-organizer', applicationData);
    return response.data;
  },

  async applyAdmin(applicationData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    reason?: string;
  }): Promise<{ message: string }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 500));
      return {
        message: 'Administrator application submitted successfully. It is pending active admin review.',
      };
    }

    const response = await api.post('/auth/apply-admin', applicationData);
    return response.data;
  },

  async applyOrganizerUpgrade(data: {
    department?: string;
    reason?: string;
  }): Promise<{ message: string; user: User }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 400));
      return {
        message: 'Your faculty organizer upgrade request has been submitted.',
        user: mockUsers[4],
      };
    }

    const response = await api.post('/auth/apply-organizer-upgrade', data);
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 400));
      return {
        message: 'If an account exists for that email, recovery instructions have been sent.',
      };
    }

    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 400));
      return { message: 'Password has been reset successfully. You can now sign in.' };
    }

    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async register(userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    role?: UserRole;
  }): Promise<AuthResponse> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 500));

      const normalizedEmail = userData.email.toLowerCase().trim();
      const existing = mockUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        throw new Error('A user with this email address already exists.');
      }

      const newUser: User = {
        _id: `usr_new_${Date.now()}`,
        name: userData.name,
        email: normalizedEmail,
        role: userData.role || 'student', // Force student for public registration
        phone: userData.phone || '',
        department: (userData.department as User['department']) || 'Computer Science',
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      const token = `mock_jwt_token_${newUser._id}_${Date.now()}`;
      setApiAuthToken(token);
      localStorage.setItem('cems_token', token);
      localStorage.setItem('cems_user', JSON.stringify(newUser));

      return { user: newUser, token };
    }

    sessionStorage.removeItem('cems_suspension_reason');
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data.data;
    setApiAuthToken(token);
    localStorage.setItem('cems_token', token);
    localStorage.setItem('cems_user', JSON.stringify(user));
    return { user, token };
  },

  async getMe(): Promise<User> {
    if (isMockMode()) {
      const stored = localStorage.getItem('cems_user');
      if (stored) {
        return JSON.parse(stored);
      }
      // Default to student for first-time visitors in demo
      const defaultUser = mockUsers[4]; // Alex Johnson
      localStorage.setItem('cems_user', JSON.stringify(defaultUser));
      localStorage.setItem('cems_token', 'mock_jwt_token_default');
      setApiAuthToken('mock_jwt_token_default');
      return defaultUser;
    }

    const currentToken = localStorage.getItem('cems_token');
    if (!currentToken) {
      throw new Error('Not authenticated');
    }

    const response = await api.get('/auth/me');
    const user = response.data.data;
    // Guard against race condition: only persist if active token matches
    if (localStorage.getItem('cems_token') === currentToken) {
      localStorage.setItem('cems_user', JSON.stringify(user));
    }
    return user;
  },

  logout(): void {
    localStorage.removeItem('cems_token');
    localStorage.removeItem('cems_user');
    sessionStorage.removeItem('cems_suspension_reason');
    setApiAuthToken(null);
  },

  // Helper for ADBMS & Frontend demo: switch between student, organizer, admin in 1-click!
  async switchDemoRole(role: UserRole): Promise<User> {
    if (isMockMode()) {
      let targetUser: User;
      if (role === 'admin') {
        targetUser = mockUsers[0]; // Dr. Sarah Jenkins
      } else if (role === 'organizer') {
        targetUser = mockUsers[1]; // Prof. Marcus Vance
      } else {
        targetUser = mockUsers[4]; // Alex Johnson (student)
      }

      localStorage.setItem('cems_user', JSON.stringify(targetUser));
      localStorage.setItem('cems_token', `mock_token_${targetUser._id}`);
      return targetUser;
    }

    let email = 'alex@student.cems.edu';
    if (role === 'admin') email = 'admin@cems.edu';
    else if (role === 'organizer') email = 'vance@cems.edu';

    const { user } = await this.login(email, 'password123');
    return user;
  },
};
