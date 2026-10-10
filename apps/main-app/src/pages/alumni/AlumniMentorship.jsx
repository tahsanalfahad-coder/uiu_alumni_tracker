import React, { useState } from 'react';
import { Card, Button, Badge, ToggleSwitch, ChipInput, AvatarChip, api } from '@uiu/ui';
import { Check, X, Clock, GraduationCap, MessageSquare } from 'lucide-react';
import './AlumniMentorship.css';

export default function AlumniMentorship({
  requests = [],
  onAcceptRequest,
  onDeclineRequest,
  onOpenChatWithStudent
}) {
  const [available, setAvailable] = useState(true);
  const [topics, setTopics] = useState([
    'Backend System Design',
    'Cloud Architecture & AWS',
    'Overseas Job Search',
    'Microservices & Go'
  ]);

  const handleToggleAvailable = async (newVal) => {
    setAvailable(newVal);
    try {
      await api.patch('/alumni/me/mentorship', { isMentor: newVal, mentorshipTopics: topics });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopicsChange = async (newTopics) => {
    setTopics(newTopics);
    try {
      await api.patch('/alumni/me/mentorship', { isMentor: available, mentorshipTopics: newTopics });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="alumni-mentorship-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Mentorship Management</h1>
          <p className="text-muted">Set your availability, topics of guidance, and manage incoming student requests.</p>
        </div>
      </div>

      <div className="grid-2-col">
        {/* Availability Panel */}
        <Card className="availability-card">
          <div className="panel-header-row">
            <GraduationCap size={24} className="text-gold" />
            <h2 className="heading-h3">Mentorship Availability Status</h2>
          </div>
          <ToggleSwitch
            checked={available}
            onChange={handleToggleAvailable}
            label={available ? 'Available for Student Mentorship' : 'Currently Unavailable'}
            subtext={
              available
                ? 'Your profile is visible in the Student Directory and students can send new mentorship requests.'
                : 'Your profile will show as unavailable. Students cannot send new mentorship requests.'
            }
          />
        </Card>

        {/* Topics Panel */}
        <Card className="topics-card">
          <h2 className="heading-h3" style={{ marginBottom: '12px' }}>Mentorship Topics & Specialties</h2>
          <p className="text-small text-muted" style={{ marginBottom: '16px' }}>
            Topics you feel comfortable advising students on (add or remove tags):
          </p>
          <ChipInput chips={topics} onChange={handleTopicsChange} placeholder="Add new topic..." />
        </Card>
      </div>

      {/* Incoming Requests List */}
      <Card>
        <div className="requests-header-row">
          <h2 className="heading-h2">Incoming Mentorship Requests</h2>
          <Badge variant="warning">{requests.filter(r => r.status === 'Pending').length} Pending</Badge>
        </div>

        {requests.length === 0 ? (
          <p className="text-muted italic" style={{ padding: '20px 0' }}>
            No student mentorship requests in queue.
          </p>
        ) : (
          <div className="incoming-requests-grid">
            {requests.map((req) => {
              const id = req.id || req._id;
              return (
                <div key={id} className="incoming-req-card">
                  <div className="incoming-req-top">
                    <AvatarChip
                      name={req.studentName}
                      src={req.studentAvatar}
                      subtext={`Student ID: ${req.studentId}`}
                      size="md"
                    />
                    <span className="req-time-stamp"><Clock size={12} /> {req.date}</span>
                  </div>

                  <div className="incoming-req-body">
                    <div className="topic-badge-line">
                      <span className="eyebrow-label">Topic:</span>
                      <Badge variant="info">{req.topic}</Badge>
                    </div>
                    <p className="req-msg-quote">"{req.message}"</p>
                  </div>

                  <div className="incoming-req-footer" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {req.status === 'Pending' ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={() => onAcceptRequest && onAcceptRequest(id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={X}
                          onClick={() => onDeclineRequest && onDeclineRequest(id)}
                        >
                          Decline
                        </Button>
                      </>
                    ) : (
                      <Badge variant={req.status === 'Accepted' ? 'success' : 'danger'}>
                        Status: {req.status}
                      </Badge>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => onOpenChatWithStudent && onOpenChatWithStudent(req)}
                    >
                      Message Student
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
