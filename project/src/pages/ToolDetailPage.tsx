import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ExternalLink, BookmarkPlus, BookmarkCheck, ThumbsUp, MessageCircle, Award, DollarSign, Clock, ArrowLeft, ChevronDown, ChevronUp, Globe, Mail, BookOpen } from 'lucide-react';
import { mockTools } from '../data/mockData';
import { Tool } from '../types/Tool';

const ToolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expanded, setExpanded] = useState<string[]>(['description']);
  
  useEffect(() => {
    // In a real app, we would fetch this data from an API
    const foundTool = mockTools.find(t => t.id === id);
    if (foundTool) {
      setTool(foundTool);
    }
    // We would also check if this tool is in the user's saved list
  }, [id]);
  
  if (!tool) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Tool not found</h2>
        <p className="mb-6">The tool you're looking for doesn't exist or has been removed.</p>
        <Link to="/tools" className="btn btn-primary">
          Back to Tools
        </Link>
      </div>
    );
  }
  
  const toggleSaved = () => {
    setIsSaved(!isSaved);
    // In a real app, we would save this to the user's account
  };
  
  const toggleSection = (section: string) => {
    if (expanded.includes(section)) {
      setExpanded(expanded.filter(s => s !== section));
    } else {
      setExpanded([...expanded, section]);
    }
  };
  
  const isExpanded = (section: string) => expanded.includes(section);
  
  const getPriceStyle = () => {
    return tool.price.includes('Free') ? 'pricing-badge-free' : 'pricing-badge-paid';
  };
  
  const getDifficultyColor = () => {
    switch (tool.difficulty) {
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

  return (
    <div>
      {/* Hero section with tool info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-10">
        <div className="container-custom">
          <Link to="/tools" className="inline-flex items-center text-primary-100 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tools
          </Link>
          
          <div className="flex flex-col md:flex-row items-start">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            
            <div className="md:w-2/3">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`pricing-badge ${getPriceStyle()}`}>{tool.price}</span>
                <span className={`tool-difficulty ${getDifficultyColor()} flex items-center`}>
                  <Award className="h-4 w-4 mr-1" />
                  {tool.difficulty}
                </span>
                <span className="flex items-center text-yellow-300">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span>{tool.rating}</span>
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{tool.name}</h1>
              
              <p className="text-xl text-primary-100 mb-6">
                {tool.tagline || "Transform your teaching with this powerful AI tool"}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {tool.subjects.map((subject, index) => (
                  <span key={index} className="filter-badge bg-white/10 text-white">
                    {subject}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <a
                  href={tool.website || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 flex items-center"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
                
                <button
                  onClick={toggleSaved}
                  className="btn btn-outline bg-transparent border-white text-white hover:bg-white/10 flex items-center"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-5 w-5 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-5 w-5 mr-2" />
                      Save for Later
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="container-custom">
          <div className="flex overflow-x-auto py-2 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'overview' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'guide' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Implementation Guide
            </button>
            
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'examples' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Classroom Examples
            </button>
            
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'reviews' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Teacher Reviews
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container-custom py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - main content */}
          <div className="lg:w-2/3">
            {activeTab === 'overview' && (
              <div>
                <div className="card p-6 mb-6">
                  <button
                    onClick={() => toggleSection('description')}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <h2 className="text-2xl font-semibold">Description</h2>
                    {isExpanded('description') ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {isExpanded('description') && (
                    <div className="mt-4 text-gray-700">
                      <p className="mb-4">{tool.description}</p>
                      <p>
                        This powerful AI tool is designed specifically for educational settings,
                        helping teachers save time and provide better learning experiences.
                        It integrates seamlessly with common educational platforms and provides
                        a user-friendly interface that's easy to learn and implement.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="card p-6 mb-6">
                  <button
                    onClick={() => toggleSection('features')}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <h2 className="text-2xl font-semibold">Key Features</h2>
                    {isExpanded('features') ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {isExpanded('features') && (
                    <div className="mt-4">
                      <ul className="space-y-4">
                        <li className="flex">
                          <div className="bg-primary-100 rounded-full p-1 mr-3 mt-1">
                            <div className="bg-primary-600 rounded-full w-2 h-2"></div>
                          </div>
                          <div>
                            <h3 className="font-medium">Personalized Learning</h3>
                            <p className="text-gray-600">
                              Creates customized learning paths based on individual student needs
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="bg-primary-100 rounded-full p-1 mr-3 mt-1">
                            <div className="bg-primary-600 rounded-full w-2 h-2"></div>
                          </div>
                          <div>
                            <h3 className="font-medium">Real-time Feedback</h3>
                            <p className="text-gray-600">
                              Provides immediate feedback on student work to improve learning outcomes
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="bg-primary-100 rounded-full p-1 mr-3 mt-1">
                            <div className="bg-primary-600 rounded-full w-2 h-2"></div>
                          </div>
                          <div>
                            <h3 className="font-medium">Time-saving Automation</h3>
                            <p className="text-gray-600">
                              Automates routine tasks like grading and assessment creation
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="bg-primary-100 rounded-full p-1 mr-3 mt-1">
                            <div className="bg-primary-600 rounded-full w-2 h-2"></div>
                          </div>
                          <div>
                            <h3 className="font-medium">Data-driven Insights</h3>
                            <p className="text-gray-600">
                              Analyzes student performance to help identify areas needing improvement
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="card p-6">
                  <button
                    onClick={() => toggleSection('requirements')}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <h2 className="text-2xl font-semibold">Technical Requirements</h2>
                    {isExpanded('requirements') ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {isExpanded('requirements') && (
                    <div className="mt-4">
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center">
                          <div className="bg-gray-100 rounded-full p-1 mr-3">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>Internet connection required</span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-gray-100 rounded-full p-1 mr-3">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>Works on any modern web browser</span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-gray-100 rounded-full p-1 mr-3">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>Mobile apps available for iOS and Android</span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-gray-100 rounded-full p-1 mr-3">
                            <Globe className="h-4 w-4 text-gray-500" />
                          </div>
                          <span>School email address required for educational pricing</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'guide' && (
              <div className="card p-6">
                <h2 className="text-2xl font-semibold mb-6">Implementation Guide</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                        <span className="text-primary-600 font-semibold">1</span>
                      </div>
                      Getting Started
                    </h3>
                    <div className="ml-10">
                      <p className="text-gray-700 mb-4">
                        Begin by creating an account using your school email. 
                        This ensures you get access to educational pricing and features.
                      </p>
                      <img
                        src="https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg"
                        alt="Getting Started Screenshot"
                        className="rounded-lg shadow-sm w-full max-w-lg mb-4"
                      />
                      <ul className="list-disc ml-6 text-gray-700 space-y-2">
                        <li>Navigate to the sign-up page</li>
                        <li>Enter your school email address</li>
                        <li>Create a secure password</li>
                        <li>Complete your profile with your subject area and grade levels</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                        <span className="text-primary-600 font-semibold">2</span>
                      </div>
                      Setting Up Your Classroom
                    </h3>
                    <div className="ml-10">
                      <p className="text-gray-700 mb-4">
                        Create virtual classrooms for each of your classes. This helps organize 
                        content and track student progress more effectively.
                      </p>
                      <ul className="list-disc ml-6 text-gray-700 space-y-2">
                        <li>Click on "Create New Classroom" from your dashboard</li>
                        <li>Enter class name, subject, and grade level</li>
                        <li>Invite students using email addresses or class codes</li>
                        <li>Set up permission levels for student access</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                        <span className="text-primary-600 font-semibold">3</span>
                      </div>
                      Creating Your First Activity
                    </h3>
                    <div className="ml-10">
                      <p className="text-gray-700 mb-4">
                        Start with a simple activity to get familiar with the tool's features and capabilities.
                      </p>
                      <img
                        src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg"
                        alt="Creating Activity Screenshot"
                        className="rounded-lg shadow-sm w-full max-w-lg mb-4"
                      />
                      <ul className="list-disc ml-6 text-gray-700 space-y-2">
                        <li>Select "Create Activity" from your classroom dashboard</li>
                        <li>Choose from templates or start from scratch</li>
                        <li>Add content, questions, or interactive elements</li>
                        <li>Set learning objectives and success criteria</li>
                        <li>Save and publish to your classroom</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                        <span className="text-primary-600 font-semibold">4</span>
                      </div>
                      Monitoring Student Progress
                    </h3>
                    <div className="ml-10">
                      <p className="text-gray-700 mb-4">
                        Use the analytics dashboard to track student engagement and progress.
                      </p>
                      <ul className="list-disc ml-6 text-gray-700 space-y-2">
                        <li>Access the "Progress" tab within each classroom</li>
                        <li>View individual and class-wide performance metrics</li>
                        <li>Identify struggling students and concepts that need reinforcement</li>
                        <li>Generate reports for parent-teacher conferences or administrative reviews</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'examples' && (
              <div className="card p-6">
                <h2 className="text-2xl font-semibold mb-6">Classroom Examples</h2>
                
                <div className="space-y-8">
                  <div className="border-l-4 border-primary-500 pl-4">
                    <h3 className="text-xl font-medium mb-2">Elementary Math: Fractions Unit</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-4">Grade 3-5</span>
                      <span>Submitted by Maria Garcia</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      I used this tool to create an interactive fractions unit that adapts to each 
                      student's understanding. The AI identifies when students struggle with specific 
                      concepts and provides additional practice.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Implementation Steps:</h4>
                      <ol className="list-decimal ml-5 text-gray-700 space-y-1">
                        <li>Created a diagnostic pre-assessment to gauge prior knowledge</li>
                        <li>Set up personalized learning paths based on assessment results</li>
                        <li>Scheduled regular check-ins for students to demonstrate understanding</li>
                        <li>Used the data insights to form small groups for targeted instruction</li>
                      </ol>
                    </div>
                    <p className="text-gray-700">
                      The results were impressive - students showed 28% more improvement compared 
                      to my previous approach, and I saved about 5 hours per week on assessment.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-secondary-500 pl-4">
                    <h3 className="text-xl font-medium mb-2">High School English: Essay Feedback</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-4">Grade 9-12</span>
                      <span>Submitted by James Wilson</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      I implemented this tool to provide immediate feedback on student essays, 
                      focusing on structure, argumentation, and evidence use. Students submit 
                      drafts and receive AI-generated suggestions before teacher review.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Implementation Steps:</h4>
                      <ol className="list-decimal ml-5 text-gray-700 space-y-1">
                        <li>Created a rubric within the platform aligned to course standards</li>
                        <li>Trained students on how to interpret and apply AI feedback</li>
                        <li>Established a multi-draft submission process with AI as first reviewer</li>
                        <li>Reserved my time for higher-level feedback on content and ideas</li>
                      </ol>
                    </div>
                    <img
                      src="https://images.pexels.com/photos/4050312/pexels-photo-4050312.jpeg"
                      alt="Essay Feedback Example"
                      className="rounded-lg shadow-sm w-full mb-4"
                    />
                    <p className="text-gray-700">
                      Students now submit stronger initial drafts, allowing me to focus on deeper 
                      content issues rather than mechanical errors. Parents have noted improvement 
                      in writing skills across other subjects as well.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-accent-500 pl-4">
                    <h3 className="text-xl font-medium mb-2">Middle School Science: Interactive Labs</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-4">Grade 6-8</span>
                      <span>Submitted by Aisha Johnson</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      I used this tool to create virtual science labs that would otherwise be 
                      impossible due to budget or safety constraints. Students can manipulate 
                      variables and see real-time results.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Implementation Steps:</h4>
                      <ol className="list-decimal ml-5 text-gray-700 space-y-1">
                        <li>Selected virtual labs that aligned with curriculum objectives</li>
                        <li>Created guided inquiry questions for each experiment</li>
                        <li>Designed pre and post assessments to measure learning</li>
                        <li>Paired virtual labs with hands-on components when possible</li>
                      </ol>
                    </div>
                    <p className="text-gray-700">
                      Student engagement increased dramatically, and concept retention improved. 
                      The virtual labs allowed students to repeat experiments multiple times, 
                      reinforcing the scientific method in ways not possible with traditional labs.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <div className="card p-6 mb-6">
                  <h2 className="text-2xl font-semibold mb-6">Teacher Reviews</h2>
                  
                  <div className="flex items-center mb-6">
                    <div className="flex items-center mr-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-6 w-6 ${i < Math.floor(tool.rating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-xl font-semibold">{tool.rating}</span>
                    </div>
                    <span className="text-gray-500">Based on 48 reviews</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <span className="w-32 text-sm">5 stars</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="w-12 text-right text-sm">70%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 text-sm">4 stars</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="w-12 text-right text-sm">20%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 text-sm">3 stars</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                      <span className="w-12 text-right text-sm">8%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 text-sm">2 stars</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '2%' }}></div>
                      </div>
                      <span className="w-12 text-right text-sm">2%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 text-sm">1 star</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <span className="w-12 text-right text-sm">0%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="card p-6">
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <img 
                          src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg" 
                          alt="Sarah J."
                          className="h-12 w-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-gray-500">Math Teacher, Grades 9-12</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Transformed My Math Classroom</h3>
                    <p className="text-gray-700 mb-4">
                      This tool has completely changed how I teach calculus concepts. The 
                      visualization tools make abstract concepts tangible, and the practice 
                      generator creates unlimited problems tailored to each student's level.
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>2 months ago</span>
                      <span className="mx-2">•</span>
                      <button className="flex items-center text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful (24)
                      </button>
                    </div>
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <img 
                          src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
                          alt="Michael T."
                          className="h-12 w-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <p className="font-medium">Michael Thompson</p>
                          <p className="text-sm text-gray-500">English Teacher, Middle School</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                        <Star className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Great for Writing Instruction</h3>
                    <p className="text-gray-700 mb-4">
                      I've been using this with my 7th graders to improve their essay writing. 
                      The feedback is detailed and specific, and students appreciate getting 
                      immediate suggestions before submitting to me. The only downside is that 
                      the interface took some time for students to learn.
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>3 months ago</span>
                      <span className="mx-2">•</span>
                      <button className="flex items-center text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful (16)
                      </button>
                    </div>
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <img 
                          src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg" 
                          alt="Jessica L."
                          className="h-12 w-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <p className="font-medium">Jessica Lee</p>
                          <p className="text-sm text-gray-500">Science Teacher, High School</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Amazing Virtual Labs</h3>
                    <p className="text-gray-700 mb-4">
                      The virtual labs are incredibly realistic and allow my students to perform 
                      experiments that would be impossible in our school lab due to safety or budget 
                      constraints. The data analysis tools are particularly impressive, helping 
                      students see patterns and draw conclusions.
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>1 month ago</span>
                      <span className="mx-2">•</span>
                      <button className="flex items-center text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful (32)
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <button className="btn btn-outline">Load More Reviews</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - sidebar */}
          <div className="lg:w-1/3">
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Tool Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full p-2 mr-3">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pricing</p>
                    <p className="text-gray-600">{tool.price}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full p-2 mr-3">
                    <Award className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Difficulty</p>
                    <p className="text-gray-600">{tool.difficulty}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full p-2 mr-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Setup Time</p>
                    <p className="text-gray-600">Approximately 30 minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-full p-2 mr-3">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Platform</p>
                    <p className="text-gray-600">Web, iOS, Android</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Subject Compatibility</h3>
              
              <div className="space-y-2">
                {tool.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      ></div>
                    </div>
                    <span className="text-sm whitespace-nowrap">{subject}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Support Resources</h3>
              
              <ul className="space-y-3">
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Getting Started Guide
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Video Tutorials
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Community Forum
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-primary-600 hover:text-primary-800"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailPage;