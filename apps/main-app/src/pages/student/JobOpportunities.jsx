import React, { useState } from 'react';
import { Card, Button, Badge, Modal, SearchBar, FilterSelect } from '@uiu/ui';
import { Clock, DollarSign, Send, CheckCircle, UserCheck } from 'lucide-react';
import './JobOpportunities.css';

export default function JobOpportunities({ jobList = [] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const filteredJobs = jobList.filter((j) => {
    const matchesSearch =
      (j.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (j.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (j.postedBy || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || j.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleApply = (e) => {
    e.preventDefault();
    const id = selectedJob.id || selectedJob._id;
    setAppliedJobs((prev) => [...prev, id]);
    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      setApplyModalOpen(false);
    }, 1500);
  };

  return (
    <div className="job-opportunities-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Alumni Job & Internship Opportunities</h1>
          <p className="text-muted">Exclusive job postings directly referable by UIU alumni industry leaders.</p>
        </div>
      </div>

      <div className="filter-bar-card">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by job title, company, or referrer..."
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={['Full-time', 'Internship', 'Remote', 'Contract']}
          label="All Job Types"
        />
      </div>

      <div className="grid-2-col">
        {filteredJobs.map((job) => {
          const id = job.id || job._id;
          const isApplied = appliedJobs.includes(id);
          return (
            <Card key={id} className="job-opportunity-card">
              <div className="job-card-top">
                <div>
                  <Badge variant={job.type === 'Internship' ? 'info' : 'success'}>{job.type}</Badge>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company} • <span className="text-muted">{job.location}</span></p>
                </div>
              </div>

              <div className="job-stipend-box">
                <DollarSign size={16} className="text-gold" />
                <span className="job-stipend">{job.stipend}</span>
              </div>

              <p className="job-desc-snippet">{job.description}</p>

              <div className="job-referrer-line">
                <span>Posted by UIU Alumnus: <strong>{job.postedBy}</strong></span>
              </div>

              <div className="job-card-footer">
                <span className="job-deadline">
                  <Clock size={14} /> Deadline: <strong className="text-danger">{job.deadline}</strong>
                </span>

                {isApplied ? (
                  <Badge variant="success" size="md">
                    <UserCheck size={14} /> Application Submitted
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={() => {
                      setSelectedJob(job);
                      setApplyModalOpen(true);
                    }}
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedJob && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply for ${selectedJob.title}`}
          subtitle={`${selectedJob.company} • Referrer: ${selectedJob.postedBy}`}
          maxWidth="500px"
        >
          {applySuccess ? (
            <div className="text-center-heading" style={{ padding: '20px' }}>
              <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 12px' }} />
              <h3>Application Sent to {selectedJob.postedBy}!</h3>
              <p className="text-muted">
                Your profile and CV have been forwarded directly to {selectedJob.postedBy} for referral consideration.
              </p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="request-form">
              <div className="form-group">
                <label className="form-label">Attached Resume / CV Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/your-cv.pdf"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Note to Referrer</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly explain why your UIU coursework makes you a great fit..."
                  className="form-input"
                  style={{ height: 'auto', padding: '12px' }}
                />
              </div>

              <Button type="submit" variant="primary" icon={Send} fullWidth size="lg">
                Submit Referral Application
              </Button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
