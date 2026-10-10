import React, { useState } from 'react';
import { Card, Button, Timeline, Modal, api } from '@uiu/ui';
import { Plus } from 'lucide-react';
import './AlumniCareerTimeline.css';

export default function AlumniCareerTimeline() {
  const [positions, setPositions] = useState([
    {
      id: 'pos-1',
      title: 'Senior Software Engineer',
      company: 'Google Singapore',
      startDate: '2023',
      endDate: 'Present',
      description: 'Leading backend infrastructure for GCP Cloud Services in SEA region.',
      current: true
    },
    {
      id: 'pos-2',
      title: 'Software Engineer II',
      company: 'Grab Singapore',
      startDate: '2021',
      endDate: '2023',
      description: 'Built high-throughput payment processing microservices using Go and Kafka.',
      current: false
    }
  ]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('Present');
  const [description, setDescription] = useState('');

  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!title || !company || !startDate) return;

    try {
      const updatedTimeline = await api.post('/alumni/me/timeline', {
        title,
        company,
        startDate,
        endDate: endDate || 'Present',
        description,
        current: endDate === 'Present' || !endDate
      });
      setPositions(updatedTimeline);
      setAddModalOpen(false);
      setTitle('');
      setCompany('');
      setStartDate('');
      setEndDate('Present');
      setDescription('');
    } catch (err) {
      // Fallback local update if offline or sandbox
      const newPos = {
        id: 'pos-' + Date.now(),
        title,
        company,
        startDate,
        endDate: endDate || 'Present',
        description,
        current: endDate === 'Present' || !endDate
      };
      setPositions([newPos, ...positions]);
      setAddModalOpen(false);
    }
  };

  const handleRemovePosition = async (id) => {
    try {
      const updatedTimeline = await api.delete(`/alumni/me/timeline/${id}`);
      setPositions(updatedTimeline);
    } catch (err) {
      setPositions(positions.filter((p) => (p.id || p._id) !== id));
    }
  };

  return (
    <div className="alumni-timeline-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Career Timeline</h1>
          <p className="text-muted">Document your professional trajectory and inspire UIU students looking up to your path.</p>
        </div>
        <Button variant="accent" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Add Position
        </Button>
      </div>

      <Card>
        <Timeline items={positions} onRemove={handleRemovePosition} />
      </Card>

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Career Position"
        subtitle="Add a new job or role to your public alumni timeline"
        maxWidth="500px"
      >
        <form onSubmit={handleAddPosition} className="auth-form">
          <div className="form-group">
            <label className="form-label">Job Title / Role</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Product Manager"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company / Organization</label>
            <input
              type="text"
              required
              placeholder="e.g. Microsoft, Pathao"
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Start Date / Year</label>
              <input
                type="text"
                required
                placeholder="e.g. 2022"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date (or 'Present')</label>
              <input
                type="text"
                placeholder="e.g. Present, 2024"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role Description & Achievements</label>
            <textarea
              rows={3}
              placeholder="Key responsibilities and technologies used..."
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Save Position to Timeline
          </Button>
        </form>
      </Modal>
    </div>
  );
}
