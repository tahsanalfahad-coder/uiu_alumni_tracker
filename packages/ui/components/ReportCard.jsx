import React from 'react';
import Card from './Card';
import Button from './Button';
import { FileText, Eye, Download } from 'lucide-react';
import './ReportCard.css';

export default function ReportCard({ title, description, category, onPreview, onDownload }) {
  return (
    <Card className="report-card">
      <div className="report-card-top">
        <div className="report-card-icon">
          <FileText size={22} />
        </div>
        <span className="eyebrow-label">{category}</span>
      </div>

      <h3 className="report-card-title">{title}</h3>
      <p className="report-card-desc">{description}</p>

      <div className="report-card-actions">
        <Button variant="primary" size="sm" icon={Eye} onClick={onPreview}>
          Preview
        </Button>
        <Button variant="outline" size="sm" icon={Download} onClick={onDownload}>
          PDF
        </Button>
      </div>
    </Card>
  );
}
