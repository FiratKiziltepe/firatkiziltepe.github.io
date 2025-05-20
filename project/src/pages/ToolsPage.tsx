import React, { useState, useEffect } from 'react';
import FilterBar from '../components/filters/FilterBar';
import ToolCard from '../components/common/ToolCard';
import { Tool } from '../types/Tool';
import { mockTools } from '../data/mockData';

const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(mockTools);
  const [filters, setFilters] = useState({
    subjects: [] as string[],
    price: [] as string[],
    difficulty: [] as string[],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [savedTools, setSavedTools] = useState<string[]>([]);
  
  useEffect(() => {
    // Apply filters and search
    let result = [...mockTools];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        tool => 
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.category.toLowerCase().includes(query) ||
          tool.subjects.some(subject => subject.toLowerCase().includes(query))
      );
    }
    
    // Apply subject filters
    if (filters.subjects.length > 0) {
      result = result.filter(tool => 
        filters.subjects.some(subject => tool.subjects.includes(subject))
      );
    }
    
    // Apply price filters
    if (filters.price.length > 0) {
      result = result.filter(tool => 
        filters.price.some(price => tool.price.includes(price))
      );
    }
    
    // Apply difficulty filters
    if (filters.difficulty.length > 0) {
      result = result.filter(tool => 
        filters.difficulty.includes(tool.difficulty)
      );
    }
    
    // Apply sorting
    result = sortTools(result, sortBy);
    
    setFilteredTools(result);
  }, [filters, searchQuery, sortBy]);
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };
  
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleSaveToggle = (id: string) => {
    if (savedTools.includes(id)) {
      setSavedTools(savedTools.filter(toolId => toolId !== id));
    } else {
      setSavedTools([...savedTools, id]);
    }
  };
  
  const sortTools = (toolsToSort: Tool[], sortOption: string): Tool[] => {
    const sortedTools = [...toolsToSort];
    
    switch (sortOption) {
      case 'newest':
        // In a real app, we would sort by date
        return sortedTools;
      case 'rating':
        return sortedTools.sort((a, b) => b.rating - a.rating);
      case 'easiest':
        return sortedTools.sort((a, b) => {
          const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
                 difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
        });
      case 'popular':
      default:
        // In a real app, we would sort by popularity metrics
        return sortedTools.sort((a, b) => b.rating - a.rating);
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tools for Education</h1>
        <p className="text-gray-600">
          Discover and compare AI tools specifically designed for educational settings.
        </p>
      </div>
      
      <FilterBar 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
      />
      
      {filteredTools.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-4">No tools match your filters</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or search query to find more tools.</p>
          <button 
            onClick={() => {
              setFilters({ subjects: [], price: [], difficulty: [] });
              setSearchQuery('');
              setSortBy('popular');
            }}
            className="btn btn-primary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                isSaved={savedTools.includes(tool.id)}
                onSave={handleSaveToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ToolsPage;