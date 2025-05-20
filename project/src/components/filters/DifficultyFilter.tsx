import React from 'react';
import { Award, Check } from 'lucide-react';

interface DifficultyFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const DifficultyFilter: React.FC<DifficultyFilterProps> = ({ selected, onChange }) => {
  const difficultyOptions = [
    'Beginner', 
    'Intermediate', 
    'Advanced'
  ];

  const handleDifficultyChange = (difficulty: string) => {
    const newSelected = selected.includes(difficulty)
      ? selected.filter(d => d !== difficulty)
      : [...selected, difficulty];
    
    onChange(newSelected);
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <Award className="h-4 w-4 mr-2" />
        Difficulty Level
      </h4>
      
      <div className="space-y-2">
        {difficultyOptions.map((difficulty) => (
          <div key={difficulty} className="flex items-center">
            <button
              onClick={() => handleDifficultyChange(difficulty)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition-colors ${
                selected.includes(difficulty)
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div 
                className={`h-5 w-5 mr-2 border rounded flex items-center justify-center ${
                  selected.includes(difficulty)
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-300'
                }`}
              >
                {selected.includes(difficulty) && <Check className="h-3 w-3" />}
              </div>
              <span>{difficulty}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DifficultyFilter;