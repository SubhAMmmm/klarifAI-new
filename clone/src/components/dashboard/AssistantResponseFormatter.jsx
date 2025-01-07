/* eslint-disable no-unused-vars */
import React from 'react';
import { Bot, ExternalLink, Info } from 'lucide-react';

const AssistantResponseFormatter = ({ 
  content, 
  citations = [],
  isLoading = false 
}) => {
  // Process citations and replace placeholders with interactive elements
  const processContent = (rawContent) => {
    if (!rawContent) return null;
    
    let processedContent = rawContent;
    
    // Replace citation markers with interactive elements
    citations.forEach((citation, index) => {
      const citationMarker = `[${index + 1}]`;
      const citationElement = `
        <span class="inline-flex items-center group">
          <sup class="
            inline-flex
            items-center
            justify-center
            px-1.5
            py-0.5
            text-xs
            font-medium
            text-blue-300
            hover:text-blue-200
            cursor-help
            transition-colors
            ml-0.5
            mr-0.5
            relative
          ">
            ${citationMarker}
            <span class="
              invisible
              group-hover:visible
              absolute
              bottom-full
              left-1/2
              transform
              -translate-x-1/2
              mb-2
              px-3
              py-2
              text-sm
              font-normal
              text-white
              bg-gray-800
              rounded-lg
              shadow-lg
              w-64
              z-50
              break-words
              opacity-0
              group-hover:opacity-100
              transition-opacity
              duration-200
            ">
              <strong class="block text-blue-300 mb-1">Source:</strong>
              <span class="text-gray-300">${citation.source_file || 'Unknown'}</span>
              ${citation.page_number ? `<br/><strong class="text-blue-300">Page:</strong> ${citation.page_number}` : ''}
              ${citation.snippet ? `<br/><em class="block mt-1 text-gray-400">"${citation.snippet}"</em>` : ''}
            </span>
          </sup>
        </span>
      `;
      
      processedContent = processedContent.replace(
        new RegExp(`\\[${index + 1}\\]`, 'g'),
        citationElement
      );
    });

    // Add special formatting for key points and lists
    processedContent = processedContent
      // Format bullet points
      .replace(
        /• (.*?)(?=(?:• |$))/g,
        '<div class="flex items-start space-x-3 mb-3"><div class="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div><div class="flex-1">$1</div></div>'
      )
      // Format numbered lists
      .replace(
        /(\d+\.) (.*?)(?=(?:\d+\. |$))/g,
        '<div class="flex items-start space-x-3 mb-3"><span class="text-blue-400 font-medium">$1</span><div class="flex-1">$2</div></div>'
      )
      // Format key phrases in bold
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      )
      // Format code snippets
      .replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 bg-gray-800 rounded text-blue-300 font-mono text-sm">$1</code>'
      );

    return processedContent;
  };

  return (
    <div className="relative">
      {/* Assistant Header */}
      <div className="flex items-center mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 mr-3">
          <Bot className="w-5 h-5 text-blue-400" />
        </div>
        <span className="font-medium text-white">Assistant</span>
      </div>

      {/* Main Content */}
      <div className="space-y-4 text-gray-300 leading-relaxed">
        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: processContent(content) }}
            className="prose prose-invert max-w-none"
          />
        )}
      </div>

      {/* Citations Section */}
      {citations && citations.length > 0 && (
        <div className="mt-4 border-t border-gray-700/50 pt-4">
          <div className="flex items-center text-sm text-gray-400 mb-2">
            <Info className="w-4 h-4 mr-2" />
            <span>Sources Referenced</span>
          </div>
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <div
                key={index}
                className="flex items-start p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-blue-400 font-medium mr-2">[{index + 1}]</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{citation.source_file}</p>
                  {citation.snippet && (
                    <p className="text-sm text-gray-400 mt-1 italic">"{citation.snippet}"</p>
                  )}
                </div>
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantResponseFormatter;