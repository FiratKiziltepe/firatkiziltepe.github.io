import React from 'react';
import { BookOpen, Check } from 'lucide-react';

interface SubjectFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const SubjectFilter: React.FC<SubjectFilterProps> = ({ selected, onChange }) => {
  const subjects = [
    'Mathematics',
    'Science',
    'Language Arts',
    'History',
    'Foreign Languages',
    'Art',
    'Music',
    'Physical Education',
    'Computer Science',
    'Special Education',
  ];

  const handleSubjectChange = (subject: string) => {
    const newSelected = selected.includes(subject)
      ? selected.filter(s => s !== subject)
      : [...selected, subject];
    
    onChange(newSelected);
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <BookOpen className="h-4 w-4 mr-2" />
        Subject Areas
      </h4>
      
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {subjects.map((subject) => (
          <div key={subject} className="flex items-center">
            <button
              onClick={() => handleSubjectChange(subject)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition-colors ${
                selected.includes(subject)
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div 
                className={`h-5 w-5 mr-2 border rounded flex items-center justify-center ${
                  selected.includes(subject)
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-300'
                }`}
              >
                {selected.includes(subject) && <Check className="h-3 w-3" />}
              </div>
              <span>{subject}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectFilter;