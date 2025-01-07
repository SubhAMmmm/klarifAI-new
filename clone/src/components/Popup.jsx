// // Popup.jsx
// /* eslint-disable no-unused-vars */
// import React from 'react';
// import PropTypes from 'prop-types';

// const Popup = ({ title, content, onClose }) => {
//   return (
//     <div 
//       className="fixed inset-0 flex items-center justify-center 
//         bg-black bg-opacity-60 z-50 p-4"
//     >
//       <div 
//         className="bg-[#2c2c2c] rounded-xl shadow-2xl 
//         max-w-md w-full mx-auto transform 
//         transition-all duration-300 ease-in-out 
//         scale-100 hover:scale-105
//         ring-4 ring-[#5ff2b6]/30"
//       >
//         <div className="p-6">
//           <h2 
//             className="text-2xl font-bold mb-4 
//             text-[#5ff2b6] border-b border-[#5ff2b6]/30 pb-2"
//           >
//             {title}
//           </h2>
//           <p 
//             className="text-white text-base leading-relaxed 
//             tracking-wide mb-6"
//           >
//             {content}
//           </p>
//           <div className="flex justify-end">
//             <button 
//               onClick={onClose}
//               className="px-6 py-2 
//               bg-gradient-to-r from-[#3344dc] to-[#5ff2b6] 
//               text-white rounded-lg 
//               hover:opacity-90 transition-opacity 
//               focus:outline-none focus:ring-2 
//               focus:ring-[#5ff2b6]/50"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Popup.propTypes = {
//   title: PropTypes.string.isRequired,
//   content: PropTypes.string.isRequired,
//   onClose: PropTypes.func.isRequired,
// };

// export default Popup;
/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { Download, X } from 'lucide-react';
import { toast } from 'react-toastify';

const Popup = ({ 
  title, 
  content, 
  onClose, 
  onSave 
}) => {
  // Function to save summary to a text file
  const handleSaveSummary = () => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_summary.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Summary downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download summary');
      console.error('Save summary error:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto text-white">
          <div className="text-sm" dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button 
            onClick={handleSaveSummary}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Save Summary
          </button>
        </div>
      </div>
    </div>
  );
};

Popup.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default Popup;