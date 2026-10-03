import api, { isMockMode } from './api';
import { AdminAnalyticsSummary, DatabaseInsightsData } from '../types';
import { mockAdminAnalytics, mockDatabaseInsights } from '../data/mock/mockAnalytics';

export const analyticsService = {
  async getAdminAnalytics(): Promise<AdminAnalyticsSummary> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return mockAdminAnalytics;
    }

    const response = await api.get('/analytics/admin');
    return response.data.data;
  },

  async getOrganizerAnalytics(): Promise<any> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return {
        metrics: {
          totalEvents: 6,
          upcomingEvents: 4,
          totalParticipants: 184,
          averageRating: 4.8,
          attendanceRate: 91.2,
        },
        events: [
          { title: 'National Hackathon 2026', registrations: 84, capacity: 100, status: 'upcoming' },
          { title: 'AI Hands-On Workshop', registrations: 42, capacity: 45, status: 'upcoming' },
          { title: 'Full-Stack Bootcamp', registrations: 50, capacity: 50, status: 'completed' },
        ],
        attendance: [
          { _id: 'present', count: 72 },
          { _id: 'absent', count: 7 },
          { _id: 'pending', count: 126 },
        ],
      };
    }

    const response = await api.get('/analytics/organizer');
    return response.data.data;
  },

  async getStudentAnalytics(): Promise<{
    totalRegistrations: number;
    attendedCount: number;
    feedbackGivenCount: number;
    upcomingEvents: number;
  }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return {
        totalRegistrations: 4,
        attendedCount: 2,
        feedbackGivenCount: 2,
        upcomingEvents: 2,
      };
    }

    const response = await api.get('/analytics/student');
    return response.data.data;
  },

  async getDatabaseInsights(): Promise<DatabaseInsightsData> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return mockDatabaseInsights;
    }

    const response = await api.get('/analytics/database-insights');
    return response.data.data;
  },
};
