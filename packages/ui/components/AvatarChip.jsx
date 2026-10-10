import React from 'react';
import './AvatarChip.css';

export default function AvatarChip({
  name,
  src,
  subtext,
  size = 'md', // sm | md | lg
  className = ''
}) {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`avatar-chip avatar-chip-${size} ${className}`}>
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="avatar-chip-img" />
      ) : (
        <div className="avatar-chip-fallback">{initial}</div>
      )}
      <div className="avatar-chip-meta">
        <span className="avatar-chip-name">{name}</span>
        {subtext && <span className="avatar-chip-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
