import React, { useState } from 'react';
import { Card, ReportCard, StatCard, Modal } from '@uiu/ui';
import { Users, Briefcase, GraduationCap, Sparkles, Globe, Award, Download } from 'lucide-react';
import './AdminReports.css';

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState(null);

  const adminReports = [
    {
      id: 'rep-1',
      title: 'Annual Alumni Placement & Employability Audit (2025–2026)',
      description: 'Comprehensive analysis of employment rates, top hiring tech conglomerates, median graduate salaries, and industry distribution across all UIU departments.',
      category: 'Institutional Accreditation'
    },
    {
      id: 'rep-2',
      title: 'Global Higher Studies & Academic Research Destinations',
      description: 'Statistical report tracking UIU graduates pursuing Master’s and Ph.D. programs in top-ranked North American, European, and Asian universities.',
      category: 'Academic Research'
    },
    {
      id: 'rep-3',
      title: 'Alumni Endowment & Scholarship Contribution Ledger',
      description: 'Audit report of all financial contributions, campus development funds, student emergency grants, and endowment trust yields managed by the UIU Alumni Office.',
      category: 'Financial Governance'
    },
    {
      id: 'rep-4',
      title: 'Industry Mentorship & Student Career Guidance Metrics',
      description: 'Quarterly performance metrics of 1-on-1 mentorship programs, resume review engagement, and mock technical interview outcomes.',
      category: 'Student Welfare'
    }
  ];

  const handleDownload = (report) => {
    alert(`Downloading Official UIU Administrative Report: ${report.title}.pdf`);
  };

  return (
    <div className="admin-reports-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Institutional Analytics & Reports</h1>
          <p className="text-muted">Generate and export official PDF statistical reports for university accreditation and board meetings.</p>
        </div>
      </div>

      {/* 2x2 Grid of ReportCards */}
      <div className="grid-2-col">
        {adminReports.map((report) => (
          <ReportCard
            key={report.id}
            title={report.title}
            description={report.description}
            category={report.category}
            onPreview={() => setActiveReport(report)}
            onDownload={() => handleDownload(report)}
          />
        ))}
      </div>

      {/* Key Statistics Overview Panel */}
      <Card className="key-stats-overview-panel">
        <h2 className="heading-h2" style={{ marginBottom: '4px' }}>Key Statistics Overview — 2026</h2>
        <p className="text-muted text-small" style={{ marginBottom: '24px' }}>
          Aggregated live metrics across all UIU departments and global alumni chapters.
        </p>

        <div className="grid-3-col">
          <StatCard
            icon={Users}
            label="Total Graduates"
            value="15,420"
            subtitle="Batches 2004–2025"
            iconColor="var(--color-navy-900)"
          />
          <StatCard
            icon={Briefcase}
            label="Employed Graduates"
            value="14,290"
            subtitle="92.7% Placement Rate"
            iconColor="var(--role-student-color)"
          />
          <StatCard
            icon={GraduationCap}
            label="Higher Studies"
            value="1,850+"
            subtitle="Ph.D. / M.Sc. in US, EU, Asia"
            iconColor="var(--color-gold-500)"
          />
          <StatCard
            icon={Sparkles}
            label="Entrepreneurs & Founders"
            value="320+"
            subtitle="Registered startups & businesses"
            iconColor="var(--role-admin-color)"
          />
          <StatCard
            icon={Globe}
            label="Countries Active"
            value="35 Countries"
            subtitle="Global alumni chapters"
            iconColor="var(--color-navy-900)"
          />
          <StatCard
            icon={Award}
            label="Notable Achievers"
            value="140+"
            subtitle="Forbes 30U30 & Gold Medalists"
            iconColor="var(--color-gold-500)"
          />
        </div>
      </Card>

      {/* Preview Report Modal */}
      {activeReport && (
        <Modal
          isOpen={Boolean(activeReport)}
          onClose={() => setActiveReport(null)}
          title={`Report Preview: ${activeReport.title}`}
          subtitle={`Category: ${activeReport.category} • Executive Summary`}
          maxWidth="600px"
        >
          <div className="report-preview-body">
            <p className="text-body">{activeReport.description}</p>
            
            <div className="preview-audit-box">
              <h4 className="modal-section-title">Audit Metadata</h4>
              <ul className="audit-meta-list">
                <li><strong>Generated Date:</strong> 2026-08-10</li>
                <li><strong>Authorized By:</strong> UIU Registrar & Alumni Relations Office</li>
                <li><strong>Data Scope:</strong> 15,420 Verified Records (2004–2025)</li>
                <li><strong>Format:</strong> High-Resolution Vector PDF</li>
              </ul>
            </div>

            <div className="modal-profile-footer" style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => handleDownload(activeReport)}>
                <Download size={16} /> Download Full PDF Audit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
