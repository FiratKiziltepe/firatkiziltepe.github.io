import React from 'react';
import { BookOpen, Users, Award, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About EduAI Guide
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Our mission is to empower educators with the knowledge and tools to effectively implement AI in the classroom.
            </p>
          </div>
        </div>
      </section>
      
      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg mx-auto">
              <p>
                EduAI Guide was born from a simple observation: while AI tools were rapidly entering the education space, 
                teachers lacked a centralized, trustworthy resource to help them navigate this new landscape.
              </p>
              <p>
                Founded in 2024 by a team of educators and technologists, we set out to create a platform that would bridge 
                the gap between powerful AI innovations and classroom implementation. Our goal was to make AI accessible to 
                all educators, regardless of their technical background or comfort level with technology.
              </p>
              <p>
                Today, EduAI Guide serves thousands of teachers worldwide, providing curated resources, detailed guides, 
                and a supportive community. We believe that AI, when thoughtfully implemented, can enhance teaching and 
                learning while freeing educators to focus on what they do best: inspiring and connecting with students.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Educational Focus</h3>
              <p className="text-gray-600">
                We prioritize pedagogy over technology, ensuring that AI serves meaningful educational purposes.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-6">
                <Users className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Inclusivity</h3>
              <p className="text-gray-600">
                We believe AI tools should be accessible to all educators and serve diverse student populations.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-full mb-6">
                <Award className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality</h3>
              <p className="text-gray-600">
                We maintain high standards for the tools we feature, ensuring they deliver real educational value.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-6">
                <MessageCircle className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community</h3>
              <p className="text-gray-600">
                We foster collaboration and knowledge sharing among educators to drive innovation in AI education.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="py-20 bg-white" id="faq">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-2">Is EduAI Guide affiliated with any AI companies?</h3>
                <p className="text-gray-700">
                  No, we maintain editorial independence to provide unbiased reviews and recommendations. 
                  While some tools may offer affiliate programs, this never influences our ratings or inclusion criteria.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-2">How do you evaluate AI tools?</h3>
                <p className="text-gray-700">
                  Our evaluation process includes hands-on testing by educators, assessment against pedagogical frameworks, 
                  privacy and data security reviews, and feedback from our teacher community. Tools are regularly reassessed 
                  as they evolve.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-2">Do I need technical expertise to use the recommended tools?</h3>
                <p className="text-gray-700">
                  Not at all! We categorize tools by difficulty level and provide detailed implementation guides. Many tools 
                  are designed for educators without technical backgrounds, and our step-by-step tutorials make adoption straightforward.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-2">How can I suggest a tool to be included?</h3>
                <p className="text-gray-700">
                  We welcome suggestions! You can submit tool recommendations through our contact form or in the community forum. 
                  Our review team evaluates all submissions against our quality and educational value criteria.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-2">Is EduAI Guide available in languages other than English?</h3>
                <p className="text-gray-700">
                  We're currently focused on English content, but we plan to expand to additional languages in the future. 
                  We do feature tools that support multiple languages and highlight this in our reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Getting Started */}
      <section className="py-20 bg-primary-50" id="getting-started">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Getting Started with AI in Education</h2>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-8">
                <p className="text-lg mb-6">
                  New to using AI in your classroom? Follow these steps to begin your journey:
                </p>
                
                <ol className="space-y-6">
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold text-lg mr-4">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Explore Basic Concepts</h3>
                      <p className="text-gray-700">
                        Start with our <Link to="/about#ai-basics" className="text-primary-600 hover:text-primary-800">AI Basics for Teachers</Link> guide 
                        to understand foundational concepts and terminology.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold text-lg mr-4">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Find Tools for Your Needs</h3>
                      <p className="text-gray-700">
                        Use our <Link to="/tools" className="text-primary-600 hover:text-primary-800">Tools Directory</Link> to 
                        discover AI applications filtered by your subject area and grade level. Start with tools marked "Beginner" 
                        for the easiest implementation.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold text-lg mr-4">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Learn from Examples</h3>
                      <p className="text-gray-700">
                        Review our collection of <Link to="/tools" className="text-primary-600 hover:text-primary-800">classroom examples</Link> to 
                        see how other educators have successfully implemented AI tools in similar contexts.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold text-lg mr-4">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Start Small and Iterate</h3>
                      <p className="text-gray-700">
                        Begin with a single tool and a specific use case. Our implementation guides provide step-by-step instructions 
                        to help you get started quickly.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold text-lg mr-4">
                      5
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Join the Community</h3>
                      <p className="text-gray-700">
                        Connect with other educators in our <Link to="/community" className="text-primary-600 hover:text-primary-800">Community Forum</Link> to 
                        share experiences, ask questions, and learn from peers.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="bg-primary-50 p-8 border-t border-primary-100">
                <h3 className="text-xl font-semibold mb-4">Ready to dive deeper?</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/tools" className="btn btn-primary">
                    Browse AI Tools
                  </Link>
                  <Link to="/about#tutorials" className="btn btn-outline">
                    View Tutorials
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Us */}
      <section className="py-20 bg-white" id="contact">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-12 text-center">Contact Us</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="card p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                  <Mail className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">
                  Questions, feedback, or suggestions? We'd love to hear from you.
                </p>
                <a href="mailto:info@eduaiguide.com" className="text-primary-600 hover:text-primary-800 font-medium">
                  info@eduaiguide.com
                </a>
              </div>
              
              <div className="card p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-full mb-4">
                  <Phone className="h-6 w-6 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">
                  Available Monday-Friday, 9am-5pm EST for phone support.
                </p>
                <a href="tel:+15551234567" className="text-primary-600 hover:text-primary-800 font-medium">
                  +1 (555) 123-4567
                </a>
              </div>
              
              <div className="card p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-100 rounded-full mb-4">
                  <MapPin className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Office</h3>
                <p className="text-gray-600 mb-4">
                  Our headquarters, where education meets innovation.
                </p>
                <address className="not-italic text-primary-600">
                  123 Tech Lane<br />
                  Boston, MA 02110
                </address>
              </div>
            </div>
            
            <div className="card p-8">
              <h3 className="text-2xl font-semibold mb-6">Send Us a Message</h3>
              
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-input"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="form-input"
                    placeholder="What is your message about?"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="form-input"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary px-8">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-600 to-accent-800 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Teaching with AI?
            </h2>
            <p className="text-xl mb-8">
              Explore our curated collection of AI tools and start implementing them in your classroom today.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tools" className="btn bg-white text-accent-700 hover:bg-accent-50 px-8 py-3 rounded-lg font-medium text-lg">
                Explore Tools Now
              </Link>
              <Link to="/community" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium text-lg">
                Join Our Community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;