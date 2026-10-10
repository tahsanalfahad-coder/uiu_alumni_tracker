import React from 'react';
import { Card, Button, Badge, DataTable } from '@uiu/ui';
import { Download, FileText, Award } from 'lucide-react';
import './GuestSuccessStories.css';

const yearlyStatsReport = [
  { year: '2025', graduates: 1240, employed: 1150, employmentRate: '92.7%', avgSalary: '৳62,000' },
  { year: '2024', graduates: 1180, employed: 1095, employmentRate: '92.8%', avgSalary: '৳58,000' },
  { year: '2023', graduates: 1050, employed: 970, employmentRate: '92.3%', avgSalary: '৳54,000' },
  { year: '2022', graduates: 990, employed: 910, employmentRate: '91.9%', avgSalary: '৳50,000' },
  { year: '2021', graduates: 920, employed: 840, employmentRate: '91.3%', avgSalary: '৳46,000' },
  { year: '2020', graduates: 850, employed: 770, employmentRate: '90.5%', avgSalary: '৳42,000' }
];

export default function GuestSuccessStories({ alumniList = [], onSelectAlumniDetail }) {
  const columns = [
    { header: 'Academic Year', accessor: 'year', render: (row) => <strong>{row.year}</strong> },
    { header: 'Total Graduates', accessor: 'graduates' },
    { header: 'Employed Graduates', accessor: 'employed' },
    { header: 'Employment Rate', accessor: 'employmentRate', render: (row) => <Badge variant="success">{row.employmentRate}</Badge> },
    { header: 'Avg Starting Salary', accessor: 'avgSalary' },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={Download}
          onClick={() => alert(`Downloading UIU Alumni Statistics Report - ${row.year}.pdf`)}
        >
          Download PDF
        </Button>
      )
    }
  ];

  return (
    <div className="container-centered section-padding">
      <div className="page-header-box">
        <span className="eyebrow-label">UIU Excellence</span>
        <h1 className="heading-h1">Alumni Success Stories & Career Impact</h1>
        <p className="text-muted">
          Discover how United International University graduates are shaping technology, business, and research around the world.
        </p>
      </div>

      {/* Large Photo-Led Story Grid */}
      <div className="grid-3-col story-photo-grid">
        {alumniList.map((alumni) => (
          <Card key={alumni.id || alumni._id} hoverable className="story-photo-card" onClick={() => onSelectAlumniDetail && onSelectAlumniDetail(alumni)}>
            <div className="story-photo-wrap">
              <img src={alumni.avatar} alt={alumni.name} className="story-photo" />
              <Badge variant="batch" className="story-batch-badge">{alumni.batch}</Badge>
            </div>
            <div className="story-card-body">
              <h3 className="story-name">{alumni.name}</h3>
              <p className="story-role">{alumni.role} @ <strong className="text-gold">{alumni.company}</strong></p>
              <p className="story-higher">{alumni.higherStudies}</p>
              <p className="story-quote">"{alumni.bio}"</p>
              <div className="story-achievements">
                {(alumni.achievements || []).map((ach, i) => (
                  <span key={i} className="story-ach-tag">
                    <Award size={12} /> {ach}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Yearly Alumni Statistics Report Panel */}
      <div className="stats-report-panel">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow-label text-gold">Institutional Data</span>
            <h2 className="heading-h2">Yearly Alumni Statistics Report (2020–2025)</h2>
          </div>
          <Button variant="primary" icon={FileText} onClick={() => alert('Downloading Complete 5-Year Statistical Audit.pdf')}>
            Export Full Audit (PDF)
          </Button>
        </div>

        <DataTable columns={columns} data={yearlyStatsReport} />
      </div>
    </div>
  );
}
