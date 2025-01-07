// DocumentViewer.jsx
/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';

const DocumentViewer = ({ citation, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-2">Document: {citation.source_file}</h2>
        <p className="mb-2">Page: {citation.page_number}</p>
        <p className="mb-4">{citation.snippet}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

DocumentViewer.propTypes = {
  citation: PropTypes.shape({
    source_file: PropTypes.string.isRequired,
    page_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    snippet: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DocumentViewer;