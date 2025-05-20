import React, { useState } from 'react';
import { Bookmark, Clock, Star, Trash2, Edit2, Calendar, Filter, Search } from 'lucide-react';
import { mockTools } from '../data/mockData';
import ToolCard from '../components/common/ToolCard';
import { Tool } from '../types/Tool';

const DashboardPage: React.FC = () => {
  // In a real app, we would fetch the user's saved tools from a database
  const [savedTools, setSavedTools] = useState<Tool[]>(mockTools.slice(0, 4));
  const [notes, setNotes] = useState<{ [key: string]: string }>({
    '1': 'Great for my algebra class. Need to create custom activities for the geometry unit.',
    '3': 'Students loved the virtual lab simulation. Consider using for the upcoming chemistry unit.',
  });
  const [activeTab, setActiveTab] = useState('saved');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleRemoveTool = (id: string) => {
    setSavedTools(savedTools.filter(tool => tool.id !== id));
  };
  
  const handleEditNote = (id: string) => {
    setEditingNote(id);
    setNoteText(notes[id] || '');
  };
  
  const handleSaveNote = (id: string) => {
    if (noteText.trim()) {
      setNotes({ ...notes, [id]: noteText });
    } else {
      const updatedNotes = { ...notes };
      delete updatedNotes[id];
      setNotes(updatedNotes);
    }
    setEditingNote(null);
  };
  
  const handleCancelEdit = () => {
    setEditingNote(null);
  };
  
  const filteredTools = searchQuery 
    ? savedTools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notes[tool.id] && notes[tool.id].toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : savedTools;

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-gray-600">
          Manage your saved tools, notes, and track your classroom implementation progress.
        </p>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'saved'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bookmark className="h-5 w-5 mr-2" />
            Saved Tools
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-5 w-5 mr-2" />
            Recently Viewed
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'favorites'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Star className="h-5 w-5 mr-2" />
            Favorites
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'calendar'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Implementation Calendar
          </button>
        </div>
      </div>
      
      {/* Search and filter bar */}
      {activeTab === 'saved' && (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-auto md:flex-grow">
              <input
                type="text"
                placeholder="Search your saved tools..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn btn-outline flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <select className="form-select py-2">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab content */}
      {activeTab === 'saved' && (
        <>
          {filteredTools.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No saved tools yet</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "No tools match your search criteria." 
                  : "When you find tools you'd like to revisit, save them here for easy access."}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn btn-primary"
                >
                  Clear Search
                </button>
              ) : (
                <a href="/tools" className="btn btn-primary">
                  Browse Tools
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTools.map(tool => (
                <div key={tool.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <div className="h-full">
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 md:w-3/4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`pricing-badge ${tool.price.includes('Free') ? 'pricing-badge-free' : 'pricing-badge-paid'}`}>
                              {tool.price}
                            </span>
                            <span className={`tool-difficulty ${
                              tool.difficulty === 'Beginner' 
                                ? 'tool-difficulty-beginner' 
                                : tool.difficulty === 'Intermediate'
                                  ? 'tool-difficulty-intermediate'
                                  : 'tool-difficulty-advanced'
                            } flex items-center`}>
                              <Star className="h-4 w-4 mr-1" />
                              {tool.difficulty}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                          <p className="text-gray-600 mb-4">{tool.description.substring(0, 120)}...</p>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveTool(tool.id)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Remove tool"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Your Notes</h4>
                          {notes[tool.id] && editingNote !== tool.id && (
                            <button
                              onClick={() => handleEditNote(tool.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {editingNote === tool.id ? (
                          <div>
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="form-input h-24 mb-2 w-full"
                              placeholder="Add your notes about this tool..."
                            ></textarea>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-outline py-1 px-3"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(tool.id)}
                                className="btn btn-primary py-1 px-3"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {notes[tool.id] ? (
                              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {notes[tool.id]}
                              </p>
                            ) : (
                              <button
                                onClick={() => handleEditNote(tool.id)}
                                className="text-primary-600 hover:text-primary-800 flex items-center"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Add notes
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex space-x-2">
                          {tool.subjects.slice(0, 3).map((subject, index) => (
                            <span key={index} className="filter-badge text-xs">
                              {subject}
                            </span>
                          ))}
                          {tool.subjects.length > 3 && (
                            <span className="filter-badge text-xs">
                              +{tool.subjects.length - 3}
                            </span>
                          )}
                        </div>
                        
                        <a
                          href={`/tools/${tool.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'history' && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Recently Viewed</h3>
          <p className="text-gray-500 mb-6">
            Tools you've recently viewed will appear here for easy access.
          </p>
        </div>
      )}
      
      {activeTab === 'favorites' && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Favorites</h3>
          <p className="text-gray-500 mb-6">
            Mark tools as favorites to create your curated collection of the best AI tools for your classroom.
          </p>
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Implementation Calendar</h3>
          <p className="text-gray-500 mb-6">
            Plan and track your AI tool implementations throughout the school year.
          </p>
          <button className="btn btn-primary">
            Set Up Your Calendar
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;