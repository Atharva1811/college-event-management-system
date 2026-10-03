import api, { isMockMode } from './api';
import { Event, Pagination } from '../types';
import { mockEvents } from '../data/mock/mockEvents';

const STORAGE_KEY = 'cems_events_data';

const getStoredEvents = (): Event[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEvents));
    return [...mockEvents];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [...mockEvents];
  }
};

const saveStoredEvents = (events: Event[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const eventService = {
  async getEvents(params: {
    category?: string;
    status?: string;
    organizer?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<{ events: Event[]; pagination: Pagination }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      let list = getStoredEvents();

      if (params.category && params.category !== 'All') {
        list = list.filter((e) => e.category === params.category);
      }

      if (params.status && params.status !== 'All') {
        list = list.filter((e) => e.status === params.status);
      }

      if (params.organizer) {
        list = list.filter((e) => {
          const orgId = typeof e.organizer === 'object' ? e.organizer._id : e.organizer;
          return orgId === params.organizer;
        });
      }

      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (e) =>
            e.title.toLowerCase().includes(query) ||
            e.description.toLowerCase().includes(query) ||
            e.venue.toLowerCase().includes(query)
        );
      }

      // Sort
      const sortField = (params.sort || 'date') as keyof Event;
      const isDesc = params.order === 'desc';
      list.sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });

      const page = params.page || 1;
      const limit = params.limit || 12;
      const total = list.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginated = list.slice(startIndex, startIndex + limit);

      return {
        events: paginated,
        pagination: { total, page, limit, totalPages },
      };
    }

    const response = await api.get('/events', { params });
    return response.data.data;
  },

  async getEventById(id: string): Promise<Event> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const list = getStoredEvents();
      const event = list.find((e) => e._id === id);
      if (!event) throw new Error('Event not found');
      return event;
    }

    const response = await api.get(`/events/${id}`);
    return response.data.data;
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 400));
      const list = getStoredEvents();
      const currentUser = JSON.parse(localStorage.getItem('cems_user') || '{}');

      const newEvent: Event = {
        _id: `evt_${Date.now()}`,
        title: eventData.title || 'Untitled Event',
        description: eventData.description || '',
        category: eventData.category || 'Workshop',
        date: eventData.date || new Date().toISOString(),
        time: eventData.time || '10:00 AM - 01:00 PM',
        venue: eventData.venue || 'Campus Auditorium',
        organizer: currentUser,
        capacity: Number(eventData.capacity) || 50,
        status: 'upcoming',
        image:
          eventData.image ||
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        registrationDeadline:
          eventData.registrationDeadline || new Date().toISOString(),
        registeredCount: 0,
        seatsRemaining: Number(eventData.capacity) || 50,
        isFull: false,
        createdAt: new Date().toISOString(),
      };

      list.unshift(newEvent);
      saveStoredEvents(list);
      return newEvent;
    }

    const response = await api.post('/events', eventData);
    return response.data.data;
  },

  async updateEvent(id: string, updateData: Partial<Event>): Promise<Event> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      const list = getStoredEvents();
      const index = list.findIndex((e) => e._id === id);
      if (index === -1) throw new Error('Event not found');

      const updated = {
        ...list[index],
        ...updateData,
        capacity: updateData.capacity ? Number(updateData.capacity) : list[index].capacity,
        seatsRemaining: updateData.capacity
          ? Math.max(0, Number(updateData.capacity) - (list[index].registeredCount || 0))
          : list[index].seatsRemaining,
      };

      list[index] = updated;
      saveStoredEvents(list);
      return updated;
    }

    const response = await api.put(`/events/${id}`, updateData);
    return response.data.data;
  },

  async cancelEvent(id: string): Promise<Event> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      const list = getStoredEvents();
      const index = list.findIndex((e) => e._id === id);
      if (index === -1) throw new Error('Event not found');

      list[index].status = 'cancelled';
      saveStoredEvents(list);
      return list[index];
    }

    const response = await api.patch(`/events/${id}/cancel`);
    return response.data.data;
  },

  async deleteEvent(id: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      let list = getStoredEvents();
      list = list.filter((e) => e._id !== id);
      saveStoredEvents(list);
      return;
    }

    await api.delete(`/events/${id}`);
  },
};
