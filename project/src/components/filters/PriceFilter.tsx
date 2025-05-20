import React from 'react';
import { DollarSign, Check } from 'lucide-react';

interface PriceFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({ selected, onChange }) => {
  const priceOptions = [
    'Free',
    'Free Trial',
    'Freemium',
    'Paid',
    'Subscription',
  ];

  const handlePriceChange = (price: string) => {
    const newSelected = selected.includes(price)
      ? selected.filter(p => p !== price)
      : [...selected, price];
    
    onChange(newSelected);
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <DollarSign className="h-4 w-4 mr-2" />
        Pricing Options
      </h4>
      
      <div className="space-y-2">
        {priceOptions.map((price) => (
          <div key={price} className="flex items-center">
            <button
              onClick={() => handlePriceChange(price)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition-colors ${
                selected.includes(price)
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div 
                className={`h-5 w-5 mr-2 border rounded flex items-center justify-center ${
                  selected.includes(price)
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-300'
                }`}
              >
                {selected.includes(price) && <Check className="h-3 w-3" />}
              </div>
              <span>{price}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceFilter;