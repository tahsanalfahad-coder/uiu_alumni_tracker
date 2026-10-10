import React, { useState } from 'react';
import { Stepper, Button, ToggleSwitch, ChipInput, Badge } from '@uiu/ui';
import {
  Users, Calendar, Clock, MapPin, ArrowLeft, ArrowRight, CheckCircle,
  PartyPopper, Network, Video, Award, HeartHandshake, Upload, X, ShieldAlert
} from 'lucide-react';
import './AlumniPersonalEventWizard.css';

export default function AlumniPersonalEventWizard({ onCancel, onPublishEvent }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Reunion');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [tags, setTags] = useState(['CSE-2017', 'Dhaka Chapter']);

  // Step 2 states
  const [locationType, setLocationType] = useState('physical');
  const [location, setLocation] = useState('UIU Alumni Club & Lounge, Gulshan');
  const [cost, setCost] = useState('Free');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [visibility, setVisibility] = useState('alumni-only');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80');

  const categories = [
    { id: 'Reunion', label: 'Reunion', icon: PartyPopper },
    { id: 'Meetup', label: 'Meetup', icon: Users },
    { id: 'Milestone', label: 'Milestone', icon: Award },
    { id: 'Networking', label: 'Networking', icon: Network },
    { id: 'Conference', label: 'Conference', icon: Video },
    { id: 'Social', label: 'Social / Charity', icon: HeartHandshake }
  ];

  const steps = [
    { title: 'Basic Info' },
    { title: 'Details & Location' },
    { title: 'Review & Submit' }
  ];

  const handleNext = () => {
    if (currentStep === 1 && !title) {
      alert('Please provide an event title to proceed.');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalPublish = () => {
    onPublishEvent({
      title: title || 'Untitled Alumni Event',
      category,
      typeBadge: 'Alumni Proposal',
      date: startDate || '2026-09-20',
      time: isAllDay ? 'All Day Event' : '06:00 PM - 09:00 PM',
      location,
      cost: cost || 'Free',
      capacity: parseInt(capacity) || 50,
      image: imageUrl,
      tags,
      description,
      scope: visibility
    });
  };

  return (
    <div className="wizard-fullscreen-container">
      {/* Minimal Header Chrome Bar */}
      <div className="wizard-minimal-chrome">
        <div className="wizard-breadcrumb-group">
          <span className="breadcrumb-muted">Events</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Create Alumni Event Proposal</span>
        </div>
        <button className="wizard-cancel-link" onClick={onCancel}>
          <X size={16} /> Cancel
        </button>
      </div>

      <div className="wizard-content-wrapper">
        <div className="wizard-card-surface">
          {/* Stepper Progress Bar */}
          <Stepper steps={steps} currentStep={currentStep} />

          {/* Admin Approval Notice Banner */}
          <div className="wizard-admin-notice">
            <ShieldAlert size={18} />
            <span>Alumni events require UIU Administrator approval before being published to the campus calendar.</span>
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="wizard-step-body">
              <h2 className="heading-h2 step-heading">Step 1: Basic Event Information</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Set the title, choose an event category, and schedule the date & tags.
              </p>

              <div className="auth-form">
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE 2017 Batch 10-Year Gathering"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Category</label>
                  <div className="category-tile-picker">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          className={`category-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => setCategory(cat.id)}
                        >
                          <Icon size={22} />
                          <span>{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <ToggleSwitch
                    checked={isAllDay}
                    onChange={setIsAllDay}
                    label="All-day event"
                    subtext="Event runs throughout the day without strict hour bounds."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Tags</label>
                  <ChipInput chips={tags} onChange={setTags} placeholder="Add tag (e.g. CSE-2017, Charity)..." />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="wizard-step-body">
              <h2 className="heading-h2 step-heading">Step 2: Location & Event Details</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Specify venue location or stream link, add description, and set guest limits.
              </p>

              <div className="auth-form">
                <div className="form-group">
                  <label className="form-label">Location Type</label>
                  <div className="segmented-toggle">
                    <button
                      type="button"
                      className={`seg-btn ${locationType === 'physical' ? 'active' : ''}`}
                      onClick={() => setLocationType('physical')}
                    >
                      Physical Venue
                    </button>
                    <button
                      type="button"
                      className={`seg-btn ${locationType === 'online' ? 'active' : ''}`}
                      onClick={() => setLocationType('online')}
                    >
                      Online Meeting / Stream
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {locationType === 'physical' ? 'Venue Address / Location' : 'Meeting Link (Zoom / Google Meet)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={locationType === 'physical' ? 'e.g. Dhanmondi Club Lounge, Dhaka' : 'https://meet.google.com/abc-defg-hij'}
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
                  <label className="form-label">Event Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about agenda, dress code, RSVP notes..."
                    className="form-input"
                    style={{ height: 'auto', padding: '10px' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Guest Limit / Capacity</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="form-input"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Visibility</label>
                    <select
                      className="form-input"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="public">Public (Open to All UIU)</option>
                      <option value="alumni-only">Alumni Only</option>
                      <option value="invite-only">Invite Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="wizard-step-body">
              <h2 className="heading-h2 step-heading">Step 3: Review & Submit Request</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Double-check your proposal details. Once submitted, UIU Administrators will review your event request.
              </p>

              <div className="review-summary-card">
                <div className="review-header">
                  <Badge variant="warning">{category}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit Info
                  </Button>
                </div>

                <h3 className="review-title">{title || 'Untitled Personal Event'}</h3>

                <div className="review-grid">
                  <div className="review-item">
                    <span className="eyebrow-label">Date & Time Schedule</span>
                    <span>{startDate || 'Date not set'} ({isAllDay ? 'All Day' : 'Timed'})</span>
                  </div>
                  <div className="review-item">
                    <span className="eyebrow-label">Place / Location</span>
                    <span>{location || 'Location not set'}</span>
                  </div>
                  <div className="review-item">
                    <span className="eyebrow-label">Attend Cost</span>
                    <Badge variant="success">{cost || 'Free'}</Badge>
                  </div>
                  <div className="review-item">
                    <span className="eyebrow-label">Guest Capacity</span>
                    <span>{capacity} Seats Limit</span>
                  </div>
                </div>

                <div className="review-item" style={{ marginTop: '16px' }}>
                  <span className="eyebrow-label">Event Tags</span>
                  <div className="alumni-tags" style={{ marginTop: '4px' }}>
                    {tags.map((t, i) => <Badge key={i} variant="info">{t}</Badge>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="wizard-nav-footer">
            {currentStep > 1 ? (
              <Button variant="outline" icon={ArrowLeft} onClick={handleBack}>
                Back
              </Button>
            ) : <div />}

            {currentStep < 3 ? (
              <Button variant="primary" icon={ArrowRight} onClick={handleNext}>
                Continue to Step {currentStep + 1}
              </Button>
            ) : (
              <Button variant="accent" icon={CheckCircle} size="lg" onClick={handleFinalPublish}>
                Submit Request to Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
