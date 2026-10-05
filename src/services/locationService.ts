import api, { isMockMode } from './api';
import { Location } from '../types';

export const mockLocations: Location[] = [
  {
    _id: 'loc_main_auditorium',
    name: 'Main University Auditorium',
    building: 'Dr. APJ Abdul Kalam Block',
    floor: 'Ground Floor',
    room: 'Auditorium A',
    description: 'Central campus auditorium equipped with dual projectors and surround sound.',
    capacity: 500,
    status: 'active',
    accessType: 'global',
    department: 'General',
    createdBy: 'usr_admin_1',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'loc_cs_lab_3',
    name: 'Advanced Computing Lab',
    building: 'Turing Hall of Computing',
    floor: '3rd Floor',
    room: 'Lab 302',
    description: 'High performance compute workstations for coding competitions and AI hackathons.',
    capacity: 80,
    status: 'active',
    accessType: 'department',
    department: 'Computer Science',
    createdBy: 'usr_admin_1',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'loc_seminar_hall_b',
    name: 'Management Seminar Hall B',
    building: 'Chanakya Block of Management',
    floor: '2nd Floor',
    room: 'Seminar B',
    description: 'Executive seminar theater for keynote sessions and guest lectures.',
    capacity: 150,
    status: 'active',
    accessType: 'department',
    department: 'MBA',
    createdBy: 'usr_admin_1',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'loc_sports_complex',
    name: 'Indoor Sports Arena',
    building: 'Major Dhyan Chand Sports Complex',
    floor: 'Ground Floor',
    room: 'Court 1 & 2',
    description: 'Multi-sport indoor gymnasium for badminton, table tennis, and chess tournaments.',
    capacity: 300,
    status: 'active',
    accessType: 'global',
    department: 'General',
    createdBy: 'usr_admin_1',
    createdAt: new Date().toISOString(),
  },
];

export const locationService = {
  async getLocations(params?: {
    status?: string;
    department?: string;
    accessType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ locations: Location[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      let filtered = [...mockLocations];
      if (params?.status && params.status !== 'All') {
        filtered = filtered.filter((l) => l.status === params.status);
      }
      if (params?.department && params.department !== 'All') {
        filtered = filtered.filter((l) => l.department === params.department || l.accessType === 'global');
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.building.toLowerCase().includes(q) ||
            l.room.toLowerCase().includes(q)
        );
      }
      return {
        locations: filtered,
        pagination: {
          total: filtered.length,
          page: params?.page || 1,
          limit: params?.limit || 50,
          totalPages: 1,
        },
      };
    }

    const response = await api.get('/locations', { params });
    return response.data.data;
  },

  async getLocationById(id: string): Promise<Location> {
    if (isMockMode()) {
      const found = mockLocations.find((l) => l._id === id);
      if (!found) throw new Error('Location not found');
      return found;
    }

    const response = await api.get(`/locations/${id}`);
    return response.data.data;
  },

  async createLocation(data: {
    name: string;
    building: string;
    floor?: string;
    room: string;
    description?: string;
    capacity: number;
    accessType?: 'global' | 'department';
    department?: string;
  }): Promise<Location> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 300));
      const newLoc: Location = {
        _id: `loc_${Date.now()}`,
        name: data.name,
        building: data.building,
        floor: data.floor || '',
        room: data.room,
        description: data.description || '',
        capacity: Number(data.capacity),
        status: 'active',
        accessType: data.accessType || 'department',
        department: (data.department as any) || 'General',
        createdBy: 'usr_current',
        createdAt: new Date().toISOString(),
      };
      mockLocations.unshift(newLoc);
      return newLoc;
    }

    const response = await api.post('/locations', data);
    return response.data.data;
  },

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    if (isMockMode()) {
      const index = mockLocations.findIndex((l) => l._id === id);
      if (index === -1) throw new Error('Location not found');
      mockLocations[index] = { ...mockLocations[index], ...data };
      return mockLocations[index];
    }

    const response = await api.put(`/locations/${id}`, data);
    return response.data.data;
  },

  async updateLocationStatus(id: string, status: 'active' | 'inactive' | 'pending' | 'denied'): Promise<Location> {
    if (isMockMode()) {
      const index = mockLocations.findIndex((l) => l._id === id);
      if (index === -1) throw new Error('Location not found');
      mockLocations[index].status = status;
      return mockLocations[index];
    }

    const response = await api.patch(`/locations/${id}/status`, { status });
    return response.data.data;
  },

  async deactivateLocation(id: string): Promise<Location> {
    if (isMockMode()) {
      return this.updateLocationStatus(id, 'inactive');
    }

    const response = await api.patch(`/locations/${id}/deactivate`);
    return response.data.data;
  },
};
