import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '550px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className="ui-modal-surface"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ui-modal-header">
          <div>
            {title && <h3 className="ui-modal-title">{title}</h3>}
            {subtitle && <p className="ui-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="ui-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
}
