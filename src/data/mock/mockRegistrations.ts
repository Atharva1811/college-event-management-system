import { Registration } from '../../types';
import { mockUsers } from './mockUsers';
import { mockEvents } from './mockEvents';

const students = mockUsers.filter((u) => u.role === 'student');

export const mockRegistrations: Registration[] = [
  // Student 1 (Alex Johnson - usr_stu_001)
  {
    _id: 'reg_001',
    student: students[0],
    event: mockEvents[0], // National Hackathon (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-15T10:00:00.000Z',
  },
  {
    _id: 'reg_002',
    student: students[0],
    event: mockEvents[1], // AI Workshop (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-16T11:30:00.000Z',
  },
  {
    _id: 'reg_003',
    student: students[0],
    event: mockEvents[6], // Full-Stack Web Bootcamp (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'Exceptional hands-on learning! The React and MongoDB explanations were crystal clear and practical.',
    registeredAt: '2026-08-28T09:00:00.000Z',
  },
  {
    _id: 'reg_004',
    student: students[0],
    event: mockEvents[7], // Research Symposium (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 4,
    feedback: 'High-caliber research discussions on distributed consensus algorithms. Inspiring academic session.',
    registeredAt: '2026-08-22T14:15:00.000Z',
  },

  // Student 2 (Priya Sharma - usr_stu_002)
  {
    _id: 'reg_005',
    student: students[1],
    event: mockEvents[1], // AI Workshop (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-17T09:45:00.000Z',
  },
  {
    _id: 'reg_006',
    student: students[1],
    event: mockEvents[2], // Cyber Security (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-18T10:20:00.000Z',
  },
  {
    _id: 'reg_007',
    student: students[1],
    event: mockEvents[7], // Research Symposium (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'Dr. Rostova’s talk on vector database indexing algorithms was brilliant!',
    registeredAt: '2026-08-23T11:00:00.000Z',
  },

  // Student 3 (Liam Chen - usr_stu_003)
  {
    _id: 'reg_008',
    student: students[2],
    event: mockEvents[0], // Hackathon
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-19T13:00:00.000Z',
  },
  {
    _id: 'reg_009',
    student: students[2],
    event: mockEvents[8], // Badminton (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'Flawlessly coordinated matches and great sportsmanship all around.',
    registeredAt: '2026-09-05T12:00:00.000Z',
  },

  // Student 4 (Sofia Rodriguez - usr_stu_004)
  {
    _id: 'reg_010',
    student: students[3],
    event: mockEvents[4], // Cultural Fest (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-20T15:30:00.000Z',
  },
  {
    _id: 'reg_011',
    student: students[3],
    event: mockEvents[10], // Photography Fest (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'The student documentary screenings were breathtakingly creative and artistic.',
    registeredAt: '2026-09-02T16:00:00.000Z',
  },

  // Student 5 (Ethan Patel - usr_stu_005)
  {
    _id: 'reg_012',
    student: students[4],
    event: mockEvents[5], // Autonomous Robotics (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-22T08:30:00.000Z',
  },
  {
    _id: 'reg_013',
    student: students[4],
    event: mockEvents[6], // Web bootcamp (Completed)
    status: 'registered',
    attendance: 'absent',
    registeredAt: '2026-08-29T10:00:00.000Z',
  },

  // Student 6 (Chloe Dubois - usr_stu_006)
  {
    _id: 'reg_014',
    student: students[5],
    event: mockEvents[0], // Hackathon
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-23T11:00:00.000Z',
  },
  {
    _id: 'reg_015',
    student: students[5],
    event: mockEvents[15], // Battle of Bands (Completed)
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'Incredible energy! The fusion band performances blew everyone away!',
    registeredAt: '2026-08-20T14:00:00.000Z',
  },

  // Student 7 (Rohan Verma - usr_stu_007)
  {
    _id: 'reg_016',
    student: students[6],
    event: mockEvents[3], // Cricket Championship
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-24T09:15:00.000Z',
  },

  // Student 8 (Aisha Al-Mansoor - usr_stu_008)
  {
    _id: 'reg_017',
    student: students[7],
    event: mockEvents[1], // AI Workshop
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-25T14:45:00.000Z',
  },
  {
    _id: 'reg_018',
    student: students[7],
    event: mockEvents[7], // Research Symposium
    status: 'registered',
    attendance: 'present',
    rating: 4,
    feedback: 'Very informative lecture series with rich theoretical rigor.',
    registeredAt: '2026-08-24T16:00:00.000Z',
  },

  // Student 9 (Lucas Silva - usr_stu_009)
  {
    _id: 'reg_019',
    student: students[8],
    event: mockEvents[9], // Venture Pitch (Upcoming)
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-26T10:30:00.000Z',
  },

  // Student 10 (Maya Lin - usr_stu_010)
  {
    _id: 'reg_020',
    student: students[9],
    event: mockEvents[2], // Cyber Security
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-27T11:20:00.000Z',
  },
  {
    _id: 'reg_021',
    student: students[9],
    event: mockEvents[6], // Web Bootcamp
    status: 'registered',
    attendance: 'present',
    rating: 5,
    feedback: 'Super helpful practical tips for building production-ready architectures!',
    registeredAt: '2026-08-30T10:15:00.000Z',
  },

  // Student 11 (Noah Becker - usr_stu_011)
  {
    _id: 'reg_022',
    student: students[10],
    event: mockEvents[11], // DevOps Seminar
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-28T13:40:00.000Z',
  },

  // Student 12 (Zara Khan - usr_stu_012)
  {
    _id: 'reg_023',
    student: students[11],
    event: mockEvents[12], // Chess Grandmaster
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-29T15:10:00.000Z',
  },

  // Student 13 (Mateo Morales - usr_stu_013)
  {
    _id: 'reg_024',
    student: students[12],
    event: mockEvents[5], // Robotics
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-30T09:00:00.000Z',
  },

  // Student 14 (Ananya Gupta - usr_stu_014)
  {
    _id: 'reg_025',
    student: students[13],
    event: mockEvents[9], // Venture Pitch
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-09-30T14:00:00.000Z',
  },

  // Student 15 (Jordan Taylor - usr_stu_015)
  {
    _id: 'reg_026',
    student: students[14],
    event: mockEvents[13], // Blockchain
    status: 'registered',
    attendance: 'pending',
    registeredAt: '2026-10-01T10:00:00.000Z',
  },
];
