import React, { useState } from 'react';
import { Card, Button, Badge, AvatarChip, StatCard, Modal, ChipInput, api } from '@uiu/ui';
import { Edit3, CheckCircle, Award, Heart, Briefcase, GraduationCap, MapPin, Mail } from 'lucide-react';
import './AlumniProfile.css';

export default function AlumniProfile({ alumni, onUpdateProfile }) {
  const [profile, setProfile] = useState(alumni || {});
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Form edit states
  const [role, setRole] = useState(profile.role || '');
  const [company, setCompany] = useState(profile.company || '');
  const [location, setLocation] = useState(profile.location || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [higherStudies, setHigherStudies] = useState(profile.higherStudies || '');
  const [skills, setSkills] = useState(profile.skills || []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.patch('/alumni/me', {
        role,
        company,
        location,
        bio,
        higherStudies,
        skills
      });
      setProfile(updated);
      if (onUpdateProfile) onUpdateProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="alumni-profile-page">
      {/* Top Banner Card */}
      <Card className="profile-banner-card">
        <div className="profile-top-row">
          <div className="profile-identity">
            <AvatarChip name={profile.name || 'Alumnus'} src={profile.avatar} size="lg" />
            <div className="profile-title-group">
              <div className="name-badge-row">
                <h1 className="heading-h1">{profile.name}</h1>
                <Badge variant="success"><CheckCircle size={12} /> Verified Graduate</Badge>
                <Badge variant="batch">{profile.batch}</Badge>
              </div>
              <p className="profile-headline">{profile.role} at <strong className="text-gold">{profile.company}</strong></p>
              <div className="profile-meta-line">
                <span><MapPin size={14} /> {profile.location || 'Dhaka'}</span>
                <span><Mail size={14} /> {profile.email}</span>
                <span>🎓 {profile.department}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            icon={Edit3}
            onClick={() => {
              setRole(profile.role || '');
              setCompany(profile.company || '');
              setLocation(profile.location || '');
              setBio(profile.bio || '');
              setHigherStudies(profile.higherStudies || '');
              setSkills(profile.skills || []);
              setEditModalOpen(true);
            }}
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* 3 Stat Tiles */}
      <div className="grid-3-col">
        <StatCard
          icon={Heart}
          label="Total Donated"
          value={`৳${(profile.totalDonated || 0).toLocaleString()}`}
          subtitle="UIU Scholarship & Lab Funds"
          iconColor="var(--color-gold-500)"
        />
        <StatCard
          icon={Briefcase}
          label="Career Positions"
          value={`${(profile.careerTimeline || []).length} Positions`}
          subtitle="Updated in career timeline"
          iconColor="var(--color-navy-900)"
        />
        <StatCard
          icon={GraduationCap}
          label="Mentor Status"
          value={profile.isMentor ? 'Active Mentor' : 'Inactive'}
          subtitle={profile.isMentor ? 'Accepting student requests' : 'Currently off'}
          iconColor="var(--role-student-color)"
        />
      </div>

      {/* Profile Details Sections */}
      <div className="grid-2-col">
        <Card>
          <h2 className="heading-h3 section-title">About & Biography</h2>
          <p className="text-body" style={{ marginBottom: '16px' }}>{profile.bio || 'No bio provided yet.'}</p>
          
          <h2 className="heading-h3 section-title">Higher Studies</h2>
          <p className="text-body">🎓 {profile.higherStudies || 'B.Sc. Graduate from UIU'}</p>
        </Card>

        <Card>
          <h2 className="heading-h3 section-title">Skills & Competencies</h2>
          <div className="alumni-tags" style={{ marginBottom: '20px' }}>
            {(profile.skills || []).map((skill, i) => (
              <Badge key={i} variant="info">{skill}</Badge>
            ))}
          </div>

          <h2 className="heading-h3 section-title">Achievements & Awards</h2>
          <div className="alumni-tags">
            {(profile.achievements || []).map((ach, i) => (
              <span key={i} className="story-ach-tag"><Award size={14} /> {ach}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Alumni Profile"
        subtitle="Update your current role, location, and skills"
        maxWidth="550px"
      >
        <form onSubmit={handleSaveProfile} className="auth-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Current Role</label>
              <input
                type="text"
                required
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company / Organization</label>
              <input
                type="text"
                required
                className="form-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location (City, Country)</label>
            <input
              type="text"
              required
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Biography</label>
            <textarea
              rows={3}
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Higher Studies</label>
            <input
              type="text"
              className="form-input"
              value={higherStudies}
              onChange={(e) => setHigherStudies(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <ChipInput chips={skills} onChange={setSkills} placeholder="Add skill..." />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Save Profile Changes
          </Button>
        </form>
      </Modal>
    </div>
  );
}
