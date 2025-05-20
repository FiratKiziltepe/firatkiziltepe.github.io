import React from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, MessageCircle, Award, BookmarkPlus, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockTools } from '../data/mockData';
import ToolCard from '../components/common/ToolCard';

const HomePage: React.FC = () => {
  // Featured tools - just take the top 3 rated tools
  const featuredTools = [...mockTools]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover the Perfect AI Tools for Your Classroom
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              A curated guide to help teachers navigate, evaluate, and implement AI technologies in education.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tools" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-medium text-lg">
                Explore AI Tools
              </Link>
              <Link to="/about" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium text-lg">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How EduAI Guide Helps Teachers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We simplify the process of finding and implementing the right AI tools for your specific teaching needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="card p-6 flex flex-col items-center text-center"
            >
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Tools</h3>
              <p className="text-gray-600">
                Find the perfect AI tools based on your subject, grade level, and specific teaching needs.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ y: -5 }}
              className="card p-6 flex flex-col items-center text-center"
            >
              <div className="bg-secondary-100 p-4 rounded-full mb-4">
                <Award className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Evaluate Quality</h3>
              <p className="text-gray-600">
                Compare tools based on ease of use, learning curve, and real teacher ratings.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ y: -5 }}
              className="card p-6 flex flex-col items-center text-center"
            >
              <div className="bg-accent-100 p-4 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Learn Applications</h3>
              <p className="text-gray-600">
                Access detailed guides and example scenarios for implementing tools in your classroom.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ y: -5 }}
              className="card p-6 flex flex-col items-center text-center"
            >
              <div className="bg-success-100 p-4 rounded-full mb-4">
                <MessageCircle className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Experiences</h3>
              <p className="text-gray-600">
                Connect with other educators and share your experiences using AI tools in the classroom.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Featured Tools Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured AI Tools</h2>
              <p className="text-gray-600 text-lg">Top-rated tools loved by educators</p>
            </div>
            <Link to="/tools" className="mt-4 md:mt-0 flex items-center text-primary-600 hover:text-primary-800 font-medium">
              View All Tools <ChevronRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTools.map((tool) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ToolCard tool={tool} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Teachers Are Saying</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from educators who have transformed their teaching with AI tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="mb-4 text-gray-700">
                "This platform helped me find the perfect AI tool for my math class. The detailed guides made implementation a breeze."
              </blockquote>
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
            </div>
            
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="mb-4 text-gray-700">
                "As a language arts teacher, finding tools to help with writing feedback was challenging until I discovered this site. Game changer!"
              </blockquote>
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
            </div>
            
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="mb-4 text-gray-700">
                "The community feature allowed me to connect with other science teachers and share how we're using AI in our labs. Invaluable resource!"
              </blockquote>
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
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-600 to-accent-800 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Classroom?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of educators discovering and implementing AI tools tailored for their teaching needs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tools" className="btn bg-white text-accent-700 hover:bg-accent-50 px-8 py-3 rounded-lg font-medium text-lg">
                Explore Tools Now
              </Link>
              <Link to="/about" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;