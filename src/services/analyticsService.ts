import api, { isMockMode } from './api';
import { AdminAnalyticsSummary, DatabaseInsightsData, OrganizerAnalyticsSummary } from '../types';
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

  async getOrganizerAnalytics(): Promise<OrganizerAnalyticsSummary> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return {
        metrics: {
          totalEvents: 0,
          upcomingEvents: 0,
          totalParticipants: 0,
          averageRating: 0,
          attendanceRate: 0,
        },
        events: [],
        attendance: [],
        monthlyTrends: [],
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
        totalRegistrations: 0,
        attendedCount: 0,
        feedbackGivenCount: 0,
        upcomingEvents: 0,
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
