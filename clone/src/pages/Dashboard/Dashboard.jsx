//Dashboard.jsx
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Menu, ChevronRight, ChevronLeft, X } from 'lucide-react';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [summary, setSummary] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isSummaryPopupOpen, setIsSummaryPopupOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]); // Add this line
  // Stable callback for setting follow-up questions
  const stableSetFollowUpQuestions = useCallback((questions) => {
    setFollowUpQuestions(questions);
  }, []); // Empty dependency array ensures stability

  // Stable callback for setting summary
  const stableSsetSummary = useCallback((summaryText) => {
    setSummary(summaryText);
  }, []);

  // Callback to close summary popup
  const handleCloseSummary = useCallback(() => {
    setIsSummaryPopupOpen(false);
  }, []);

  // Responsive breakpoint management
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      setIsSidebarOpen(!mobile);
    };

    // Check initial screen size
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDocumentSelect = (doc) => {
    if (doc) {
      setSelectedDocument(doc);
      setSummary(doc.summary || 'No summary available');
      setFollowUpQuestions(doc.follow_up_questions || []);
      setIsSummaryPopupOpen(true);

      // On mobile, close sidebar after selection
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } else {
      console.error('No document selected');
    }
  };

  const handleNewChat = () => {
    // Reset relevant states
    setSelectedChat(null);
    setSelectedDocument(null);
    setSummary('');
    setFollowUpQuestions([]);
    setSelectedDocuments([]);
    
    // Optionally, you can add more reset logic here
  };
  // Add a method to handle sending messages
   const handleSendMessage = async (message, documents) => {
    // Placeholder for message sending logic
    console.log('Sending message:', message);
    console.log('With documents:', documents);
    // Implement your actual message sending logic here
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      <Header />
      
      <div className="flex flex-1 relative ">
        {/* Mobile Overlay for Sidebar */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`
            fixed z-50 
            top-20  
            text-white p-2 
            ${isMobile 
              ? 'left-0 rounded-r-lg' 
              : isSidebarOpen 
                ? 'left-[330px] rounded-l-none' 
                : 'left-0 rounded-r-lg'}
            shadow-lg
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500
            hover:opacity-90
          `}
          aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? 
            (isMobile ? <X size={24} /> : <ChevronLeft size={24} className="text-gray-300" />) : 
            <Menu size={24} />
          }
        </button>

        {/* Responsive Layout Container */}
        <div className="flex flex-1 overflow-hidden w-full ">
          <Sidebar
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onSelectChat={setSelectedChat}
            onDocumentSelect={handleDocumentSelect}
            onClose={() => setIsSidebarOpen(false)}
            onSendMessage={handleSendMessage}
            setSelectedDocuments={setSelectedDocuments}
            selectedDocuments={selectedDocuments}
            onToggle={toggleSidebar}
            onNewChat={handleNewChat}
          />
          
          {/* Centered Main Content Container */}
          <div 
            className={`
              flex-1 
              flex 
              justify-center 
              w-full 
              overflow-hidden
              transition-all 
              duration-300 
              ease-in-out 
              ${!isMobile && isSidebarOpen 
                ? 'pl-0 max-w-[calc(100%-330px)]' 
                : 'pl-0 max-w-full'
              }
            `}
          >
            <div 
              className={`
                w-full 
                max-w-4xl 
                transition-all 
                duration-300 
                ease-in-out 
                ${!isMobile && isSidebarOpen 
                  ? 'ml-0 w-[90%]' 
                  : 'ml-0 w-full'
                }
              `}
            >
              <MainContent
                selectedChat={selectedChat}
                selectedDocument={selectedDocument}
                summary={summary}
                followUpQuestions={followUpQuestions}
                isSummaryPopupOpen={isSummaryPopupOpen}
                onCloseSummary={handleCloseSummary}
                setSummary={stableSsetSummary}
                setFollowUpQuestions={stableSetFollowUpQuestions}
                setIsSummaryPopupOpen={setIsSummaryPopupOpen}
                isMobile={isMobile}
                setSelectedDocuments={setSelectedDocuments}
                selectedDocuments={selectedDocuments}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
};

export default Dashboard;