import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, BookmarkCheck, Clock, Award } from 'lucide-react';
import { Tool } from '../../types/Tool';

interface ToolCardProps {
  tool: Tool;
  isSaved?: boolean;
  onSave?: (id: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, isSaved = false, onSave }) => {
  const { id, name, description, image, category, difficulty, price, rating, subjects } = tool;

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Beginner':
        return 'tool-difficulty-beginner';
      case 'Intermediate':
        return 'tool-difficulty-intermediate';
      case 'Advanced':
        return 'tool-difficulty-advanced';
      default:
        return '';
    }
  };

  const getPriceStyle = () => {
    return price.includes('Free') ? 'pricing-badge-free' : 'pricing-badge-paid';
  };

  const truncateDescription = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="tool-card flex flex-col h-full transition-all hover:scale-[1.02] hover:shadow-hover-card">
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-40 object-cover rounded-t-xl"
        />
        <button
          onClick={() => onSave && onSave(id)}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
          aria-label={isSaved ? "Remove from saved" : "Save for later"}
        >
          {isSaved ? (
            <BookmarkCheck className="h-5 w-5 text-primary-600" />
          ) : (
            <Bookmark className="h-5 w-5 text-gray-400 hover:text-primary-600" />
          )}
        </button>
      </div>
      
      <div className="flex-grow p-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="pricing-badge mb-2 mr-2 ${getPriceStyle()}">{price}</span>
            <span className={`tool-difficulty ${getDifficultyColor()} flex items-center`}>
              <Award className="h-4 w-4 mr-1" />
              {difficulty}
            </span>
          </div>
          
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>{rating}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mt-2">{name}</h3>
        
        <p className="text-gray-600 mt-2 mb-4">
          {truncateDescription(description)}
        </p>
        
        <div className="mt-auto">
          <div className="flex flex-wrap gap-1 mb-4">
            {subjects.slice(0, 3).map((subject, index) => (
              <span key={index} className="filter-badge text-xs">
                {subject}
              </span>
            ))}
            {subjects.length > 3 && (
              <span className="filter-badge text-xs">+{subjects.length - 3}</span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {category}
            </span>
            
            <Link
              to={`/tools/${id}`}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;