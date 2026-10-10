import React, { useState } from 'react';
import { Card, Button, Badge, AvatarChip, StatCard, Modal, ChipInput, api } from '@uiu/ui';
import { Edit3, CheckCircle, GraduationCap, Mail, Phone, Linkedin, Github, BookOpen, Code, Award } from 'lucide-react';
import './StudentProfile.css';

export default function StudentProfile({ profile = {}, onUpdateProfile }) {
  const [studentData, setStudentData] = useState(profile);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState(studentData.name || '');
  const [studentId, setStudentId] = useState(studentData.studentId || '');
  const [department, setDepartment] = useState(studentData.department || '');
  const [year, setYear] = useState(studentData.year || '');
  const [bio, setBio] = useState(studentData.bio || '');
  const [phone, setPhone] = useState(studentData.phone || '');
  const [linkedin, setLinkedin] = useState(studentData.linkedin || '');
  const [github, setGithub] = useState(studentData.github || '');
  const [avatar, setAvatar] = useState(studentData.avatar || '');
  const [skills, setSkills] = useState(studentData.skills || []);

  const handleOpenEdit = () => {
    setName(studentData.name || '');
    setStudentId(studentData.studentId || '');
    setDepartment(studentData.department || '');
    setYear(studentData.year || '');
    setBio(studentData.bio || '');
    setPhone(studentData.phone || '');
    setLinkedin(studentData.linkedin || '');
    setGithub(studentData.github || '');
    setAvatar(studentData.avatar || '');
    setSkills(studentData.skills || []);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.patch('/student/me', {
        name,
        studentId,
        department,
        year,
        bio,
        phone,
        linkedin,
        github,
        avatar,
        skills
      });
      setStudentData(updated);
      if (onUpdateProfile) onUpdateProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const currentProfile = { ...studentData, ...profile };

  return (
    <div className="student-profile-page">
      {/* Top Banner Card */}
      <Card className="profile-banner-card">
        <div className="profile-top-row">
          <div className="profile-identity">
            <AvatarChip name={currentProfile.name || 'Student'} src={currentProfile.avatar} size="lg" />
            <div className="profile-title-group">
              <div className="name-badge-row">
                <h1 className="heading-h1">{currentProfile.name || 'Student Name'}</h1>
                <Badge variant="success"><CheckCircle size={12} /> Enrolled Student</Badge>
                {currentProfile.studentId && <Badge variant="batch">ID: {currentProfile.studentId}</Badge>}
              </div>
              <p className="profile-headline">
                <GraduationCap size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {currentProfile.department || 'Computer Science & Engineering'} • {currentProfile.year || '3rd Year'}
              </p>
              <div className="profile-meta-line">
                {currentProfile.email && <span><Mail size={14} /> {currentProfile.email}</span>}
                {currentProfile.phone && <span><Phone size={14} /> {currentProfile.phone}</span>}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            icon={Edit3}
            onClick={handleOpenEdit}
          >
            Edit Student Profile
          </Button>
        </div>
      </Card>

      {/* Highlights Grid */}
      <div className="grid-3-col">
        <StatCard
          icon={GraduationCap}
          label="Academic Program"
          value={currentProfile.department || 'CSE'}
          subtitle={currentProfile.year || 'Undergraduate'}
          iconColor="var(--role-student-color)"
        />
        <StatCard
          icon={Code}
          label="Skills & Interests"
          value={`${(currentProfile.skills || []).length} Skills`}
          subtitle="Added to student portfolio"
          iconColor="var(--color-navy-900)"
        />
        <StatCard
          icon={Award}
          label="Account Status"
          value="Active UIU Student"
          subtitle="Verified Email & Student ID"
          iconColor="var(--color-gold-500)"
        />
      </div>

      {/* Details Section */}
      <div className="grid-2-col">
        <Card>
          <h2 className="heading-h3 section-title">About Me & Biography</h2>
          <p className="text-body" style={{ marginBottom: '20px' }}>
            {currentProfile.bio || 'No biography provided yet. Click "Edit Student Profile" to add details about your academic interests and career goals!'}
          </p>

          <h2 className="heading-h3 section-title">Social & Professional Links</h2>
          <div className="student-social-links">
            {currentProfile.linkedin ? (
              <a href={currentProfile.linkedin} target="_blank" rel="noopener noreferrer" className="student-link-item">
                <Linkedin size={16} /> <span>LinkedIn Profile</span>
              </a>
            ) : (
              <span className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>LinkedIn: Not added</span>
            )}
            {currentProfile.github ? (
              <a href={currentProfile.github} target="_blank" rel="noopener noreferrer" className="student-link-item">
                <Github size={16} /> <span>GitHub Profile</span>
              </a>
            ) : (
              <span className="text-muted" style={{ display: 'block' }}>GitHub: Not added</span>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="heading-h3 section-title">Skills & Technical Interests</h2>
          <div className="alumni-tags" style={{ marginBottom: '24px' }}>
            {(currentProfile.skills && currentProfile.skills.length > 0) ? (
              currentProfile.skills.map((skill, i) => (
                <Badge key={i} variant="info">{skill}</Badge>
              ))
            ) : (
              <p className="text-muted italic">No skills listed yet.</p>
            )}
          </div>

          <h2 className="heading-h3 section-title">Department & Academic Info</h2>
          <div className="academic-info-box">
            <p><strong>Department:</strong> {currentProfile.department || 'Computer Science & Engineering'}</p>
            <p><strong>Semester / Year:</strong> {currentProfile.year || '3rd Year / 7th Trimester'}</p>
            <p><strong>Student ID:</strong> {currentProfile.studentId || '011 201 045'}</p>
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Profile"
        subtitle="Update your profile photo, student details, bio, and skills"
        maxWidth="580px"
      >
        <form onSubmit={handleSaveProfile} className="auth-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student ID Number</label>
              <input
                type="text"
                required
                className="form-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                required
                className="form-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year / Trimester</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 3rd Year / 7th Trimester"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Picture URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="+8801700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GitHub Profile URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Biography / Summary</label>
            <textarea
              rows={3}
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills & Interests</label>
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
