import api, { isMockMode } from './api';
import { User, Pagination, UserRole } from '../types';
import { mockUsers } from '../data/mock/mockUsers';

const USERS_STORAGE_KEY = 'cems_users_data';

const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    return [...mockUsers];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [...mockUsers];
  }
};

const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  async getUsers(params: {
    role?: UserRole | 'All';
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<{ users: User[]; pagination: Pagination }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      let list = getStoredUsers();

      if (params.role && params.role !== 'All') {
        list = list.filter((u) => u.role === params.role);
      }

      if (params.department && params.department !== 'All') {
        list = list.filter((u) => u.department === params.department);
      }

      if (typeof params.isActive === 'boolean') {
        list = list.filter((u) => u.isActive === params.isActive);
      }

      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.phone && u.phone.includes(query))
        );
      }

      const page = params.page || 1;
      const limit = params.limit || 10;
      const total = list.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;

      return {
        users: list.slice(startIndex, startIndex + limit),
        pagination: { total, page, limit, totalPages },
      };
    }

    const response = await api.get('/users', { params });
    return response.data.data;
  },

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredUsers();
      const index = list.findIndex((u) => u._id === id);
      if (index === -1) throw new Error('User not found');

      list[index] = { ...list[index], ...updateData };
      saveStoredUsers(list);

      // If updating current logged in user, update localStorage
      const currentUser = JSON.parse(localStorage.getItem('cems_user') || '{}');
      if (currentUser._id === id) {
        localStorage.setItem('cems_user', JSON.stringify(list[index]));
      }

      return list[index];
    }

    const response = await api.put(`/users/${id}`, updateData);
    return response.data.data;
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { isActive });
  },

  async deleteUser(id: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      let list = getStoredUsers();
      list = list.filter((u) => u._id !== id);
      saveStoredUsers(list);
      return;
    }

    await api.delete(`/users/${id}`);
  },

  async updateOrganizerStatus(id: string, status: 'approved' | 'denied'): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredUsers();
      const index = list.findIndex((u) => u._id === id);
      if (index === -1) throw new Error('User not found');

      list[index] = {
        ...list[index],
        organizerStatus: status,
        isActive: status === 'approved',
      };
      saveStoredUsers(list);
      return list[index];
    }

    const response = await api.patch(`/users/${id}/organizer-status`, { status });
    return response.data.data;
  },

  async updateAdminStatus(id: string, status: 'approved' | 'denied'): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredUsers();
      const index = list.findIndex((u) => u._id === id);
      if (index === -1) throw new Error('User not found');

      list[index] = {
        ...list[index],
        adminStatus: status,
        role: status === 'approved' ? 'admin' : list[index].role,
        isActive: status === 'approved',
      };
      saveStoredUsers(list);
      return list[index];
    }

    const response = await api.patch(`/users/${id}/admin-status`, { status });
    return response.data.data;
  },

  async suspendUser(id: string, reason?: string): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredUsers();
      const index = list.findIndex((u) => u._id === id);
      if (index === -1) throw new Error('User not found');

      list[index] = {
        ...list[index],
        status: 'suspended',
        isActive: false,
        suspensionReason: reason || 'Suspended by administrator',
      };
      saveStoredUsers(list);
      return list[index];
    }

    const response = await api.patch(`/users/${id}/suspend`, { reason });
    return response.data.data;
  },

  async reactivateUser(id: string): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredUsers();
      const index = list.findIndex((u) => u._id === id);
      if (index === -1) throw new Error('User not found');

      list[index] = {
        ...list[index],
        status: 'active',
        isActive: true,
        suspensionReason: '',
      };
      saveStoredUsers(list);
      return list[index];
    }

    const response = await api.patch(`/users/${id}/reactivate`);
    return response.data.data;
  },
};
