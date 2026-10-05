export type UserRole = 'admin' | 'organizer' | 'student';

export type Department =
  | 'Computer Science'
  | 'Information Technology'
  | 'AI & Data Science'
  | 'Electronics'
  | 'Mechanical'
  | 'Civil'
  | 'MBA'
  | 'General';

export type EventCategory =
  | 'Technical'
  | 'Cultural'
  | 'Sports'
  | 'Workshop'
  | 'Seminar'
  | 'Competition'
  | 'Other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type RegistrationStatus = 'registered' | 'cancelled';

export type AttendanceStatus = 'pending' | 'present' | 'absent';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: Department;
  avatar?: string;
  isActive: boolean;
  organizerStatus?: 'pending' | 'approved' | 'denied';
  applicationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppNotification {
  _id: string;
  recipient: string | User;
  type: 'event_cancelled' | 'event_deleted' | 'event_status' | 'organizer_application' | 'organizer_approved' | 'organizer_denied' | 'general';
  title: string;
  message: string;
  relatedEvent?: string | Event;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO string
  time: string;
  venue: string;
  organizer: User | string;
  capacity: number;
  status: EventStatus;
  image?: string;
  registrationDeadline: string; // ISO string
  registeredCount?: number;
  seatsRemaining?: number;
  isFull?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  _id: string;
  student: User | string;
  event: Event | string;
  status: RegistrationStatus;
  attendance: AttendanceStatus;
  feedback?: string;
  rating?: number | null;
  registeredAt: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
}

export interface AdminAnalyticsSummary {
  metrics: {
    totalStudents: number;
    totalOrganizers: number;
    totalEvents: number;
    totalRegistrations: number;
    upcomingEvents: number;
    completedEvents: number;
    attendanceRate: number;
    averageRating: number;
  };
  categories: Array<{ category: EventCategory; count: number; totalCapacity: number }>;
  departments: Array<{ department: string; totalRegistrations: number; presentCount: number; attendanceRate: number }>;
  monthlyTrends: Array<{ period: string; count: number }>;
  attendance: Array<{ _id: AttendanceStatus; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
}

export interface DatabaseInsightCollection {
  name: string;
  count: number;
  indexes: string[];
  schemaFields: string[];
}

export interface DatabaseInsightsData {
  collections: DatabaseInsightCollection[];
  aggregations: {
    registrationsPerEvent: Array<{ _id: string; title: string; category: string; capacity: number; registrationCount: number; utilizationRate: number }>;
    eventsByCategory: Array<{ category: string; count: number; totalCapacity: number }>;
    eventsByStatus: Array<{ status: string; count: number }>;
    attendanceStats: Array<{ attendance: string; count: number }>;
    departmentParticipation: Array<{ department: string; totalRegistrations: number; presentCount: number; attendanceRate: number }>;
    organizerStatistics: Array<{ _id: string; organizerName: string; email: string; department: string; totalEvents: number; upcomingEvents: number; completedEvents: number; totalCapacity: number }>;
    monthlyTrends: Array<{ period: string; count: number }>;
    ratingDistribution: Array<{ rating: number; count: number }>;
  };
}

export interface OrganizerAnalyticsSummary {
  metrics: {
    totalEvents: number;
    upcomingEvents: number;
    totalParticipants: number;
    averageRating: number;
    attendanceRate: number;
  };
  events: Array<{
    title: string;
    registrations?: number;
    registeredCount?: number;
    capacity: number;
    status: string;
  }>;
  attendance: Array<{ _id: string; count: number }>;
  monthlyTrends?: Array<{ period: string; count: number }>;
}
