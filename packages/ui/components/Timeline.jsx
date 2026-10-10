import React from 'react';
import Card from './Card';
import Button from './Button';
import { Trash2 } from 'lucide-react';
import './Timeline.css';

export default function Timeline({ items = [], onRemove }) {
  return (
    <div className="timeline-container">
      {items.map((item, index) => {
        const isCurrent = item.current || item.isCurrent || item.endDate === 'Present';
        return (
          <div key={item.id || item._id || index} className="timeline-item">
            <div className="timeline-line-col">
              <div className={`timeline-dot ${isCurrent ? 'dot-filled' : 'dot-hollow'}`} />
              {index < items.length - 1 && <div className="timeline-connector" />}
            </div>
            <Card className="timeline-card">
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-title">{item.title}</h3>
                  <span className="timeline-company">{item.company}</span>
                </div>
                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="timeline-remove-btn"
                    onClick={() => onRemove(item.id || item._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <p className="timeline-date">{item.startDate} — {item.endDate || 'Present'}</p>
              {item.description && <p className="timeline-description">{item.description}</p>}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
