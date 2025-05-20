import React from 'react';
import { Sliders } from 'lucide-react';

interface SortOptionsProps {
  value: string;
  onChange: (option: string) => void;
}

const SortOptions: React.FC<SortOptionsProps> = ({ value, onChange }) => {
  const options = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rating' },
    { value: 'easiest', label: 'Easiest to Use' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Sliders className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-500">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select py-1 pl-3 pr-10 text-sm border-none focus:ring-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortOptions;