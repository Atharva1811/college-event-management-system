import api, { isMockMode } from './api';
import { Registration, AttendanceStatus, Event } from '../types';
import { mockRegistrations } from '../data/mock/mockRegistrations';
import { mockEvents } from '../data/mock/mockEvents';

const REG_STORAGE_KEY = 'cems_registrations_data';

const getStoredRegistrations = (): Registration[] => {
  const data = localStorage.getItem(REG_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(mockRegistrations));
    return [...mockRegistrations];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [...mockRegistrations];
  }
};

const saveStoredRegistrations = (list: Registration[]) => {
  localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(list));
};

export const registrationService = {
  async registerForEvent(eventId: string): Promise<Registration> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 350));
      const userStr = localStorage.getItem('cems_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      if (!currentUser) throw new Error('You must be logged in to register.');

      // Check event
      const storedEvents: Event[] = JSON.parse(
        localStorage.getItem('cems_events_data') || JSON.stringify(mockEvents)
      );
      const targetEvent = storedEvents.find((e) => e._id === eventId);
      if (!targetEvent) throw new Error('Event not found.');

      if (targetEvent.status === 'cancelled') {
        throw new Error('This event is cancelled and cannot accept registrations.');
      }

      if (new Date() > new Date(targetEvent.registrationDeadline)) {
        throw new Error('Registration deadline for this event has passed.');
      }

      const list = getStoredRegistrations();

      // Check existing registration
      const existing = list.find((r) => {
        const sId = typeof r.student === 'object' ? r.student._id : r.student;
        const eId = typeof r.event === 'object' ? r.event._id : r.event;
        return sId === currentUser._id && eId === eventId;
      });

      if (existing) {
        if (existing.status === 'registered') {
          throw new Error('You are already registered for this event.');
        }
        // Reactivate soft-cancelled registration
        existing.status = 'registered';
        existing.registeredAt = new Date().toISOString();
        saveStoredRegistrations(list);
        return existing;
      }

      // Check capacity
      const activeCount = list.filter((r) => {
        const eId = typeof r.event === 'object' ? r.event._id : r.event;
        return eId === eventId && r.status === 'registered';
      }).length;

      if (activeCount >= targetEvent.capacity) {
        throw new Error('This event is completely full.');
      }

      const newReg: Registration = {
        _id: `reg_${Date.now()}`,
        student: currentUser,
        event: targetEvent,
        status: 'registered',
        attendance: 'pending',
        registeredAt: new Date().toISOString(),
      };

      list.unshift(newReg);
      saveStoredRegistrations(list);
      return newReg;
    }

    const response = await api.post('/registrations', { eventId });
    return response.data.data;
  },

  async getMyRegistrations(): Promise<Registration[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const userStr = localStorage.getItem('cems_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (!currentUser) return [];

      const list = getStoredRegistrations();
      return list.filter((r) => {
        const sId = typeof r.student === 'object' ? r.student._id : r.student;
        return sId === currentUser._id;
      });
    }

    const response = await api.get('/registrations/my');
    return response.data.data;
  },

  async cancelRegistration(registrationId: string): Promise<Registration> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredRegistrations();
      const index = list.findIndex((r) => r._id === registrationId);
      if (index === -1) throw new Error('Registration record not found.');

      // Soft cancel
      list[index].status = 'cancelled';
      saveStoredRegistrations(list);
      return list[index];
    }

    const response = await api.delete(`/registrations/${registrationId}`);
    return response.data.data;
  },

  async getEventParticipants(eventId: string): Promise<Registration[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const list = getStoredRegistrations();
      return list.filter((r) => {
        const eId = typeof r.event === 'object' ? r.event._id : r.event;
        return eId === eventId;
      });
    }

    const response = await api.get(`/registrations/event/${eventId}/participants`);
    return response.data.data;
  },

  async getAllRegistrations(): Promise<Registration[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      return getStoredRegistrations();
    }

    const response = await api.get('/registrations');
    return response.data.data.registrations;
  },

  async updateAttendance(
    registrationId: string,
    attendance: AttendanceStatus
  ): Promise<Registration> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const list = getStoredRegistrations();
      const index = list.findIndex((r) => r._id === registrationId);
      if (index === -1) throw new Error('Registration not found.');

      list[index].attendance = attendance;
      saveStoredRegistrations(list);
      return list[index];
    }

    const response = await api.put(`/registrations/${registrationId}/attendance`, {
      attendance,
    });
    return response.data.data;
  },

  async submitFeedback(
    registrationId: string,
    rating: number,
    feedback: string
  ): Promise<Registration> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      const list = getStoredRegistrations();
      const index = list.findIndex((r) => r._id === registrationId);
      if (index === -1) throw new Error('Registration not found.');

      list[index].rating = rating;
      list[index].feedback = feedback;
      saveStoredRegistrations(list);
      return list[index];
    }

    const response = await api.put(`/registrations/${registrationId}/feedback`, {
      rating,
      feedback,
    });
    return response.data.data;
  },
};
