import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Twitter, Facebook, Instagram, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const resources = [
    { name: 'Getting Started', href: '/about#getting-started' },
    { name: 'AI Basics for Teachers', href: '/about#ai-basics' },
    { name: 'Tutorials', href: '/about#tutorials' },
    { name: 'FAQ', href: '/about#faq' },
  ];
  
  const company = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/about#contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ];
  
  const social = [
    { name: 'Twitter', href: '#', icon: <Twitter className="h-5 w-5" /> },
    { name: 'Facebook', href: '#', icon: <Facebook className="h-5 w-5" /> },
    { name: 'Instagram', href: '#', icon: <Instagram className="h-5 w-5" /> },
    { name: 'LinkedIn', href: '#', icon: <Linkedin className="h-5 w-5" /> },
    { name: 'GitHub', href: '#', icon: <Github className="h-5 w-5" /> },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand section */}
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">EduAI Guide</span>
            </Link>
            <p className="mt-4 text-gray-400 max-w-xs">
              Helping teachers discover, evaluate, and implement AI tools in their classrooms with confidence.
            </p>
            
            <div className="mt-6">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Subscribe to our newsletter</h3>
              <form className="mt-2 flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 w-full rounded-l-lg bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-lg">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-2">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-gray-400 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              {company.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-gray-400 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Social links */}
          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase">Connect with us</h3>
            <div className="mt-4 flex space-x-4">
              {social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  {item.icon}
                </a>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Contact Us</h3>
              <a href="mailto:info@eduaiguide.com" className="mt-2 flex items-center text-gray-400 hover:text-white">
                <Mail className="h-5 w-5 mr-2" />
                info@eduaiguide.com
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            &copy; {currentYear} EduAI Guide. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;