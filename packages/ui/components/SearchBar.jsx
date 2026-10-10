import React from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <Search className="search-bar-icon" size={18} />
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, options = [], label = 'All' }) {
  return (
    <select
      className="filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
}

export default SearchBar;
