import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral', // neutral | success | warning | danger | info | batch | role
  size = 'md', // sm | md
  className = ''
}) {
  return (
    <span className={`ui-badge ui-badge-${variant} ui-badge-${size} ${className}`}>
      {children}
    </span>
  );
}
