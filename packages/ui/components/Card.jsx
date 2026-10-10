import React from 'react';
import './Card.css';

export default function Card({
  children,
  className = '',
  variant = 'default', // default | warm | navy | outline
  hoverable = false,
  onClick
}) {
  const classNames = [
    'ui-card',
    `ui-card-${variant}`,
    hoverable ? 'ui-card-hoverable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
}
