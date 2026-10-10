import React from 'react';
import { Card, StatCard, Badge, ProgressBar, Button } from '@uiu/ui';
import { Users, UserCheck, Calendar, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({
  alumniList = [],
  pendingRegistrations = [],
  eventList = [],
  onNavSelect
}) {
  const deptBreakdown = [
    { name: 'Computer Science & Engineering (CSE)', count: 6420, percentage: 85 },
    { name: 'Electrical & Electronic Engineering (EEE)', count: 3850, percentage: 65 },
    { name: 'Business Administration (BBA)', count: 3100, percentage: 52 },
    { name: 'Civil Engineering (CE)', count: 1200, percentage: 30 },
    { name: 'Media Studies & Journalism (MSJ)', count: 850, percentage: 22 }
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Administrator Portal Dashboard</h1>
          <p className="text-muted">Overview of registration queues, alumni database, and university metrics.</p>
        </div>
        <Badge variant="danger" size="md">
          <ShieldCheck size={14} /> UIU Admin Privileges Active
        </Badge>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid-4-col">
        <StatCard
          icon={Users}
          label="Total Alumni Records"
          value={alumniList.length + 15420}
          subtitle="↑ 12% increase from 2025 term"
          iconColor="var(--color-navy-900)"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Approvals"
          value={pendingRegistrations.length}
          subtitle="Requires registrar verification"
          iconColor="var(--role-admin-color)"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Campus Events"
          value={eventList.length}
          subtitle="Active university events"
          iconColor="var(--color-gold-500)"
        />
        <StatCard
          icon={Briefcase}
          label="Global Employment Rate"
          value="92.7%"
          subtitle="Top MNCs & global tech hiring"
          iconColor="var(--role-student-color)"
        />
      </div>

      <div className="grid-2-col">
        {/* Pending Registrations Queue Summary */}
        <Card className="dashboard-queue-card">
          <div className="card-title-header-row">
            <div>
              <h2 className="heading-h3">Pending Registrations Queue</h2>
              <p className="text-small text-muted">Review applications submitted by graduates</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavSelect('registrations')}
            >
              View All Queue
            </Button>
          </div>

          <div className="pending-mini-list">
            {pendingRegistrations.slice(0, 3).map((reg) => (
              <div key={reg._id || reg.id} className="pending-mini-item">
                <div className="pending-mini-meta">
                  <span className="pending-mini-name">{reg.name}</span>
                  <span className="pending-mini-sub">{reg.batch} • {reg.department}</span>
                </div>
                <Badge variant="warning">{reg.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Alumni by Department Bar Breakdown */}
        <Card className="dashboard-dept-card">
          <h2 className="heading-h3" style={{ marginBottom: '4px' }}>Alumni Distribution by Department</h2>
          <p className="text-small text-muted" style={{ marginBottom: '20px' }}>Total graduates categorized by degree program</p>

          <div className="dept-bars-list">
            {deptBreakdown.map((dept, i) => (
              <div key={i} className="dept-bar-item">
                <div className="dept-bar-labels">
                  <span className="dept-bar-name">{dept.name}</span>
                  <span className="dept-bar-count">{dept.count.toLocaleString()} Graduates</span>
                </div>
                <ProgressBar value={dept.percentage} variant="navy" height="8px" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
