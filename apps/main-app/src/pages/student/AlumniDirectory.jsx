import React, { useState } from 'react';
import { Card, Button, Badge, AvatarChip, Modal, ToggleSwitch, SearchBar, FilterSelect } from '@uiu/ui';
import { Award, MapPin, MessageSquare, Send, CheckCircle, GraduationCap } from 'lucide-react';
import './AlumniDirectory.css';

export default function AlumniDirectory({
  alumniList = [],
  mentorshipRequests = [],
  currentUser = null,
  currentRole = 'student',
  myProfile = null,
  onRequestMentorship,
  onOpenChat
}) {
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [mentorsOnly, setMentorsOnly] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const [requestTopic, setRequestTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const isSelfProfile = (alumni) => {
    if (currentUser) {
      const currentUserIdStr = (currentUser.id || currentUser._id || '').toString();
      const alumniIdStr = (alumni.id || alumni._id || '').toString();
      const alumniUserIdStr = (alumni.userId || '').toString();
      if (currentUserIdStr && (alumniIdStr === currentUserIdStr || alumniUserIdStr === currentUserIdStr)) {
        return true;
      }
      if (currentUser.email && alumni.email && currentUser.email.toLowerCase() === alumni.email.toLowerCase()) {
        return true;
      }
      if (currentUser.name && alumni.name && currentUser.name.trim().toLowerCase() === alumni.name.trim().toLowerCase()) {
        return true;
      }
    }
    if (myProfile) {
      const myProfileIdStr = (myProfile.id || myProfile._id || '').toString();
      const alumniIdStr = (alumni.id || alumni._id || '').toString();
      if (myProfileIdStr && alumniIdStr === myProfileIdStr) {
        return true;
      }
      if (myProfile.email && alumni.email && myProfile.email.toLowerCase() === alumni.email.toLowerCase()) {
        return true;
      }
      if (myProfile.name && alumni.name && myProfile.name.trim().toLowerCase() === alumni.name.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const isMentorshipAccepted = (alumni) => {
    const aid = (alumni.id || alumni._id || '').toString();
    const uid = (alumni.userId || '').toString();
    return mentorshipRequests.some((r) => {
      const mid = (r.mentorId || '').toString();
      const mname = (r.mentorName || '').toLowerCase();
      const isMatch = mid === aid || mid === uid || (r.mentorName && mname === (alumni.name || '').toLowerCase());
      return isMatch && r.status === 'Accepted';
    });
  };

  const handleMessageClick = (alumni) => {
    // If user is an alumnus, they can directly message other alumni!
    if (currentRole === 'alumni') {
      if (onOpenChat) onOpenChat(alumni);
      return;
    }

    // For students: check if mentorship request has been accepted
    if (isMentorshipAccepted(alumni)) {
      if (onOpenChat) onOpenChat(alumni);
    } else {
      setSelectedAlumni(alumni);
      setNoticeModalOpen(true);
    }
  };

  const departments = Array.from(new Set(alumniList.map((a) => a.department).filter(Boolean)));
  const batches = Array.from(new Set(alumniList.map((a) => a.batch).filter(Boolean)));

  const filteredAlumni = alumniList.filter((a) => {
    // Logged-in alumni should not see themselves in the directory
    if (currentRole === 'alumni' && isSelfProfile(a)) {
      return false;
    }

    const matchesSearch =
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase());
    const matchesBatch = !batchFilter || a.batch === batchFilter;
    const matchesDept = !deptFilter || a.department === deptFilter;
    const matchesMentor = !mentorsOnly || a.isMentor;

    return matchesSearch && matchesBatch && matchesDept && matchesMentor;
  });

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestTopic || !requestMessage || !selectedAlumni) return;

    if (onRequestMentorship) {
      await onRequestMentorship({
        mentorId: selectedAlumni.id || selectedAlumni._id,
        mentorName: selectedAlumni.name,
        topic: requestTopic,
        message: requestMessage
      });
    }

    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setRequestModalOpen(false);
      setRequestTopic('');
      setRequestMessage('');
    }, 1500);
  };

  return (
    <div className="alumni-directory-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">UIU Alumni Directory</h1>
          <p className="text-muted">Explore and connect with verified UIU graduates across top global organizations.</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="filter-bar-card">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, company, or job role..."
        />
        <FilterSelect
          value={batchFilter}
          onChange={setBatchFilter}
          options={batches}
          label="All Batches"
        />
        <FilterSelect
          value={deptFilter}
          onChange={setDeptFilter}
          options={departments}
          label="All Departments"
        />
        <ToggleSwitch
          checked={mentorsOnly}
          onChange={setMentorsOnly}
          label="Available Mentors Only"
        />
      </div>

      {/* Alumni Card Grid */}
      <div className="grid-3-col">
        {filteredAlumni.map((alumni) => (
          <Card key={alumni.id || alumni._id} hoverable className="alumni-grid-card">
            <div className="alumni-card-header" onClick={() => setSelectedAlumni(alumni)}>
              <AvatarChip name={alumni.name} src={alumni.avatar} subtext={alumni.company} size="lg" />
              <Badge variant="batch">{alumni.batch}</Badge>
            </div>

            <div className="alumni-card-body" onClick={() => setSelectedAlumni(alumni)}>
              <h3 className="alumni-name">{alumni.name}</h3>
              <p className="alumni-role-company">{alumni.role}</p>
              <p className="alumni-loc"><MapPin size={13} /> {alumni.location}</p>
              <p className="alumni-bio-short">{alumni.bio}</p>

              <div className="alumni-pills-row">
                {alumni.isMentor ? (
                  <Badge variant="success">Available for Mentorship</Badge>
                ) : (
                  <Badge variant="neutral">Graduate</Badge>
                )}
              </div>
            </div>

            <div className="alumni-card-actions">
              {currentRole === 'alumni' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => handleMessageClick(alumni)}
                  fullWidth
                >
                  Message Alumni
                </Button>
              ) : (
                <>
                  <Button
                    variant={isMentorshipAccepted(alumni) ? 'success' : 'outline'}
                    size="sm"
                    icon={MessageSquare}
                    onClick={() => handleMessageClick(alumni)}
                  >
                    {isMentorshipAccepted(alumni) ? 'Message (Accepted)' : 'Message'}
                  </Button>
                  {alumni.isMentor && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={GraduationCap}
                      onClick={() => {
                        setSelectedAlumni(alumni);
                        setRequestModalOpen(true);
                      }}
                    >
                      Request Mentor
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Alumni Detail Modal */}
      {selectedAlumni && (
        <Modal
          isOpen={!requestModalOpen && !noticeModalOpen && Boolean(selectedAlumni)}
          onClose={() => setSelectedAlumni(null)}
          title={selectedAlumni.name}
          subtitle={`${selectedAlumni.batch || ''} • ${selectedAlumni.department || ''}`}
          maxWidth="600px"
        >
          <div className="modal-profile-header">
            <AvatarChip name={selectedAlumni.name} src={selectedAlumni.avatar} size="lg" />
            <div>
              <h3>{selectedAlumni.role}</h3>
              <p className="text-gold font-semibold">{selectedAlumni.company}</p>
              <p className="text-small text-muted"><MapPin size={13} /> {selectedAlumni.location}</p>
            </div>
          </div>

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Biography</h4>
            <p className="text-body">{selectedAlumni.bio}</p>
          </div>

          {selectedAlumni.higherStudies && (
            <div className="modal-profile-section">
              <h4 className="modal-section-title">Higher Studies</h4>
              <p className="text-body">🎓 {selectedAlumni.higherStudies}</p>
            </div>
          )}

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Skills & Expertise</h4>
            <div className="alumni-tags">
              {(selectedAlumni.skills || []).map((s, i) => (
                <Badge key={i} variant="info">{s}</Badge>
              ))}
            </div>
          </div>

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Achievements</h4>
            <div className="alumni-tags">
              {(selectedAlumni.achievements || []).map((ach, i) => (
                <span key={i} className="story-ach-tag"><Award size={14} /> {ach}</span>
              ))}
            </div>
          </div>

          <div className="modal-profile-footer">
            {currentRole === 'alumni' ? (
              <Button
                variant="primary"
                icon={MessageSquare}
                onClick={() => {
                  const target = selectedAlumni;
                  setSelectedAlumni(null);
                  handleMessageClick(target);
                }}
                fullWidth
              >
                Message Alumni Direct
              </Button>
            ) : (
              <>
                <Button
                  variant={isMentorshipAccepted(selectedAlumni) ? 'success' : 'outline'}
                  icon={MessageSquare}
                  onClick={() => {
                    const target = selectedAlumni;
                    setSelectedAlumni(null);
                    handleMessageClick(target);
                  }}
                >
                  {isMentorshipAccepted(selectedAlumni) ? 'Message (Accepted)' : 'Send Message'}
                </Button>
                {selectedAlumni.isMentor && (
                  <Button
                    variant="success"
                    icon={GraduationCap}
                    onClick={() => setRequestModalOpen(true)}
                  >
                    Request Mentorship
                  </Button>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Request Mentorship Modal */}
      {selectedAlumni && (
        <Modal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title={`Request Mentorship with ${selectedAlumni.name}`}
          subtitle={`Alumnus: ${selectedAlumni.role} @ ${selectedAlumni.company}`}
          maxWidth="500px"
        >
          {requestSuccess ? (
            <div className="text-center-heading" style={{ padding: '20px' }}>
              <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 12px' }} />
              <h3>Mentorship Request Sent!</h3>
              <p className="text-muted">
                Your request has been delivered to {selectedAlumni.name}. You will be notified when they respond.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="request-form">
              <div className="form-group">
                <label className="form-label">Mentorship Topic / Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Interview Prep, MS Application Guidance"
                  className="form-input"
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Introduction & Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Introduce yourself, your UIU student term, and what specific guidance you are seeking..."
                  className="form-input"
                  style={{ height: 'auto', padding: '12px' }}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>

              <Button type="submit" variant="success" icon={Send} fullWidth size="lg">
                Send Request
              </Button>
            </form>
          )}
        </Modal>
      )}

      {/* Mentorship Acceptance Required Notice Modal */}
      {selectedAlumni && (
        <Modal
          isOpen={noticeModalOpen}
          onClose={() => setNoticeModalOpen(false)}
          title="Mentorship Acceptance Required"
          subtitle={`Connecting with ${selectedAlumni.name}`}
          maxWidth="480px"
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <GraduationCap size={44} style={{ color: '#d97706', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>
              Send a Mentorship Request First
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
              Direct messaging is enabled after <strong>{selectedAlumni.name}</strong> accepts your mentorship request. Click below to submit your mentorship request!
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setNoticeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                fullWidth
                icon={GraduationCap}
                onClick={() => {
                  setNoticeModalOpen(false);
                  setRequestModalOpen(true);
                }}
              >
                Request Mentorship Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
