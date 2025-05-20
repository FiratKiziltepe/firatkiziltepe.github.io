import React, { useState } from 'react';
import { MessageSquare, Users, Search, Filter, ThumbsUp, MessageCircle, Award, Clock, User } from 'lucide-react';

const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  
  const mockDiscussions = [
    {
      id: '1',
      title: 'How are you using AI for formative assessment?',
      author: 'Maria Rodriguez',
      authorRole: 'High School Math Teacher',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      date: '2 days ago',
      content: 'I\'ve been experimenting with a few AI tools for quick formative assessments in my algebra classes. What tools have you found most effective for getting immediate feedback on student understanding?',
      replies: 12,
      likes: 24,
      views: 156,
      tags: ['Assessment', 'Mathematics', 'High School']
    },
    {
      id: '2',
      title: 'Concerns about AI plagiarism in student writing',
      author: 'James Wilson',
      authorRole: 'Middle School English Teacher',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      date: '5 days ago',
      content: 'I\'m noticing more students using AI to write their essays. How are other English teachers addressing this? Any recommended detection tools or alternative assignment approaches?',
      replies: 28,
      likes: 35,
      views: 312,
      tags: ['Writing', 'Language Arts', 'Academic Integrity']
    },
    {
      id: '3',
      title: 'Success story: Virtual science labs with AI',
      author: 'Aisha Johnson',
      authorRole: 'Science Department Head',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      date: '1 week ago',
      content: 'I wanted to share how we\'ve transformed our science curriculum using AI-powered virtual labs. Students are more engaged than ever, and we\'re able to run experiments that would be impossible in a physical classroom.',
      replies: 8,
      likes: 42,
      views: 230,
      tags: ['Science', 'Virtual Labs', 'Success Story']
    },
    {
      id: '4',
      title: 'AI tools for special education classrooms',
      author: 'Michael Chen',
      authorRole: 'Special Education Teacher',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      date: '2 weeks ago',
      content: 'Looking for recommendations on AI tools specifically designed for students with learning differences. I teach a diverse special education classroom and need solutions that can adapt to various needs.',
      replies: 15,
      likes: 28,
      views: 187,
      tags: ['Special Education', 'Accessibility', 'Differentiation']
    },
  ];
  
  const mockTrends = [
    { tag: 'Assessment Tools', count: 128 },
    { tag: 'AI Ethics', count: 94 },
    { tag: 'Language Learning', count: 86 },
    { tag: 'Math Education', count: 75 },
    { tag: 'Virtual Reality', count: 63 },
  ];
  
  const mockActiveUsers = [
    { 
      name: 'Sarah Johnson', 
      role: 'Math Teacher', 
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', 
      contributions: 42 
    },
    { 
      name: 'Michael Thompson', 
      role: 'English Teacher', 
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', 
      contributions: 36 
    },
    { 
      name: 'Jessica Lee', 
      role: 'Science Teacher', 
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg', 
      contributions: 31 
    },
  ];
  
  const filteredDiscussions = searchQuery
    ? mockDiscussions.filter(discussion =>
        discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : mockDiscussions;

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
        <p className="text-gray-600">
          Connect with fellow educators, share experiences, and discover new ways to implement AI tools in your classroom.
        </p>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'discussions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Discussions
          </button>
          
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'questions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Questions & Answers
          </button>
          
          <button
            onClick={() => setActiveTab('success')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'success'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Award className="h-5 w-5 mr-2" />
            Success Stories
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="lg:w-3/4">
          {/* Search and filter bar */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-auto md:flex-grow">
                <input
                  type="text"
                  placeholder="Search discussions..."
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
                  <option value="popular">Most Popular</option>
                  <option value="active">Most Active</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* New discussion button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <button className="btn btn-primary">
              Start New Discussion
            </button>
          </div>
          
          {/* Discussions list */}
          {filteredDiscussions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No discussions found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find any discussions matching your search.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDiscussions.map(discussion => (
                <div key={discussion.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold hover:text-primary-600 transition-colors">
                      <a href={`/community/discussions/${discussion.id}`}>
                        {discussion.title}
                      </a>
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {discussion.date}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">
                    {discussion.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {discussion.tags.map((tag, index) => (
                      <span key={index} className="filter-badge text-xs bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img
                        src={discussion.avatar}
                        alt={discussion.author}
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{discussion.author}</p>
                        <p className="text-xs text-gray-500">{discussion.authorRole}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {discussion.replies}
                      </div>
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {discussion.likes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            <button className="btn btn-outline">
              Load More
            </button>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/4">
          {/* Community stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Members</span>
                </div>
                <span className="font-medium">4,285</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Discussions</span>
                </div>
                <span className="font-medium">1,842</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Comments</span>
                </div>
                <span className="font-medium">12,568</span>
              </div>
            </div>
          </div>
          
          {/* Trending topics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
            
            <div className="space-y-3">
              {mockTrends.map((trend, index) => (
                <div key={index} className="flex justify-between items-center">
                  <a href="#" className="text-primary-600 hover:text-primary-800 hover:underline">
                    #{trend.tag}
                  </a>
                  <span className="text-sm text-gray-500">{trend.count} posts</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Active members */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Active Members</h3>
            
            <div className="space-y-4">
              {mockActiveUsers.map((user, index) => (
                <div key={index} className="flex items-center">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a href="#" className="text-primary-600 hover:text-primary-800 text-sm flex items-center justify-center">
                <User className="h-4 w-4 mr-1" />
                View All Members
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;