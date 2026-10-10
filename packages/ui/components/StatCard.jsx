import React from 'react';
import Card from './Card';
import './StatCard.css';

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = 'default',
  iconColor = 'var(--color-navy-900)'
}) {
  return (
    <Card variant={variant} className="stat-card">
      <div className="stat-card-header">
        <span className="eyebrow-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon-wrap" style={{ color: iconColor }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
    </Card>
  );
}
