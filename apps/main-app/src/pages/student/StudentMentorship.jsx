import React, { useState } from 'react';
import { Card, Button, Badge, AvatarChip, Modal } from '@uiu/ui';
import { GraduationCap, Clock, CheckCircle, XCircle, Send, MessageSquare, UserCheck } from 'lucide-react';
import './StudentMentorship.css';

export default function StudentMentorship({
  requests = [],
  alumniList = [],
  onRequestMentorship,
  onOpenChat
}) {
  const mentors = alumniList.filter((a) => a.isMentor === true || String(a.isMentor) === 'true');
  const displayMentors = mentors.length > 0 ? mentors : alumniList;

  const acceptedRequests = requests.filter((r) => r.status === 'Accepted');

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted': return <Badge variant="success"><CheckCircle size={12} /> Accepted</Badge>;
      case 'Declined': return <Badge variant="danger"><XCircle size={12} /> Declined</Badge>;
      default: return <Badge variant="warning"><Clock size={12} /> Pending</Badge>;
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestTopic || !requestMessage || !selectedMentor) return;

    if (onRequestMentorship) {
      await onRequestMentorship({
        mentorId: selectedMentor.id || selectedMentor._id,
        mentorName: selectedMentor.name,
        topic: requestTopic,
        message: requestMessage
      });
    }

    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setSelectedMentor(null);
      setRequestTopic('');
      setRequestMessage('');
    }, 1500);
  };

  return (
    <div className="student-mentorship-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Mentorship Hub</h1>
          <p className="text-muted">Connect one-on-one with UIU alumni mentors for 1-on-1 career advice and technical guidance.</p>
        </div>
      </div>

      {/* My Accepted Mentors Section */}
      <Card className="accepted-mentors-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={22} style={{ color: 'var(--color-success-600, #16a34a)' }} />
            <h2 className="heading-h2 section-sub-title" style={{ margin: 0 }}>My Accepted Mentors</h2>
          </div>
          <Badge variant="success">{acceptedRequests.length} Active Mentor{acceptedRequests.length !== 1 ? 's' : ''}</Badge>
        </div>

        {acceptedRequests.length === 0 ? (
          <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-page)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p className="text-muted" style={{ margin: 0 }}>
              You don't have any accepted mentors yet. Select an available alumni mentor below to send a mentorship request!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {acceptedRequests.map((req) => {
              const matchedAlumni = alumniList.find((a) => String(a.id || a._id) === String(req.mentorId)) || {};
              return (
                <div key={req.id || req._id} className="accepted-mentor-card-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <AvatarChip
                        name={req.mentorName || matchedAlumni.name || 'Alumni Mentor'}
                        src={matchedAlumni.avatar}
                        subtext={matchedAlumni.role ? `${matchedAlumni.role} ${matchedAlumni.company ? `@ ${matchedAlumni.company}` : ''}` : 'UIU Alumni Mentor'}
                        size="md"
                      />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-body)', marginBottom: '16px', backgroundColor: 'var(--color-bg-page)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-warm)' }}>
                      <strong>Focus Topic:</strong> <i>{req.topic}</i>
                      {req.message && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{req.message}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border-warm)' }}>
                    <Badge variant="success"><CheckCircle size={12} /> Accepted</Badge>
                    <Button
                      variant="success"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => {
                        if (onOpenChat) {
                          onOpenChat({
                            userId: req.mentorId,
                            _id: req.mentorId,
                            name: req.mentorName || matchedAlumni.name
                          });
                        }
                      }}
                    >
                      Message Mentor
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* My Requests History Section */}
      <Card className="my-requests-card">
        <h2 className="heading-h2 section-sub-title">Mentorship Request History</h2>
        {requests.length === 0 ? (
          <p className="text-muted italic">No mentorship requests sent yet. Choose a mentor below to get started!</p>
        ) : (
          <div className="requests-list">
            {requests.map((req) => (
              <div key={req.id || req._id} className="request-row-item">
                <div className="req-mentor-info">
                  <span className="req-mentor-name">Mentor: <strong>{req.mentorName}</strong></span>
                  <span className="req-topic">Topic: <i>{req.topic}</i></span>
                </div>
                <div className="req-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="req-date">{req.date}</span>
                  {getStatusBadge(req.status)}
                  {req.status === 'Accepted' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => {
                        if (onOpenChat) {
                          onOpenChat({
                            userId: req.mentorId,
                            _id: req.mentorId,
                            name: req.mentorName
                          });
                        }
                      }}
                    >
                      Message Mentor
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Available Mentors Grid */}
      <div>
        <h2 className="heading-h2 section-sub-title" style={{ marginBottom: '16px' }}>Available Alumni Mentors</h2>
        {displayMentors.length === 0 ? (
          <p className="text-muted italic">No alumni mentors currently available. Check back soon!</p>
        ) : (
          <div className="grid-3-col">
            {displayMentors.map((mentor) => (
              <Card key={mentor.id || mentor._id} className="mentor-card">
                <div className="mentor-card-top">
                  <AvatarChip name={mentor.name} src={mentor.avatar} subtext={mentor.company} size="md" />
                  <Badge variant="batch">{mentor.batch}</Badge>
                </div>

                <h3 className="mentor-name">{mentor.name}</h3>
                <p className="mentor-role">{mentor.role}</p>
                <p className="mentor-bio">{mentor.bio}</p>

                <div className="mentor-skills">
                  {(mentor.skills || []).map((s, i) => (
                    <Badge key={i} variant="info" size="sm">{s}</Badge>
                  ))}
                </div>

                <div className="mentor-card-footer">
                  <Button
                    variant="success"
                    fullWidth
                    icon={GraduationCap}
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    Request Mentorship
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedMentor && (
        <Modal
          isOpen={Boolean(selectedMentor)}
          onClose={() => setSelectedMentor(null)}
          title={`Request Mentorship with ${selectedMentor.name}`}
          subtitle={`${selectedMentor.role} @ ${selectedMentor.company}`}
          maxWidth="500px"
        >
          {requestSuccess ? (
            <div className="text-center-heading" style={{ padding: '20px' }}>
              <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 12px' }} />
              <h3>Request Submitted!</h3>
              <p className="text-muted">
                Your mentorship request has been placed in {selectedMentor.name}'s queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="request-form">
              <div className="form-group">
                <label className="form-label">Mentorship Topic / Focus Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning Internship Prep, Overseas Master Application"
                  className="form-input"
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Introduction Note</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain your academic background and what specific questions you'd like to ask..."
                  className="form-input"
                  style={{ height: 'auto', padding: '12px' }}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>

              <Button type="submit" variant="success" icon={Send} fullWidth size="lg">
                Submit Request
              </Button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
