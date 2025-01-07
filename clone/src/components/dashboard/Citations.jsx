// // Citation.jsx
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import PropTypes from 'prop-types';
import DocumentViewer from './DocumentViewer';

const Citation = ({ citation, index }) => {
  const [showViewer, setShowViewer] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setShowViewer(true);
  };

  return (
    <>
      <a
        href="#"
        className="text-blue-400 hover:text-blue-300 underline"
        onClick={handleClick}
        data-tooltip-id={`tooltip-${index}`}
        data-tooltip-content={citation.snippet}
      >
        [citation{index + 1}]
      </a>
      <Tooltip 
        id={`tooltip-${index}`}
        place="top"
        style={{
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px',
          borderRadius: '8px',
          maxWidth: '300px',
          fontSize: '14px',
          lineHeight: '1.4',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
      />
      {showViewer && (
        <DocumentViewer 
          citation={citation} 
          onClose={() => setShowViewer(false)} 
        />
      )}
    </>
  );
};

Citation.propTypes = {
  citation: PropTypes.shape({
    source_file: PropTypes.string.isRequired,
    page_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    section_title: PropTypes.string,
    snippet: PropTypes.string.isRequired,
    document_id: PropTypes.string.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired
};

export default Citation;