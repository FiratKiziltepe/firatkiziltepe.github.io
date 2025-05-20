import React, { useState } from 'react';
import { Filter, Sliders, X, Search, RotateCcw } from 'lucide-react';
import SubjectFilter from './SubjectFilter';
import PriceFilter from './PriceFilter';
import DifficultyFilter from './DifficultyFilter';
import SortOptions from './SortOptions';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
  onSortChange: (sort: string) => void;
  onSearch: (query: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, onSortChange, onSearch }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    subjects: [] as string[],
    price: [] as string[],
    difficulty: [] as string[],
  });
  const [sortOption, setSortOption] = useState('popular');
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };
  
  const handleSubjectChange = (selected: string[]) => {
    const newFilters = {
      ...activeFilters,
      subjects: selected,
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handlePriceChange = (selected: string[]) => {
    const newFilters = {
      ...activeFilters,
      price: selected,
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleDifficultyChange = (selected: string[]) => {
    const newFilters = {
      ...activeFilters,
      difficulty: selected,
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
    onSortChange(option);
  };
  
  const resetFilters = () => {
    setActiveFilters({
      subjects: [],
      price: [],
      difficulty: [],
    });
    setSortOption('popular');
    setSearchValue('');
    onFilterChange({ subjects: [], price: [], difficulty: [] });
    onSortChange('popular');
    onSearch('');
  };
  
  const getTotalActiveFilters = () => {
    return activeFilters.subjects.length + activeFilters.price.length + activeFilters.difficulty.length;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg mb-6">
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          {/* Search bar */}
          <div className="relative flex-grow mb-4 md:mb-0">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search for AI tools..."
                className="form-input pl-10"
                value={searchValue}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </form>
          </div>
          
          {/* Filter button */}
          <button
            onClick={toggleFilter}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              isFilterOpen || getTotalActiveFilters() > 0
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {getTotalActiveFilters() > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                {getTotalActiveFilters()}
              </span>
            )}
          </button>
          
          {/* Sort options desktop */}
          <div className="hidden md:block">
            <SortOptions value={sortOption} onChange={handleSortChange} />
          </div>
          
          {/* Reset button (only show when filters active) */}
          {getTotalActiveFilters() > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
        
        {/* Sort options mobile */}
        <div className="mt-4 md:hidden">
          <SortOptions value={sortOption} onChange={handleSortChange} />
        </div>
      </div>
      
      {/* Expanded filter panel */}
      {isFilterOpen && (
        <div className="p-4 border-t border-gray-200 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Filters</h3>
            <button onClick={toggleFilter} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject filter */}
            <div>
              <SubjectFilter 
                selected={activeFilters.subjects} 
                onChange={handleSubjectChange} 
              />
            </div>
            
            {/* Price filter */}
            <div>
              <PriceFilter 
                selected={activeFilters.price} 
                onChange={handlePriceChange} 
              />
            </div>
            
            {/* Difficulty filter */}
            <div>
              <DifficultyFilter 
                selected={activeFilters.difficulty} 
                onChange={handleDifficultyChange} 
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="btn btn-outline mr-2"
            >
              Reset All
            </button>
            <button
              onClick={toggleFilter}
              className="btn btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;