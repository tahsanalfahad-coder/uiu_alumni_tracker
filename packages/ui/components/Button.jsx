import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // primary | accent | outline | success | danger | role-admin | role-alumni | role-student
  size = 'md', // sm | md | lg
  icon: Icon,
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  className = ''
}) {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon className="btn-icon" size={size === 'sm' ? 14 : 18} />}
      <span>{children}</span>
    </button>
  );
}
