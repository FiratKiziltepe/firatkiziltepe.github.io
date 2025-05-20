import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Bookmark, User, BookOpen, MessageCircle, Info } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Tools', href: '/tools', icon: <Search className="h-5 w-5" /> },
    { name: 'Dashboard', href: '/dashboard', icon: <Bookmark className="h-5 w-5" /> },
    { name: 'Community', href: '/community', icon: <MessageCircle className="h-5 w-5" /> },
    { name: 'About', href: '/about', icon: <Info className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-gradient-to-r from-primary-600 to-primary-800 py-4'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className={`flex items-center space-x-2 ${
              isScrolled ? 'text-primary-600' : 'text-white'
            }`}
          >
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">EduAI Guide</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 font-medium transition-colors ${
                  location.pathname === item.href
                    ? isScrolled
                      ? 'text-primary-600'
                      : 'text-white font-semibold'
                    : isScrolled
                    ? 'text-gray-700 hover:text-primary-600'
                    : 'text-primary-100 hover:text-white'
                }`}
              >
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              className={`flex items-center space-x-1 ${
                isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-primary-100 hover:text-white'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </button>
            <button
              className={
                isScrolled
                  ? 'btn btn-primary'
                  : 'bg-white text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-medium'
              }
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 animate-slide-down">
            <nav className="flex flex-col space-y-4 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 p-2 rounded-lg font-medium ${
                    location.pathname === item.href
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <button className="btn btn-outline w-full">Sign In</button>
                <button className="btn btn-primary w-full">Sign Up</button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;