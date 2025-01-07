//LandingPage.jsx
/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../assets/Logo1.png';
import Header from './dashboard/Header';
import brandscapesLogo from '../assets/brand-scarpes-logo.png';
import { 
  FileSearch, 
  Lightbulb, 
  Network, 
  Database,
  ArrowRight
} from 'lucide-react';

const features = [
    {
      title: 'Document Q&A',
      icon: FileSearch,
      description: 'Upload and chat with your documents to get instant summaries, accurate answers, and key insights, powered by AI.',
      path: '/dashboard',
      actionText: 'Chat with Docs' 
    },
    {
      title: 'Idea Generation',
      icon: Lightbulb,
      description: 'Generate creative ideas, images and solutions using advanced AI brainstorming techniques.',
      path: '/idea-generation',
      actionText: 'Generate Ideas'
    },
    {
      title: 'Topic Modeling',
      icon: Network,
      description: 'A smart data analysis tool that extracts topics and provides natural language insights.',
      path: '/topic-modeling',
      actionText: 'Analyze Topics'
    },
    {
      title: 'Structured Data Query',
      icon: Database,
      description: 'Transform natural language into precise SQL queries, enabling intuitive data exploration without complex database syntax.',
      path: '/structured-data-query',
      actionText: 'Start Querying'
    }
  ];

const FeatureCard = ({ title, Icon, description, path, actionText }) => {
    const navigate = useNavigate();

      const handleNavigation = () => {
        if (path.startsWith('http://') || path.startsWith('https://')) {
          window.location.href = path;
        } else {
          navigate(path);
        }
      };

  return (
    <div 
      className="group relative bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-900 cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      onClick={handleNavigation}
      onKeyDown={(e) => e.key === 'Enter' && handleNavigation()}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzJCMzU5NSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex flex-col items-center text-center space-y-3">
        <div className="p-2 bg-gray-800 rounded-full group-hover:bg-blue-900/20 transition-colors duration-300">
          <Icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
        <button 
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-colors duration-300"
          aria-label={`${actionText} - ${title}`}
        >
           {actionText}
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A1A] relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2B3595]/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0iIzJCMzU5NSIgZmlsbC1vcGFjaXT59PSIwLjEiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />

      <Header />
      {/* Content area with padding bottom to account for footer */}
      <div className="flex-1 flex flex-col pb-16 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
          <header className="text-center space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-100 tracking-tight flex items-center justify-center">
              {/* Welcome to <img 
                src={logo} 
                alt="Logo" 
                className="h-12 w-auto transition-transform hover:scale-105 ml-2"
              />
               */}
               Welcome to KLARFai !
            </h1>
            <h2 className="text-lg md:text-xl text-gray-400">
            GPT-Powered Insights Activator
            </h2>
          </header>

          <main className="flex-1 flex items-center">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
              {features.map((feature) => (
                <FeatureCard
                key={feature.title}
                title={feature.title}
                Icon={feature.icon}
                description={feature.description}
                path={feature.path}
                actionText={feature.actionText}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
            <span className="text-gray-300 text-lg font-semibold">Powered By</span>
            <div className="flex items-center">
              <img
                src={brandscapesLogo}
                alt="BrandScapes Worldwide Logo"
                className="h-6 w-auto object-contain transition-transform hover:scale-105"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

FeatureCard.propTypes = {
  title: PropTypes.string.isRequired,
  Icon: PropTypes.elementType.isRequired,
  description: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  actionText: PropTypes.string.isRequired
};

export default LandingPage;