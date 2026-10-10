import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import './ChipInput.css';

export default function ChipInput({ chips = [], onChange, placeholder = 'Add topic...' }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (chipToRemove) => {
    onChange(chips.filter((c) => c !== chipToRemove));
  };

  return (
    <div className="chip-input-container">
      <div className="chip-list">
        {chips.map((chip) => (
          <span key={chip} className="chip-item">
            {chip}
            <button
              type="button"
              className="chip-remove-btn"
              onClick={() => handleRemove(chip)}
              aria-label={`Remove ${chip}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="chip-input-row">
        <input
          type="text"
          className="chip-text-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button type="button" className="chip-add-btn" onClick={handleAdd}>
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  );
}
