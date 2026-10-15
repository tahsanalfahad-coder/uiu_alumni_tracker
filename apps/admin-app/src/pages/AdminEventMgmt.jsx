import React, { useState } from 'react';
import { Card, Button, Badge, ProgressBar, Modal } from '@uiu/ui';
import { Plus, Trash2, Check, X, MessageSquare, Calendar, Clock, MapPin, Send, Ticket } from 'lucide-react';
import './AdminEventMgmt.css';

export default function AdminEventMgmt({
  eventList = [],
  pendingEventRequests = [],
  onAddEvent,
  onRemoveEvent,
  onApproveEventRequest,
  onDeclineEventRequest,
  onSendSuggestion
}) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [targetReq, setTargetReq] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Official University Event');
  const [date, setDate] = useState('2026-10-12');
  const [time, setTime] = useState('04:00 PM - 08:00 PM');
  const [location, setLocation] = useState('UIU Permanent Campus Auditorium');
  const [cost, setCost] = useState('Free');
  const [capacity, setCapacity] = useState('300');
  const [description, setDescription] = useState('');

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    await onAddEvent({
      title,
      category,
      typeBadge: 'Admin Event',
      date,
      time,
      location,
      cost: cost || 'Free',
      capacity: parseInt(capacity) || 300,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      tags: ['University', 'Campus'],
      description,
      scope: 'public'
    });

    setCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleSendSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!targetReq || !suggestionText) return;
    const reqId = targetReq._id || targetReq.id;
    await onSendSuggestion(reqId, suggestionText);
    setSuggestionModalOpen(false);
    setTargetReq(null);
    setSuggestionText('');
  };

  const pendingCount = pendingEventRequests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="admin-events-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">University Event Management</h1>
          <p className="text-muted">Manage campus events and review alumni event proposals.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
          Create Campus Event
        </Button>
      </div>

      {/* Alumni Event Approval Requests Section */}
      <Card className="pending-events-approval-card">
        <div className="approval-card-header">
          <div>
            <h2 className="heading-h2">Alumni Event Approval Requests</h2>
            <p className="text-small text-muted">Review, approve, decline, or give suggestions for events submitted by alumni.</p>
          </div>
          <Badge variant="warning">{pendingCount} Pending Proposals</Badge>
        </div>

        {pendingEventRequests.length === 0 ? (
          <p className="text-muted italic" style={{ padding: '16px 0' }}>No alumni event proposals currently waiting for review.</p>
        ) : (
          <div className="pending-events-grid">
            {pendingEventRequests.map((req) => {
              const reqId = req._id || req.id;
              return (
                <div key={reqId} className="pending-event-item">
                  <div className="pending-event-top">
                    <div>
                      <span className="eyebrow-label text-gold">Proposed by: {req.submittedBy}</span>
                      <h3 className="pending-event-title">{req.title}</h3>
                    </div>
                    <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Declined' ? 'danger' : 'warning'}>
                      {req.status}
                    </Badge>
                  </div>

                  <div className="pending-event-details" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '8px 0' }}>
                    <span><Calendar size={13} /> Date: <strong>{req.date}</strong></span>
                    <span><Clock size={13} /> Schedule: <strong>{req.time}</strong></span>
                    <span><MapPin size={13} /> Place: <strong>{req.location}</strong></span>
                    <span><Ticket size={13} /> Attend Cost: <strong>{req.cost || 'Free'}</strong></span>
                  </div>

                  <p className="pending-event-desc">{req.description}</p>

                  {req.suggestion && (
                    <div className="suggestion-box">
                      <strong>Admin Feedback Sent:</strong> "{req.suggestion}"
                    </div>
                  )}

                  <div className="pending-event-actions">
                    {req.status === 'Pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={() => onApproveEventRequest(reqId)}
                        >
                          Approve & Publish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={MessageSquare}
                          onClick={() => {
                            setTargetReq(req);
                            setSuggestionText(req.suggestion || '');
                            setSuggestionModalOpen(true);
                          }}
                        >
                          Give Suggestion
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={X}
                          onClick={() => onDeclineEventRequest(reqId)}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Official Campus Events List */}
      <div>
        <h2 className="heading-h2" style={{ marginBottom: '16px' }}>Published Campus Events</h2>
        <div className="grid-2-col">
          {eventList.map((evt) => {
            const evtId = evt._id || evt.id;
            const percent = Math.round(((evt.registered || 0) / (evt.capacity || 100)) * 100);
            return (
              <Card key={evtId} className="admin-event-card">
                <div className="admin-event-top">
                  <img src={evt.image} alt={evt.title} className="admin-event-img" />
                  <div className="admin-event-info">
                    <div className="event-badge-row">
                      <Badge variant="warning">{evt.category}</Badge>
                      <div className="event-edit-group">
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => onRemoveEvent(evtId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <h3 className="admin-event-title">{evt.title}</h3>
                    <div className="admin-event-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <span><Calendar size={13} /> Date: <strong>{evt.date}</strong></span>
                      <span><Clock size={13} /> Schedule: <strong>{evt.time}</strong></span>
                      <span><Ticket size={13} /> Cost: <strong>{evt.cost || 'Free'}</strong></span>
                    </div>
                    <p className="admin-event-loc"><MapPin size={13} /> Place: <strong>{evt.location}</strong></p>
                  </div>
                </div>

                <div className="admin-event-capacity-box">
                  <div className="capacity-label-row">
                    <span className="text-small">
                      <strong>{evt.registered || 0}</strong> of {evt.capacity} registered
                    </span>
                    <span className="text-mono font-semibold text-gold">{percent}% full</span>
                  </div>
                  <ProgressBar value={evt.registered || 0} max={evt.capacity || 100} variant="navy" height="8px" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Admin Create Event Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Official Campus Event"
        subtitle="Publish a new event to the student & alumni portals"
        maxWidth="550px"
      >
        <form onSubmit={handleCreateEvent} className="auth-form">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. UIU CSE Career Fair 2026"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Event Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Official University Event">Official University Event</option>
                <option value="Mentorship Workshop">Mentorship Workshop</option>
                <option value="Innovation & Venture">Innovation & Venture</option>
                <option value="Reunion">Reunion</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Capacity Limit</label>
              <input
                type="number"
                required
                className="form-input"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Range</label>
              <input
                type="text"
                required
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Campus Location / Auditorium</label>
            <input
              type="text"
              required
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Event Attend Cost / Registration Fee</label>
            <input
              type="text"
              required
              placeholder="e.g. Free or 500 BDT"
              className="form-input"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              required
              rows={3}
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Publish Campus Event
          </Button>
        </form>
      </Modal>

      {/* Give Suggestion Modal */}
      {targetReq && (
        <Modal
          isOpen={suggestionModalOpen}
          onClose={() => setSuggestionModalOpen(false)}
          title={`Send Admin Suggestion to ${targetReq.submittedBy}`}
          subtitle={`Event Proposal: ${targetReq.title}`}
          maxWidth="500px"
        >
          <form onSubmit={handleSendSuggestionSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Feedback / Suggestion Note</label>
              <textarea
                required
                rows={4}
                placeholder="Enter feedback e.g. Please change the venue to Room 412 or adjust timing to 5 PM..."
                className="form-input"
                style={{ height: 'auto', padding: '10px' }}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" icon={Send} fullWidth size="lg">
              Send Feedback Note
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
