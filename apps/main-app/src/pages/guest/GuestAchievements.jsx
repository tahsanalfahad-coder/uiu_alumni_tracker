import React from 'react';
import { StatCard, Timeline } from '@uiu/ui';
import { Award, BookOpen, Handshake, Landmark } from 'lucide-react';
import './GuestAchievements.css';

const universityMilestones = [
  { year: '2025', title: 'QS Asia University Rankings Top 400', description: 'UIU achieved its highest international ranking, recognized for research output and graduate employability.' },
  { year: '2024', title: '৳50 Million Research Grant Awarded', description: 'Government and industry partners collaborated with UIU AI & Biotech research centers.' },
  { year: '2022', title: 'Inauguration of Permanent Smart Campus', description: 'State-of-the-art green campus setup in Madani Avenue with modern labs and auditorium.' },
  { year: '2020', title: 'IEEE Outstanding Student Branch Award', description: 'UIU IEEE Student Branch won regional recognition for technical innovations.' }
];

export default function GuestAchievements() {
  const timelineItems = universityMilestones.map((m, idx) => ({
    id: idx,
    title: m.title,
    company: `Milestone Year ${m.year}`,
    startDate: m.year,
    endDate: 'Achieved',
    description: m.description,
    isCurrent: idx === 0
  }));

  return (
    <div className="container-centered section-padding">
      <div className="page-header-box">
        <span className="eyebrow-label">Institutional Excellence</span>
        <h1 className="heading-h1">University Achievements & Recognition</h1>
        <p className="text-muted">
          Celebrating United International University milestones in research, global ranking, industry partnerships, and campus development.
        </p>
      </div>

      {/* 4 Headline Stat Tiles */}
      <div className="grid-4-col stat-tiles-row">
        <StatCard
          icon={Landmark}
          label="Research Funding"
          value="৳50M+"
          subtitle="Government & corporate research grants"
          iconColor="var(--color-navy-900)"
        />
        <StatCard
          icon={BookOpen}
          label="Papers Published"
          value="1,240+"
          subtitle="Scopus & IEEE indexed journals"
          iconColor="var(--color-gold-500)"
        />
        <StatCard
          icon={Handshake}
          label="Industry Partners"
          value="85+"
          subtitle="MNCs & global tech collaborators"
          iconColor="var(--role-student-color)"
        />
        <StatCard
          icon={Award}
          label="Asia Ranking"
          value="Top 400"
          subtitle="QS Asia University Rankings 2025"
          iconColor="var(--role-admin-color)"
        />
      </div>

      {/* Institutional Timeline */}
      <div className="achievements-timeline-box">
        <h2 className="heading-h2 timeline-section-title">Institutional History & Milestones</h2>
        <Timeline items={timelineItems} />
      </div>
    </div>
  );
}
