import React, { useState } from 'react';
import { Card, Button, Badge, Modal, api } from '@uiu/ui';
import { Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import './AlumniPostJobs.css';

export default function AlumniPostJobs({ jobList = [], onAddJob, onRemoveJob }) {
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('Google Singapore');
  const [type, setType] = useState('Full-time');
  const [location, setLocation] = useState('Remote / Singapore');
  const [stipend, setStipend] = useState('৳75,000 - ৳100,000 / month');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-09-30');

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!title || !company || !description) return;

    try {
      const createdJob = await api.post('/jobs', {
        title,
        company,
        type,
        location,
        stipend,
        description,
        deadline
      });
      if (onAddJob) onAddJob(createdJob);
      setPostModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      alert(err.message || 'Failed to post job');
    }
  };

  return (
    <div className="alumni-post-jobs-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">My Job Postings</h1>
          <p className="text-muted">Post engineering, business, and research opportunities to hire UIU graduates.</p>
        </div>
        <Button variant="accent" icon={Plus} onClick={() => setPostModalOpen(true)}>
          Post a Job
        </Button>
      </div>

      <div className="grid-2-col">
        {jobList.map((job) => {
          const id = job.id || job._id;
          return (
            <Card key={id} className="alumni-job-card">
              <div className="job-card-top">
                <div>
                  <Badge variant={job.type === 'Internship' ? 'info' : 'success'}>{job.type}</Badge>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company} • {job.location}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="timeline-remove-btn"
                  onClick={() => onRemoveJob && onRemoveJob(id)}
                >
                  <Trash2 size={14} /> Remove
                </Button>
              </div>

              <div className="job-stipend-box">
                <DollarSign size={16} className="text-gold" />
                <span className="job-stipend">{job.stipend}</span>
              </div>

              <p className="job-desc-snippet">{job.description}</p>

              <div className="job-card-footer">
                <span className="job-deadline">
                  <Clock size={14} /> Deadline: <strong className="text-danger">{job.deadline}</strong>
                </span>
                <span className="text-small text-muted">Posted: {job.postedDate}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Post Job Modal */}
      <Modal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        title="Post a New Job Opportunity"
        subtitle="Refer UIU students and graduates directly"
        maxWidth="550px"
      >
        <form onSubmit={handlePostJob} className="auth-form">
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Backend Engineer"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                required
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salary / Stipend Range</label>
              <input
                type="text"
                required
                className="form-input"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Job Description & Qualifications</label>
            <textarea
              required
              rows={4}
              placeholder="Describe requirements and what background you are looking for..."
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Application Deadline</label>
            <input
              type="date"
              required
              className="form-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Publish Job Opportunity
          </Button>
        </form>
      </Modal>
    </div>
  );
}
