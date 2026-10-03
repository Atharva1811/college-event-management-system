import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

dotenv.config();

const seedData = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.trim() === '' || uri.includes('<username>')) {
    console.error('❌ Cannot run seed script: MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected! Purging old data...');

    await Promise.all([
      User.deleteMany(),
      Event.deleteMany(),
      Registration.deleteMany(),
    ]);

    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'admin@cems.edu',
      password: passwordHash,
      role: 'admin',
      phone: '+1 555-0100',
      department: 'Computer Science',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    // 2. Create Organizers
    const organizers = await User.insertMany([
      {
        name: 'Prof. Marcus Vance',
        email: 'vance@cems.edu',
        password: passwordHash,
        role: 'organizer',
        phone: '+1 555-0201',
        department: 'Computer Science',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      },
      {
        name: 'Dr. Elena Rostova',
        email: 'rostova@cems.edu',
        password: passwordHash,
        role: 'organizer',
        phone: '+1 555-0202',
        department: 'AI & Data Science',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      },
      {
        name: 'Coach David Miller',
        email: 'miller@cems.edu',
        password: passwordHash,
        role: 'organizer',
        phone: '+1 555-0203',
        department: 'Electronics',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    ]);

    // 3. Create Students (15 students)
    const studentData = [
      { name: 'Alex Johnson', email: 'alex@student.cems.edu', department: 'Computer Science' },
      { name: 'Priya Sharma', email: 'priya@student.cems.edu', department: 'AI & Data Science' },
      { name: 'Liam Chen', email: 'liam@student.cems.edu', department: 'Information Technology' },
      { name: 'Sofia Rodriguez', email: 'sofia@student.cems.edu', department: 'Electronics' },
      { name: 'Ethan Patel', email: 'ethan@student.cems.edu', department: 'Mechanical' },
      { name: 'Chloe Dubois', email: 'chloe@student.cems.edu', department: 'Computer Science' },
      { name: 'Rohan Verma', email: 'rohan@student.cems.edu', department: 'Civil' },
      { name: 'Aisha Al-Mansoor', email: 'aisha@student.cems.edu', department: 'AI & Data Science' },
      { name: 'Lucas Silva', email: 'lucas@student.cems.edu', department: 'MBA' },
      { name: 'Maya Lin', email: 'maya@student.cems.edu', department: 'Computer Science' },
      { name: 'Noah Becker', email: 'noah@student.cems.edu', department: 'Information Technology' },
      { name: 'Zara Khan', email: 'zara@student.cems.edu', department: 'Electronics' },
      { name: 'Mateo Morales', email: 'mateo@student.cems.edu', department: 'Mechanical' },
      { name: 'Ananya Gupta', email: 'ananya@student.cems.edu', department: 'MBA' },
      { name: 'Jordan Taylor', email: 'jordan@student.cems.edu', department: 'Computer Science' },
    ];

    const students = await User.insertMany(
      studentData.map((s, idx) => ({
        ...s,
        password: passwordHash,
        role: 'student',
        phone: `+1 555-030${idx < 10 ? '0' + idx : idx}`,
        avatar: `https://images.unsplash.com/photo-${1535713875002 + idx}?w=150`,
      }))
    );

    // 4. Create 16 Realistic Events
    const now = new Date();
    const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const subDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const eventsData = [
      {
        title: 'National Hackathon 2026: Code the Future',
        description: '36-hour intense hackathon challenging students to build scalable AI and web solutions for smart cities and education.',
        category: 'Competition',
        date: addDays(12),
        time: '09:00 AM - 09:00 PM',
        venue: 'Auditorium Hall A & Innovation Lab',
        organizer: organizers[0]._id,
        capacity: 100,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        registrationDeadline: addDays(10),
      },
      {
        title: 'AI & Generative Deep Learning Hands-On Workshop',
        description: 'Comprehensive technical workshop covering LLM fine-tuning, retrieval-augmented generation (RAG), and vector databases.',
        category: 'Workshop',
        date: addDays(5),
        time: '10:00 AM - 04:00 PM',
        venue: 'CS Seminar Complex Lab 3',
        organizer: organizers[1]._id,
        capacity: 45,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        registrationDeadline: addDays(4),
      },
      {
        title: 'Cyber Security & Ethical Hacking Awareness',
        description: 'Industry keynote and live penetration testing demonstration by leading ethical hackers and cyber-defense professionals.',
        category: 'Seminar',
        date: addDays(18),
        time: '02:00 PM - 05:00 PM',
        venue: 'Main University Amphitheatre',
        organizer: organizers[0]._id,
        capacity: 200,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
        registrationDeadline: addDays(15),
      },
      {
        title: 'Inter-College Annual Cricket Championship',
        description: 'Premier collegiate tournament featuring 16 colleges competing across 5 action-packed days for the prestigious trophy.',
        category: 'Sports',
        date: addDays(8),
        time: '08:00 AM - 06:00 PM',
        venue: 'University Sports Ground & Pavilion',
        organizer: organizers[2]._id,
        capacity: 150,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=800',
        registrationDeadline: addDays(6),
      },
      {
        title: 'Kala Utsav: Annual Cultural Harmony Fest',
        description: 'Showcasing cultural diversity through classical and modern dance, theatrical plays, battle of bands, and visual arts.',
        category: 'Cultural',
        date: addDays(25),
        time: '04:00 PM - 10:00 PM',
        venue: 'Open Air Theatre (OAT)',
        organizer: organizers[1]._id,
        capacity: 350,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        registrationDeadline: addDays(20),
      },
      {
        title: 'Autonomous Robotics & IoT Challenge',
        description: 'Robotics arena competition evaluating obstacle-avoidance rovers, line-followers, and IoT connected hardware sensors.',
        category: 'Competition',
        date: addDays(14),
        time: '11:00 AM - 05:00 PM',
        venue: 'Robotics & Mechatronics Lab',
        organizer: organizers[2]._id,
        capacity: 40,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        registrationDeadline: addDays(11),
      },
      {
        title: 'Full-Stack Modern Web Bootcamp',
        description: 'Deep dive into React, Tailwind CSS, Node.js, and MongoDB aggregation pipelines. Perfect preparation for campus placements.',
        category: 'Workshop',
        date: subDays(10),
        time: '10:00 AM - 04:00 PM',
        venue: 'Computer Science Lab 1',
        organizer: organizers[0]._id,
        capacity: 50,
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        registrationDeadline: subDays(12),
      },
      {
        title: 'Research Symposium on Cloud & Distributed Databases',
        description: 'Academic presentation featuring faculty research on distributed transactions, ACID vs BASE, and NoSQL optimization.',
        category: 'Seminar',
        date: subDays(22),
        time: '01:30 PM - 05:30 PM',
        venue: 'Auditorium Hall B',
        organizer: organizers[1]._id,
        capacity: 80,
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
        registrationDeadline: subDays(24),
      },
      {
        title: 'Inter-Department Badminton Tournament',
        description: 'Fast-paced singles and doubles badminton matches between engineering, sciences, and management departments.',
        category: 'Sports',
        date: subDays(5),
        time: '09:00 AM - 03:00 PM',
        venue: 'Indoor Sports Arena Court 1-4',
        organizer: organizers[2]._id,
        capacity: 60,
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        registrationDeadline: subDays(7),
      },
      {
        title: 'Venture Pitch 2026: Campus Startup Showcase',
        description: 'Student founders pitch early-stage ideas to angel investors, venture capitalists, and alumni entrepreneurs for seed funding.',
        category: 'Competition',
        date: addDays(30),
        time: '10:00 AM - 03:00 PM',
        venue: 'Business Incubation Center',
        organizer: organizers[1]._id,
        capacity: 120,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
        registrationDeadline: addDays(27),
      },
      {
        title: 'Campus Photography & Film Festival',
        description: 'Short film screenings, documentary previews, and mobile photography gallery highlighting student cinematic creativity.',
        category: 'Cultural',
        date: subDays(3),
        time: '05:00 PM - 09:00 PM',
        venue: 'Media & Arts Auditorium',
        organizer: organizers[1]._id,
        capacity: 90,
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
        registrationDeadline: subDays(4),
      },
      {
        title: 'DevOps & Kubernetes Cloud Deployment Seminar',
        description: 'Hands-on look at CI/CD workflows, Docker containerization, Kubernetes orchestration, and cloud infrastructure monitoring.',
        category: 'Seminar',
        date: addDays(20),
        time: '02:00 PM - 05:00 PM',
        venue: 'CS Seminar Room 2',
        organizer: organizers[0]._id,
        capacity: 60,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        registrationDeadline: addDays(18),
      },
      {
        title: 'Inter-College Chess Grandmaster Championship',
        description: 'FIDE-rated rapid and blitz chess competition for university students with cash prizes and grandmaster trophies.',
        category: 'Sports',
        date: addDays(9),
        time: '10:00 AM - 06:00 PM',
        venue: 'Student Recreation Center',
        organizer: organizers[2]._id,
        capacity: 50,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
        registrationDeadline: addDays(7),
      },
      {
        title: 'Blockchain & Web3 Decentralized Architecture',
        description: 'Smart contracts, consensus mechanisms, zero-knowledge proofs, and decentralized finance application development.',
        category: 'Technical',
        date: addDays(16),
        time: '11:00 AM - 02:00 PM',
        venue: 'Auditorium Hall C',
        organizer: organizers[0]._id,
        capacity: 70,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
        registrationDeadline: addDays(13),
      },
      {
        title: 'AI Ethics & Algorithmic Fairness Colloquium',
        description: 'Panel discussion on the societal impacts of artificial intelligence, privacy regulations, and fairness in automated decisions.',
        category: 'Seminar',
        date: addDays(22),
        time: '03:00 PM - 06:00 PM',
        venue: 'Conference Hall B',
        organizer: organizers[1]._id,
        capacity: 85,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
        registrationDeadline: addDays(19),
      },
      {
        title: 'Rock Band Battle: Sound of campus',
        description: 'Electric live music competition featuring campus student rock, fusion, and indie bands judged by music industry veterans.',
        category: 'Cultural',
        date: subDays(15),
        time: '06:00 PM - 10:00 PM',
        venue: 'Open Air Amphitheatre',
        organizer: organizers[2]._id,
        capacity: 300,
        status: 'completed',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
        registrationDeadline: subDays(17),
      },
    ];

    const events = await Event.insertMany(eventsData);

    // 5. Create Many Registrations across Students and Events
    const registrationsToInsert = [];
    const reviews = [
      { rating: 5, feedback: 'Phenomenal organization, cutting-edge topics, and wonderful speakers!' },
      { rating: 5, feedback: 'One of the best campus workshops I have attended. Learned a tremendous amount.' },
      { rating: 4, feedback: 'Very well structured. The hands-on coding exercises were extremely helpful.' },
      { rating: 4, feedback: 'Great event! Looking forward to the next edition.' },
      { rating: 5, feedback: 'Superb atmosphere and flawless logistics by the organizing committee.' },
      { rating: 3, feedback: 'Good content overall, but needed slightly more time for Q&A.' },
    ];

    let regIdx = 0;
    for (const student of students) {
      // Register each student for 3 to 6 events
      const registeredCount = 3 + (regIdx % 4);
      for (let i = 0; i < registeredCount; i++) {
        const evIndex = (regIdx + i * 3) % events.length;
        const ev = events[evIndex];

        const isCompleted = ev.status === 'completed';
        const attendance = isCompleted
          ? (regIdx + i) % 5 === 0
            ? 'absent'
            : 'present'
          : 'pending';

        const review = isCompleted && attendance === 'present'
          ? reviews[(regIdx + i) % reviews.length]
          : { rating: null, feedback: '' };

        registrationsToInsert.push({
          student: student._id,
          event: ev._id,
          status: 'registered',
          attendance,
          rating: review.rating,
          feedback: review.feedback,
          registeredAt: new Date(ev.createdAt.getTime() + i * 3600000),
        });
      }
      regIdx++;
    }

    await Registration.insertMany(registrationsToInsert);

    console.log(`\n🎉 Seed completed successfully!`);
    console.log(`Created: 1 Admin (${admin.email})`);
    console.log(`Created: ${organizers.length} Organizers`);
    console.log(`Created: ${students.length} Students`);
    console.log(`Created: ${events.length} Events`);
    console.log(`Created: ${registrationsToInsert.length} Registrations\n`);
    console.log('Default credentials for all seeded accounts:');
    console.log('Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
