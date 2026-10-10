import React from 'react';
import { Card, Button, Badge, ProgressBar, AvatarChip } from '@uiu/ui';
import {
  Users, Briefcase, Globe, Award, ArrowRight, Calendar, MapPin, Clock,
  GraduationCap, UserPlus, Sparkles
} from 'lucide-react';
import './GuestHome.css';

export default function GuestHome({
  alumniList = [],
  eventList = [],
  onOpenAuthModal,
  onNavSelect,
  onSelectAlumniDetail
}) {
  const featuredAlumni = alumniList.slice(0, 3);
  const upcomingEvents = eventList.slice(0, 3);

  return (
    <div className="guest-home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container-centered hero-grid">
          <div className="hero-left">
            <span className="eyebrow-label text-gold">United International University</span>
            <h1 className="hero-title">Connecting Alumni, Inspiring Futures</h1>
            <p className="hero-subcopy">
              The official portal empowering over 15,000+ UIU graduates worldwide. Mentor the next generation, discover career opportunities, and support academic excellence.
            </p>
            <div className="hero-ctas">
              <Button
                variant="accent"
                size="lg"
                icon={UserPlus}
                onClick={() => onOpenAuthModal('alumni', 'register')}
              >
                Join as Alumni
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={GraduationCap}
                onClick={() => onOpenAuthModal('student', 'signin')}
              >
                Student Login
              </Button>
            </div>
          </div>

          <div className="hero-right">
            <Card variant="navy" className="glance-card">
              <div className="glance-header">
                <Sparkles size={20} className="text-gold" />
                <span className="eyebrow-label text-on-navy">Alumni at a Glance</span>
              </div>
              <h2 className="glance-big-number">15,420+</h2>
              <p className="glance-label">Global Graduates Connected</p>
              
              <div className="glance-mini-grid">
                <div className="glance-stat">
                  <span className="glance-num">92.7%</span>
                  <span className="glance-desc">Employment Rate</span>
                </div>
                <div className="glance-stat">
                  <span className="glance-num">35+</span>
                  <span className="glance-desc">Countries Active</span>
                </div>
                <div className="glance-stat">
                  <span className="glance-num">480+</span>
                  <span className="glance-desc">Active Mentors</span>
                </div>
                <div className="glance-stat">
                  <span className="glance-num">৳25M+</span>
                  <span className="glance-desc">Scholarships Funded</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Strip */}
      <section className="stats-strip-section">
        <div className="container-centered stats-strip-grid">
          <div className="strip-item">
            <Users className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">15,420</span>
              <span className="strip-lbl">Total Alumni</span>
            </div>
          </div>
          <div className="strip-item">
            <Briefcase className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">92.7%</span>
              <span className="strip-lbl">Employment Rate</span>
            </div>
          </div>
          <div className="strip-item">
            <GraduationCap className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">1,850+</span>
              <span className="strip-lbl">Higher Studies</span>
            </div>
          </div>
          <div className="strip-item">
            <Sparkles className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">320+</span>
              <span className="strip-lbl">Entrepreneurs</span>
            </div>
          </div>
          <div className="strip-item">
            <Globe className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">35</span>
              <span className="strip-lbl">Countries</span>
            </div>
          </div>
          <div className="strip-item">
            <Award className="strip-icon" size={24} />
            <div className="strip-text">
              <span className="strip-val">৳58k</span>
              <span className="strip-lbl">Avg. Starting Salary</span>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="section-padding">
        <div className="container-centered">
          <div className="section-header-row">
            <div>
              <span className="eyebrow-label">Inspiring Journeys</span>
              <h2 className="heading-h2">Featured Alumni Success Stories</h2>
            </div>
            <Button variant="outline" icon={ArrowRight} onClick={() => onNavSelect('success-stories')}>
              Browse Full Directory
            </Button>
          </div>

          <div className="grid-3-col">
            {featuredAlumni.map((alumni) => (
              <Card key={alumni.id || alumni._id} hoverable onClick={() => onSelectAlumniDetail(alumni)}>
                <div className="alumni-card-top">
                  <AvatarChip name={alumni.name} src={alumni.avatar} subtext={alumni.company} size="lg" />
                  <Badge variant="batch">{alumni.batch}</Badge>
                </div>
                <h3 className="alumni-role-title">{alumni.role}</h3>
                <p className="alumni-location">📍 {alumni.location}</p>
                <p className="alumni-bio-snippet">{alumni.bio}</p>
                <div className="alumni-tags">
                  {(alumni.achievements || []).map((ach, idx) => (
                    <Badge key={idx} variant="info" size="sm">
                      {ach}
                    </Badge>
                  ))}
                  {alumni.isMentor && (
                    <Badge variant="success" size="sm">
                      Mentor Available
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alumni Events Section */}
      <section className="section-padding bg-cream">
        <div className="container-centered">
          <div className="section-header-row">
            <div>
              <span className="eyebrow-label">Community & Gathering</span>
              <h2 className="heading-h2">Upcoming Alumni Events</h2>
            </div>
            <Button variant="outline" icon={Calendar} onClick={() => onNavSelect('events')}>
              View All Events
            </Button>
          </div>

          <div className="grid-3-col">
            {upcomingEvents.map((evt) => (
              <Card key={evt.id || evt._id} className="event-card">
                <div className="event-img-wrap">
                  <img src={evt.image} alt={evt.title} className="event-img" />
                  <Badge variant="warning" className="event-badge">{evt.category}</Badge>
                </div>
                <div className="event-content">
                  <h3 className="event-title">{evt.title}</h3>
                  <div className="event-meta-row">
                    <span><Calendar size={14} /> {evt.date}</span>
                    <span><Clock size={14} /> {evt.time}</span>
                  </div>
                  <p className="event-loc"><MapPin size={14} /> {evt.location}</p>
                  <p className="event-desc">{evt.description}</p>
                  
                  <div className="event-capacity-row">
                    <span className="text-small text-muted">
                      Capacity: {evt.registered} / {evt.capacity} Seats Registered
                    </span>
                    <ProgressBar value={evt.registered} max={evt.capacity} variant="navy" height="6px" />
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onOpenAuthModal('student', 'signin')}
                  >
                    Register Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Sign-in Selection Panel */}
      <section className="section-padding">
        <div className="container-centered">
          <div className="text-center-heading">
            <span className="eyebrow-label">Get Started</span>
            <h2 className="heading-h2">Choose Your Account Experience</h2>
            <p className="text-muted">Select your role to sign in or register for the UIU Alumni Tracker Portal.</p>
          </div>

          <div className="grid-2-col role-selection-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Alumni Card */}
            <Card className="role-entry-card role-card-alumni">
              <div className="role-card-header">
                <GraduationCap size={28} className="text-gold" />
                <Badge variant="batch">Verified Alumni</Badge>
              </div>
              <h3 className="role-card-title">Alumni Portal</h3>
              <ul className="role-benefit-list">
                <li>✓ Share career milestones & timeline</li>
                <li>✓ Mentor UIU current students</li>
                <li>✓ Post job openings & internships</li>
                <li>✓ Contribute to scholarship funds</li>
              </ul>
              <div className="role-btn-group">
                <Button
                  variant="accent"
                  fullWidth
                  onClick={() => onOpenAuthModal('alumni', 'signin')}
                >
                  Alumni Sign In
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => onOpenAuthModal('alumni', 'register')}
                >
                  Register Application
                </Button>
              </div>
            </Card>

            {/* Student Card */}
            <Card className="role-entry-card role-card-student">
              <div className="role-card-header">
                <Users size={28} style={{ color: 'var(--role-student-color)' }} />
                <Badge variant="success">Current Student</Badge>
              </div>
              <h3 className="role-card-title">Student Portal</h3>
              <ul className="role-benefit-list">
                <li>✓ Discover & filter alumni directory</li>
                <li>✓ Request mentorship & guidance</li>
                <li>✓ Apply for exclusive alumni jobs</li>
                <li>✓ Direct messaging with mentors</li>
              </ul>
              <div className="role-btn-group">
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => onOpenAuthModal('student', 'signin')}
                >
                  Student Sign In
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => onOpenAuthModal('student', 'register')}
                >
                  Register Account
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
