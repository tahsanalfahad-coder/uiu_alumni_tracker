import React from 'react';
import './ToggleSwitch.css';

export default function ToggleSwitch({ checked, onChange, label, subtext }) {
  return (
    <label className="toggle-switch-wrapper">
      <div className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </div>
      {(label || subtext) && (
        <div className="toggle-label-wrap">
          {label && <span className="toggle-label">{label}</span>}
          {subtext && <span className="toggle-subtext">{subtext}</span>}
        </div>
      )}
    </label>
  );
}
