import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({
  value,
  max = 100,
  variant = 'navy', // navy | gold | green | admin
  showLabel = false,
  height = '8px'
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100))) || 0;

  return (
    <div className="ui-progress-wrapper">
      <div className="ui-progress-track" style={{ height }}>
        <div
          className={`ui-progress-fill ui-progress-${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="ui-progress-label">{percentage}%</span>}
    </div>
  );
}
