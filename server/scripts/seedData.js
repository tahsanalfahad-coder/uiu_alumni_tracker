import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import StudentProfile from '../src/models/StudentProfile.js';
import PendingRegistration from '../src/models/PendingRegistration.js';
import Job from '../src/models/Job.js';
import Event from '../src/models/Event.js';
import MentorshipRequest from '../src/models/MentorshipRequest.js';
import ChatThread from '../src/models/ChatThread.js';
import Fund from '../src/models/Fund.js';

dotenv.config();

async function seedData() {
  await connectDB();

  console.log('[Seed Data]: Clearing existing collections...');
  await User.deleteMany({});
  await AlumniProfile.deleteMany({});
  await StudentProfile.deleteMany({});
  await PendingRegistration.deleteMany({});
  await Job.deleteMany({});
  await Event.deleteMany({});
  await MentorshipRequest.deleteMany({});
  await ChatThread.deleteMany({});
  await Fund.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'admin123', 10);

  // 1. Admin
  const adminUser = await User.create({
    name: 'Dr. Tariqul Islam',
    email: (process.env.ADMIN_SEED_EMAIL || 'admin@uiu.ac.bd').toLowerCase(),
    passwordHash: adminPassword,
    role: 'admin',
    status: 'active'
  });

  // 2. Alumni Users & Profiles
  const alumniData = [
    {
      name: 'Tanvir Ahmed',
      email: 'tanvir.ahmed@gmail.com',
      batch: 'CSE-2017',
      year: '2021',
      department: 'Computer Science & Engineering',
      role: 'Senior Software Engineer',
      company: 'Google Singapore',
      location: 'Singapore',
      bio: 'Specializing in distributed cloud infrastructure & backend architecture. Passionate about guiding UIU students into global tech companies.',
      higherStudies: 'M.Sc. in Computer Science, NUS',
      skills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Architecture'],
      achievements: ['UIU Gold Medalist 2021', 'ACM ICPC Regional Finalist'],
      isMentor: true,
      mentorshipTopics: ['Distributed Systems', 'Cloud Architecture', 'MNC Interview Prep'],
      totalDonated: 75000,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      careerTimeline: [
        { title: 'Senior Software Engineer', company: 'Google Singapore', startDate: '2023', endDate: 'Present', current: true, description: 'Leading cloud platform team.' },
        { title: 'Software Engineer', company: 'Brain Station 23', startDate: '2021', endDate: '2023', current: false, description: 'Worked on enterprise microservices.' }
      ]
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@intel.com',
      batch: 'EEE-2018',
      year: '2022',
      department: 'Electrical & Electronic Engineering',
      role: 'Hardware Systems Lead',
      company: 'Intel Corporation',
      location: 'Munich, Germany',
      bio: 'Working on next-gen semiconductor design and low-power IoT circuits. Enthusiastic about hardware research mentoring.',
      higherStudies: 'Ph.D. Candidate, TU Munich',
      skills: ['VLSI Design', 'Embedded Systems', 'Verilog', 'FPGA'],
      achievements: ['Best Thesis Award 2022', 'IEEE Student Paper Award'],
      isMentor: true,
      mentorshipTopics: ['VLSI Design', 'Higher Studies in EU'],
      totalDonated: 50000,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Mahmudul Hasan',
      email: 'mahmud@fintechasia.io',
      batch: 'BBA-2016',
      year: '2020',
      department: 'Business Administration',
      role: 'Co-Founder & CEO',
      company: 'FinTech Asia',
      location: 'Dhaka, Bangladesh',
      bio: 'Built one of Bangladesh fast-growing micro-investment platforms. Mentoring UIU student entrepreneurs and startups.',
      higherStudies: 'MBA, INSEAD',
      skills: ['Venture Capital', 'Product Strategy', 'Financial Modeling', 'Growth'],
      achievements: ['Forbes 30 Under 30 Asia', 'UIU Entrepreneur of the Year'],
      isMentor: true,
      mentorshipTopics: ['Startup Pitching', 'Venture Capital'],
      totalDonated: 120000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sadia Rahman',
      email: 'sadia.r@microsoft.com',
      batch: 'CSE-2019',
      year: '2023',
      department: 'Computer Science & Engineering',
      role: 'AI Research Scientist',
      company: 'Microsoft Research',
      location: 'Redmond, USA',
      bio: 'Focusing on Generative AI and Large Language Model optimization. Helping students navigate AI research publications.',
      higherStudies: 'Ph.D. in AI, Stanford University',
      skills: ['PyTorch', 'Large Language Models', 'NLP', 'Computer Vision'],
      achievements: ['NeurIPS 2024 Spotlight Paper', 'UIU Valedictorian'],
      isMentor: false,
      totalDonated: 30000,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const createdAlumniProfiles = [];

  for (const item of alumniData) {
    const user = await User.create({
      name: item.name,
      email: item.email.toLowerCase(),
      passwordHash: defaultPassword,
      role: 'alumni',
      status: 'active'
    });

    const profile = await AlumniProfile.create({
      userId: user._id,
      ...item
    });

    createdAlumniProfiles.push(profile);
  }

  // 3. Student User & Profile
  const studentUser = await User.create({
    name: 'Shakil Ahmed',
    email: 'shakil.011201044@bscse.uiu.ac.bd',
    passwordHash: defaultPassword,
    role: 'student',
    status: 'active'
  });

  const studentProfile = await StudentProfile.create({
    userId: studentUser._id,
    studentId: '011201044',
    department: 'Computer Science & Engineering',
    year: '4th Year',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  });

  // 4. Pending Registrations
  const pendingUser = await User.create({
    name: 'Kazi Farhan',
    email: 'farhan.kazi@outlook.com',
    passwordHash: defaultPassword,
    role: 'alumni',
    status: 'pending'
  });

  await PendingRegistration.create({
    userId: pendingUser._id,
    name: 'Kazi Farhan',
    email: 'farhan.kazi@outlook.com',
    batch: 'CSE-2020',
    department: 'Computer Science & Engineering',
    currentRole: 'Junior Frontend Developer',
    company: 'Pathao Ltd.',
    submittedDate: '2026-08-09',
    status: 'Pending'
  });

  // 5. Jobs
  await Job.create([
    {
      title: 'Associate Backend Engineer',
      company: 'Brain Station 23',
      type: 'Full-time',
      location: 'Dhaka (Hybrid)',
      stipend: '৳65,000 - ৳85,000 / month',
      postedDate: '2026-08-01',
      deadline: '2026-08-25',
      description: 'We are seeking a proactive backend developer with Node.js and PostgreSQL experience. UIU graduates receive priority interview scheduling.',
      postedBy: alumniData[0].name,
      alumniId: createdAlumniProfiles[0]._id
    },
    {
      title: 'Machine Learning Research Intern',
      company: 'TigerIT Bangladesh',
      type: 'Internship',
      location: 'Dhaka (On-site)',
      stipend: '৳25,000 / month',
      postedDate: '2026-08-04',
      deadline: '2026-08-20',
      description: 'Join our biometrics and computer vision research team. Perfect for 4th year CSE students working on thesis projects.',
      postedBy: alumniData[3].name,
      alumniId: createdAlumniProfiles[3]._id
    }
  ]);

  // 6. Events
  await Event.create([
    {
      title: 'UIU Annual Global Alumni Reunion 2026',
      category: 'Reunion',
      typeBadge: 'Official University Event',
      date: '2026-09-15',
      time: '05:00 PM - 10:00 PM',
      location: 'UIU Permanent Campus Auditorium, Madani Avenue',
      registered: 340,
      capacity: 450,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      tags: ['Reunion', 'Networking', 'Dinner'],
      description: 'Join hundreds of UIU alumni across generations for an evening of networking, cultural performances, and celebrating university milestones.',
      scope: 'public',
      createdBy: adminUser._id
    },
    {
      title: 'Tech Career & Higher Studies Seminar',
      category: 'Networking',
      typeBadge: 'Mentorship Workshop',
      date: '2026-08-28',
      time: '03:00 PM - 06:00 PM',
      location: 'Room 412 & Online Zoom Stream',
      registered: 180,
      capacity: 200,
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
      tags: ['Career', 'Higher Studies', 'US/EU Prep'],
      description: 'Exclusive panel discussion with UIU alumni currently studying/working in Singapore, Germany, and the USA.',
      scope: 'public',
      createdBy: adminUser._id
    }
  ]);

  // 7. Mentorship Requests
  await MentorshipRequest.create([
    {
      studentId: studentProfile._id,
      studentName: studentUser.name,
      studentAvatar: studentProfile.avatar,
      mentorId: createdAlumniProfiles[0]._id,
      mentorName: alumniData[0].name,
      topic: 'Cloud Infrastructure & Microservices',
      message: 'Respected Bhai, I am preparing for backend engineering interviews at MNCs. Would love your feedback on my microservices portfolio project.',
      status: 'Pending',
      date: '2026-08-08'
    }
  ]);

  // 8. Chat Threads
  await ChatThread.create({
    participantIds: [studentUser._id, createdAlumniProfiles[0].userId],
    participantName: alumniData[0].name,
    participantAvatar: createdAlumniProfiles[0].avatar,
    participantRole: 'Alumni (Google)',
    lastMessage: 'Sure, we can hop on a Google Meet call this Saturday at 4 PM GMT+6.',
    lastMessageAt: '10:45 AM',
    messages: [
      { sender: createdAlumniProfiles[0].userId, text: 'Assalamu Alaikum! Thanks for reaching out regarding mentorship.', timestamp: '10:30 AM' },
      { sender: studentUser._id, text: 'Walaikum Assalam Bhai! Thank you so much for accepting my request.', timestamp: '10:35 AM' },
      { sender: createdAlumniProfiles[0].userId, text: 'Sure, we can hop on a Google Meet call this Saturday at 4 PM GMT+6.', timestamp: '10:45 AM' }
    ]
  });

  // 9. Funds
  await Fund.create([
    { name: 'Alumni Need-Based Scholarship Fund', description: 'Supports talented UIU students facing financial hardships.', raised: 1450000, goal: 2000000, icon: 'graduationCap' },
    { name: 'Advanced Robotics & AI Research Lab', description: 'Equips UIU research labs with high-performance GPUs and hardware.', raised: 820000, goal: 1200000, icon: 'laptop' },
    { name: 'Sports & Cultural Excellence Fund', description: 'Sponsors university sports teams and national tournaments.', raised: 350000, goal: 500000, icon: 'trophy' },
    { name: 'Central Library Digitalization', description: 'Expanding IEEE/ACM digital journal access for all students.', raised: 510000, goal: 800000, icon: 'clipboard' }
  ]);

  console.log('[Seed Data Success]: Database initialized with mock data.');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('[Seed Data Error]:', err);
  process.exit(1);
});
