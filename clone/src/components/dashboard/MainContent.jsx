
// 11-12-24
// MainContent.jsx
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import {
  Paperclip,
  Send,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import PropTypes from "prop-types";
import { documentService, chatService } from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import Popup from "../Popup";
import Citation from "../dashboard/Citations";
import Card from "../Card";
import { Tooltip } from "react-tooltip";
import EditableMessage from "./EditableMessage";
import SummaryFormatter from "./SummaryFormatter";

const MainContent = ({
  selectedChat,
  summary: propSummary,
  followUpQuestions: initialFollowUpQuestions,
  isSummaryPopupOpen,
  onCloseSummary,
  setSummary,
  setFollowUpQuestions,
  setIsSummaryPopupOpen,
  selectedDocuments: propSelectedDocuments,
  setSelectedDocuments,
}) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [currentFollowUpQuestions, setCurrentFollowUpQuestions] = useState([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isFollowUpQuestionsMinimized, setIsFollowUpQuestionsMinimized] =
    useState(false);
  const chatContainerRef = useRef(null);
  const [localSelectedDocuments, setLocalSelectedDocuments] = useState(
    propSelectedDocuments || [] // Initialize with prop value if provided
  );

  // New state for persistent summary
  const [persistentSummary, setPersistentSummary] = useState("");
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  // New state for view toggle
  const [currentView, setCurrentView] = useState("chat");
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  //  new state for document processing
  const [isDocumentProcessing, setIsDocumentProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});

  // Add a new Citation component for inline citations
  const InlineCitation = ({ citation, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <span
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <sup
          className="
          text-xs 
          text-blue-400 
          cursor-help 
          hover:underline 
          ml-0.5 
          transition-colors
        "
        >
          [{index + 1}]
        </sup>

        {isHovered && (
          <div
            className="
            absolute 
            z-50 
            bottom-full 
            left-1/2 
            transform 
            -translate-x-1/2 
            bg-gray-800 
            text-white 
            p-2 
            rounded-lg 
            shadow-lg 
            text-xs 
            w-64 
            pointer-events-none
            transition-all
            duration-300
            opacity-100
            animate-fade-in
          "
          >
            <div className="font-bold mb-1">Source Details</div>
            <div className="space-y-1">
              <p>
                <strong>Document:</strong> {citation.source_file}
              </p>
              <p>
                <strong>Page:</strong> {citation.page_number}
              </p>
              <div className="mt-1 text-gray-300 italic">
                {citation.snippet}
              </div>
            </div>
          </div>
        )}
      </span>
    );
  };

  InlineCitation.propTypes = {
    citation: PropTypes.shape({
      source_file: PropTypes.string,
      page_number: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.oneOf([null, undefined]),
      ]),
      snippet: PropTypes.string,
    }),
    index: PropTypes.number,
  };

  // New method to toggle between chat and summary views
  const toggleView = (view) => {
    setCurrentView(view);
  };

  // New method to copy summary to clipboard
  const copySummaryToClipboard = () => {
    if (persistentSummary) {
      // Create a temporary textarea to copy text
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = persistentSummary.replace(/<[^>]*>/g, ""); // Strip HTML tags
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextArea);

      toast.success("Summary copied to clipboard!");
    }
  };

  const renderSummaryView = () => {
    // If no documents are selected, show a placeholder
    if (localSelectedDocuments.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          No documents selected
        </div>
      );
    }

    // Render document selector if multiple documents are available
    const renderDocumentSelector = () => {
      if (localSelectedDocuments.length <= 1) return null;

      return (
        <select
          value={localSelectedDocuments[0]}
          onChange={(e) => {
            const newSelectedDocumentId = e.target.value;
            // Instead of replacing, keep all existing selected documents
            const updatedSelectedDocuments = [
              newSelectedDocumentId,
              ...localSelectedDocuments.filter(
                (id) => id !== newSelectedDocumentId
              ),
            ];
            updateSelectedDocuments(updatedSelectedDocuments);
          }}
          className="
          bg-gray-800/30
          text-[#5ff2b6] 
          rounded-lg 
          px-3 
          py-2 
          text-sm 
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-700/30
          border 
          border-blue-500/20
          max-w-[250px]
          truncate
          transition-all
          duration-300
          hover:bg-blue-800/30
          cursor-pointer
          relative z-10
        "
        >
          {localSelectedDocuments.map((docId) => {
            const doc = documents.find((d) => d.id.toString() === docId);
            return doc ? (
              <option
                key={docId}
                value={docId}
                className="
              bg-gray-900 
              text-[#5ff2b6] 
              hover:bg-blue-800 
              focus:bg-blue-900
              py-2
            "
              >
                {doc.filename}
              </option>
            ) : null;
          })}
        </select>
      );
    };

    const selectedDocumentId = localSelectedDocuments[0];

    // Check both existing documents and newly uploaded documents
    const selectedDocument =
      documents.find((doc) => doc.id.toString() === selectedDocumentId) ||
      // If not found in existing documents, create a document-like object from persistent summary
      (persistentSummary
        ? {
            id: selectedDocumentId,
            filename: "Uploaded Document",
            summary: persistentSummary,
          }
        : null);

    // If no document is found, show a placeholder
    if (!selectedDocument) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Document not found
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pt-16 bg-black flex flex-col overflow-hidden transition-all duration-300 ease-in-out ">
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div
              className="h-full flex flex-col 
                bg-gray-800/20 
                border 
                border-blue-500/10 
                rounded-3xl 
                shadow-2xl 
                overflow-hidden 
                ring-1 
                ring-blue-500/5
                backdrop-blur-sm
                transition-all
                duration-300"
            >
              {/* Header with Document Selector */}
              <div
                className="px-4 sm:px-6 py-3 sm:py-2
                  bg-gradient-to-r 
                  from-gray-800/30 
                  to-blue-900/20 
                  border-b 
                  border-blue-500/10 
                  flex 
                  justify-between 
                  items-center"
              >
                <div>
                  <h2 className="text-sm sm:text-xl font-bold text-white">
                    Document Summary
                  </h2>
                  <p className="text-sm text-blue-400 mt-1">
                    File: {selectedDocument.filename}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Document Selector */}
                  {renderDocumentSelector()}

                  <button
                    onClick={copySummaryToClipboard}
                    className="text-gray-300 hover:text-white 
                      transition-colors 
                      p-2 
                      rounded-full 
                      hover:bg-blue-500/20"
                    title="Copy Summary"
                  >
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Summary Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar  bg-gray-800/20">
                <SummaryFormatter content={selectedDocument.summary} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Update persistent summary when prop or popup summary changes
    if (propSummary) {
      setPersistentSummary(propSummary);
      setIsSummaryVisible(true);
    }
  }, [propSummary]);

  useEffect(() => {
    fetchUserDocuments();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      // Robust handling of selected chat
      const chatMessages = Array.isArray(selectedChat.messages)
        ? selectedChat.messages
        : [];
  
      // Ensure messages are sorted chronologically
      const sortedMessages = chatMessages.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
  
      // Create a new array with unique messages
      const uniqueMessages = Array.from(
        new Set(sortedMessages.map(JSON.stringify))
      ).map(JSON.parse);
  
      // Set conversation with unique messages
      setConversation(uniqueMessages);
  
      // Set summary with fallback
      setSummary(selectedChat.summary || "");
  
      // Ensure follow-up questions is an array
      const followUpQuestions = Array.isArray(selectedChat.follow_up_questions)
        ? selectedChat.follow_up_questions
        : selectedChat.follow_up_questions
        ? [selectedChat.follow_up_questions]
        : [];
  
      setCurrentFollowUpQuestions(followUpQuestions);
      setFollowUpQuestions(followUpQuestions);
  
      // Set conversation ID
      setConversationId(selectedChat.conversation_id);
  
      // Handle document selection
      if (
        selectedChat.selected_documents &&
        selectedChat.selected_documents.length > 0
      ) {
        const documentIds = selectedChat.selected_documents.map((doc) =>
          doc.toString()
        );
        setLocalSelectedDocuments(documentIds);
  
        if (setSelectedDocuments) {
          setSelectedDocuments(documentIds);
        }
      }
    }
  }, [selectedChat, setSummary, setSelectedDocuments, setFollowUpQuestions]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    // Sync local state with prop when prop changes
    if (propSelectedDocuments) {
      setLocalSelectedDocuments(propSelectedDocuments);
    }
  }, [propSelectedDocuments]);

  useEffect(() => {
    // When local state changes, update the prop
    if (setSelectedDocuments) {
      setSelectedDocuments(localSelectedDocuments);
    }
  }, [localSelectedDocuments, setSelectedDocuments]);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserDocuments = async () => {
    try {
      const response = await documentService.getUserDocuments();
      setDocuments(response.data);
    } catch (error) {
      toast.error("Failed to fetch documents");
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (!selectedFiles.length) return;

    setIsDocumentProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const simulateProgress = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          clearInterval(simulateProgress);
          return 90;
        });
      }, 500);

      const response = await documentService.uploadDocument(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProcessingProgress(Math.min(percentCompleted, 90));
        },
      });

      clearInterval(simulateProgress);

      const documents = response.data.documents || [];

      if (documents.length > 0) {
        // Automatically select all uploaded documents
        const newSelectedDocuments = documents.map((doc) => doc.id.toString());
        setLocalSelectedDocuments(newSelectedDocuments);

        if (setSelectedDocuments) {
          setSelectedDocuments(newSelectedDocuments);
        }

        // Smooth transition to Summary view
        setCurrentView("summary");

        // Collect all formatted summaries
        const allFormattedSummaries = documents.map((document) => {
          // Log document details
          console.log("Document:", document);

          // Attempt to set summary with fallback
          const summaryText =
            document.summary || document.text_summary || "No summary available";

          // Ensure follow-up questions is an array
          const followUpQuestions = Array.isArray(document.follow_up_questions)
            ? document.follow_up_questions
            : document.follow_up_questions
            ? [document.follow_up_questions]
            : [];

          // Format the summary in HTML
          return `
            <h3 class="text-lg font-bold text-white mb-2">Document: ${
              document.filename
            }</h3>
            <h4 class="text-md font-semibold text-blue-300 mb-2">Key Highlights</h4>
            <p class="text-gray-300 mb-4">${summaryText}</p>
            
            <h4 class="text-md font-semibold text-blue-300 mb-2">Questions to Ask</h4>
            <ul class="list-disc list-inside text-gray-300">
              ${followUpQuestions
                .map((question, index) => `<li>${question}</li>`)
                .join("")}
            </ul>
          `;
        });

        // Combine all summaries
        const combinedFormattedSummary = allFormattedSummaries.join(
          '<hr class="my-4 border-blue-500/20" />'
        );

        // Update summary and follow-up questions
        setSummary(combinedFormattedSummary);

        // Collect all follow-up questions
        const allFollowUpQuestions = documents.flatMap((document) =>
          Array.isArray(document.follow_up_questions)
            ? document.follow_up_questions
            : document.follow_up_questions
            ? [document.follow_up_questions]
            : []
        );

        setFollowUpQuestions(allFollowUpQuestions);
        setCurrentFollowUpQuestions(allFollowUpQuestions);

        // Attempt to set active document for the last uploaded document
        if (documents.length > 0) {
          try {
            documentService.setActiveDocument(
              documents[documents.length - 1].id
            );
          } catch (error) {
            console.error("Failed to set active document:", error);
          }
        }

        setIsSummaryPopupOpen(true);
        setPersistentSummary(combinedFormattedSummary);
        setIsSummaryVisible(true);

        // Update documents list
        setDocuments((prevDocs) => {
          const newDocs = documents.filter(
            (newDoc) =>
              !prevDocs.some((existingDoc) => existingDoc.id === newDoc.id)
          );
          return [...prevDocs, ...newDocs];
        });

        // Switch to summary view
        setCurrentView("summary");
        setIsDocumentProcessing(false);
        setProcessingProgress(100);

        // Toast notification
        toast.success(
          `${documents.length} document(s) uploaded and processed successfully!`
        );
      } else {
        toast.warning("No documents were processed. Please try again.");
      }
    } catch (error) {
      console.error("Full Error Object:", error);

      if (error.response) {
        console.error("Error Status:", error.response.status);
        console.error("Error Data:", error.response.data);

        toast.error(
          `Upload failed: ${
            error.response.data.error || "Unknown server error"
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        console.error("Error Message:", error.message);
        toast.error(`Upload error: ${error.message}`);
      }

      setIsDocumentProcessing(false);
    }
  };
  // Add a processing loader component
  const DocumentProcessingLoader = ({ progress }) => {
    const safeProgress =
      typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : 0;
    return (
      <div
        className="
        fixed 
        inset-0 
        z-[1000] 
        bg-black/80 
        backdrop-blur-sm 
        flex 
        flex-col 
        items-center 
        justify-center 
        space-y-6
      "
      >
        <div
          className="
          w-64 
          h-2 
          bg-gray-700 
          rounded-full 
          overflow-hidden
        "
        >
          <div
            className="
            h-full 
            bg-gradient-to-r 
            from-blue-500 
            to-green-500 
            transition-all 
            duration-300 
            ease-out
          "
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Processing Document
          </h2>
          <p className="text-gray-300">Analyzing and extracting insights...</p>
          <p className="text-sm text-gray-400 mt-2">
            {/* Use optional chaining and fallback */}
            {typeof safeProgress === "number"
              ? `${safeProgress.toFixed(0)}% complete`
              : "0% complete"}
          </p>
        </div>

        <div className="animate-pulse">
          <FileText
            className="
            h-16 
            w-16 
            text-blue-400 
            opacity-70
          "
          />
        </div>
      </div>
    );
  };

  // Comprehensive PropTypes validation
  DocumentProcessingLoader.propTypes = {
    progress: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,
  };

  // Default props to prevent errors
  DocumentProcessingLoader.defaultProps = {
    progress: 0,
  };
  // Method to toggle summary visibility
  const toggleSummaryVisibility = () => {
    setIsSummaryVisible((prev) => !prev);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) {
      return;
    }

    // Check if any documents are selected
    const documentsToSend =
      localSelectedDocuments.length > 0 ? localSelectedDocuments : [];

    // If no documents are selected, show a warning
    if (documentsToSend.length === 0) {
      toast.warning(
        "Please upload a document or select at least one document for your query."
      );
      return;
    }

    // Add user message to conversation
    const newConversation = [
      ...conversation,
      {
        role: "user",
        content: message,
      },
    ];
    setConversation(newConversation);

    setIsLoading(true);

    // Prepare request data
    const requestData = {
      message: message,
      conversation_id: conversationId,
      selected_documents: documentsToSend, // Pass selected documents
    };

    console.log("Sending request data:", requestData);

    try {
      const response = await chatService.sendMessage(requestData);

      const assistantMessage = {
        role: "assistant",
        content:
          response.response ||
          response.data?.response ||
          "No response received",
        citations: response.citations || response.data?.citations || [],
        follow_up_questions:
          response.follow_up_questions ||
          response.data?.follow_up_questions ||
          [],
      };

      // Update conversation and conversation ID
      setConversation((prev) => [...prev, assistantMessage]);
      const newConversationId =
        response.conversation_id ||
        response.data?.conversation_id ||
        conversationId;
      setConversationId(newConversationId);

      // Update follow-up questions
      const newFollowUpQuestions =
        response.follow_up_questions ||
        response.data?.follow_up_questions ||
        [];
      setCurrentFollowUpQuestions(newFollowUpQuestions);
      setFollowUpQuestions(newFollowUpQuestions);

      // Reset message input
      setMessage("");
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Failed to send message. Please try again.");
      setConversation((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  // Add a method to update selected documents
  const updateSelectedDocuments = (documents) => {
    // Validate input
    if (!Array.isArray(documents)) {
      console.error("updateSelectedDocuments expects an array of document IDs");
      return;
    }

    // Convert all document IDs to strings for consistency
    const documentIds = documents.map((doc) => doc.toString());

    // Update local state
    setLocalSelectedDocuments(documentIds);

    // Sync with parent component if prop exists
    if (setSelectedDocuments) {
      setSelectedDocuments(documentIds);
    }
  };
  const renderMessage = (msg) => {
    if (msg.role === "assistant") {
      const processCitationReferences = (content, citations) => {
        if (!citations || citations.length === 0) return content;

        let processedContent = content;

        // More robust regex to find citations, including variations
        const citationRegex = /\[(\d+)\]/g;
        const citationOccurrences = new Map();

        processedContent = processedContent.replace(
          citationRegex,
          (match, citationIndex) => {
            const index = parseInt(citationIndex) - 1;

            // Ensure valid citation index
            if (index >= 0 && index < citations.length) {
              // Track the number of times this specific citation has been used
              const occurrenceCount = (citationOccurrences.get(index) || 0) + 1;
              citationOccurrences.set(index, occurrenceCount);

              const citation = citations[index] || {};

              // Escape any special characters in the snippet to prevent XSS
              const safeSnippet = citation.snippet
                ? citation.snippet.replace(/"/g, "&quot;")
                : "No snippet available";

              return `
              <span 
                class="citation-inline-wrapper group inline-block" 
                data-tooltip-id="citation-tooltip-${index}"
                data-tooltip-content="${safeSnippet}"
              >
                <sup class="
                  text-xs 
                  text-blue-400 
                  cursor-help 
                  hover:underline 
                  ml-0.5 
                  transition-colors
                  group-hover:text-blue-300
                ">[${citationIndex}]</sup>
              </span>
            `;
            }

            // Return original match if citation can't be processed
            return match;
          }
        );

        return processedContent;
      };

      const processedContent = processCitationReferences(
        msg.content,
        msg.citations
      );

      return (
        <div className="flex flex-col space-y-2">
          <div
            className="text-sm relative citation-container"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Render tooltips */}
          {msg.citations &&
            msg.citations.map((citation, index) => (
              <Tooltip
                key={index}
                id={`citation-tooltip-${index}`}
                place="top"
                className="custom-tooltip"
              >
                <div className="font-bold mb-1">Source Details</div>
                <div className="space-y-1">
                  <p>
                    <strong>Document:</strong>{" "}
                    {citation.source_file || "Unknown"}
                  </p>
                  <p>
                    <strong>Page:</strong> {citation.page_number || "N/A"}
                  </p>
                  <div className="mt-1 text-gray-300 italic">
                    {citation.snippet || "No snippet available"}
                  </div>
                </div>
              </Tooltip>
            ))}

          {msg.citations && msg.citations.length > 0 && (
            <div className="mt-2 text-sm text-gray-300 relative">
              <button
                onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                className="
                flex 
                items-center 
                justify-between 
                w-full 
                bg-gray-800/50 
                p-2 
                rounded-lg 
                hover:bg-gray-700/50 
                transition-colors
              "
              >
                <span className="font-bold">
                  Sources ({msg.citations.length})
                </span>
                {isSourcesOpen ? <ChevronUp /> : <ChevronDown />}
              </button>

              {isSourcesOpen && (
                <div
                  className="
                  mt-2 
                  bg-gray-800/50 
                  rounded-lg 
                  overflow-hidden 
                  border 
                  border-gray-700/50
                "
                >
                  {msg.citations.map((citation, index) => (
                    <div
                      key={index}
                      className="
                      p-3 
                      border-b 
                      border-gray-700/50 
                      last:border-b-0 
                      hover:bg-gray-700/30 
                      transition-colors
                      group
                    "
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-blue-400">
                            Source [{index + 1}]
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            {citation.source_file || "Unknown Source"}
                          </p>
                        </div>
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                          opacity-0 
                          group-hover:opacity-100 
                          transition-opacity 
                          text-blue-300 
                          hover:text-blue-200
                        "
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      {citation.page_number && (
                        <p className="text-xs text-gray-400 mt-1">
                          Page: {citation.page_number}
                        </p>
                      )}

                      {citation.snippet && (
                        <div
                          className="
                          mt-2 
                          text-xs 
                          text-gray-300 
                          italic 
                          bg-gray-900/50 
                          p-2 
                          rounded
                        "
                        >
                          {citation.snippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return <p className="text-sm">{msg.content}</p>;
  };

  const toggleFollowUpQuestions = () => {
    setIsFollowUpQuestionsMinimized((prev) => !prev);
  };

  // Add a method to clean up duplicate messages
  const cleanupConversation = (messages) => {
    const uniqueMessages = [];
    const seenMessages = new Set();
  
    messages.forEach((message, index) => {
      // Create a unique key for the message
      const messageKey = JSON.stringify({
        role: message.role,
        content: message.content,
        // Add index to ensure uniqueness of assistant messages
        index: index
      });
  
      // For assistant messages, only keep the most recent one after a user message
      if (message.role === 'assistant') {
        // Find the last user message before this assistant message
        const lastUserMessageIndex = messages.slice(0, index).reverse()
          .findIndex(m => m.role === 'user');
        
        if (lastUserMessageIndex !== -1) {
          const messageKey = JSON.stringify({
            role: message.role,
            content: message.content,
            userMessageIndex: index - lastUserMessageIndex - 1
          });
  
          if (!seenMessages.has(messageKey)) {
            uniqueMessages.push(message);
            seenMessages.add(messageKey);
          }
        } else {
          // If no previous user message, add the assistant message
          uniqueMessages.push(message);
        }
      } else {
        // For user messages, always add
        if (!seenMessages.has(messageKey)) {
          uniqueMessages.push(message);
          seenMessages.add(messageKey);
        }
      }
    });
  
    return uniqueMessages;
  };

  // Add this method to handle message updates
const handleMessageUpdate = async (messageIndex, newContent) => {
  if (newContent === conversation[messageIndex].content) {
    setEditingMessageId(null);
    return;
  }

  setIsLoading(true);

  try {
    // Store the original message and its response if not already stored
    if (!messageHistory[messageIndex]) {
      const originalMessage = conversation[messageIndex];
      const originalResponse = conversation[messageIndex + 1];
      const subsequentMessages = conversation.slice(messageIndex + 2);
      storeMessageHistory(messageIndex, originalMessage.content, originalResponse, subsequentMessages);
    }

    // Create a new conversation array up to the edited message
    const conversationUpToEdit = conversation.slice(0, messageIndex + 1);
    
    // Update the edited message
    const updatedMessage = {
      ...conversationUpToEdit[messageIndex],
      content: newContent,
      edited: true,
      editedAt: new Date().toISOString()
    };
    
    conversationUpToEdit[messageIndex] = updatedMessage;

    // Update conversation state immediately for better UX
    setConversation(conversationUpToEdit);

    // Prepare request data for the API
    const requestData = {
      message: newContent,
      conversation_id: conversationId,
      selected_documents: localSelectedDocuments,
      context: conversationUpToEdit
    };

    const response = await chatService.sendMessage(requestData);

    // Add the new assistant response
    const assistantMessage = {
      role: "assistant",
      content: response.response || "No response received",
      citations: response.citations || [],
      follow_up_questions: response.follow_up_questions || []
    };

    const finalConversation = [...conversationUpToEdit, assistantMessage];

    setConversation(finalConversation);
    setEditingMessageId(null);

    // Update follow-up questions if available
    if (response.follow_up_questions?.length > 0) {
      setCurrentFollowUpQuestions(response.follow_up_questions);
      setFollowUpQuestions(response.follow_up_questions);
    }

  } catch (error) {
    console.error("Failed to update message:", error);
    toast.error(error.response?.data?.error || "Failed to update message. Please try again.");
    // Restore the original conversation state
    setConversation(conversation);
  } finally {
    setIsLoading(false);
  }
};
  // Add this method to your component
  const storeMessageHistory = (messageIndex, originalMessage, originalResponse, subsequentMessages) => {
    setMessageHistory(prev => ({
      ...prev,
      [messageIndex]: {
        message: originalMessage,
        response: originalResponse,
        subsequentMessages: subsequentMessages
      }
    }));
  };
  // Add this method to handle message reversion
const handleMessageRevert = (messageIndex, originalMessage, originalResponse, subsequentMessages) => {
  const historyEntry = messageHistory[messageIndex];
  
  if (historyEntry) {
    // Create the reverted conversation
    const conversationUpToRevert = conversation.slice(0, messageIndex);
    
    const revertedMessage = {
      ...conversation[messageIndex],
      content: originalMessage,
      edited: false
    };
    
    let updatedConversation = [
      ...conversationUpToRevert,
      revertedMessage,
      originalResponse,
      ...(subsequentMessages || [])
    ];
    
    setConversation(updatedConversation);
    
    // Remove this entry from message history
    const updatedHistory = { ...messageHistory };
    delete updatedHistory[messageIndex];
    setMessageHistory(updatedHistory);
    
    toast.success("Message reverted to original version");
  }
};

  // Add a useEffect to further clean up conversation on initial load
useEffect(() => {
  if (conversation.length > 0) {
    const cleanedConversation = cleanupConversation(conversation);
    if (cleanedConversation.length !== conversation.length) {
      setConversation(cleanedConversation);
    }
  }
}, [conversation]);
  

  return (
    <div
      className="flex-1 h-screen w-full overflow-hidden bg-black relative
        transition-all 
        duration-300 
        ease-in-out"
    >
      {/* Header with View Toggle */}
      <div
        className="absolute top-16 left-0 right-0 z-40 
        bg-opacity-100
        bg-black
        border-b
        border-blue-500/10 
        py-2
        px-4 
        flex 
        justify-between
        items-center"
      >
        <div className="flex-1"></div> {/* Spacer */}
        <div className="flex items-center space-x-2 bg-gray-800/30 rounded-full p-1">
          <button
            onClick={() => toggleView("chat")}
            className={`
                  px-4 py-2 rounded-full text-sm transition-all duration-300
                  ${
                    currentView === "chat"
                      ? "bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }
              `}
          >
            <MessageCircle className="inline-block mr-2 h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => toggleView("summary")}
            className={`
                  px-4 py-2 rounded-full text-sm transition-all duration-300
                  ${
                    currentView === "summary"
                      ? "bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }
              `}
          >
            <FileText className="inline-block mr-2 h-4 w-4" />
            Summary
          </button>
        </div>
        <div className="flex-1"></div> {/* Spacer */}
      </div>

      {/* Conditional Rendering based on current view */}
      <div className="absolute inset-0 top-16 overflow-hidden">
        {currentView === "chat" ? (
          <div
            className="flex flex-col h-full w-full bg-black 
            top-16
            rounded-t-3xl 
            overflow-hidden 
            backdrop-blur-sm"
          >
            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-2 sm:p-4 bg-black space-y-2
                        sm:space-y-4
                        custom-scrollbar
                        pb-[100px] flex flex-col space-y-4 transition-all duration-300 ease-in-out 
                        ${
                          !isFollowUpQuestionsMinimized ? "pb-[150px]" : "pb-4"
                        }`}
            >
              {/* Rest of the chat messages rendering code */}
              {conversation.map((msg, index) => (
                  <React.Fragment key={index}>
                    <div
                      className={`flex ${
                        msg.role === "user"
                          ? "justify-end mt-16"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={` p-4 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-500/20 text-white max-w-[70%]"
                            : "bg-gray-800/50  text-white max-w-full"
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {msg.role === "user" ? (
                            <User className="mr-2 h-5 w-5" />
                          ) : (
                            <Bot className="mr-2 h-5 w-5" />
                          )}
                          <span className="font-bold">
                            {msg.role === "user" ? "You" : "Assistant"}
                          </span>
                        </div>
                        {msg.role === "user" ? (
                          <EditableMessage
                            content={msg.content}
                            isEditing={editingMessageId === index}
                            setIsEditing={(isEditing) => setEditingMessageId(isEditing ? index : null)}
                            onSave={(newContent) => handleMessageUpdate(index, newContent)}
                            onRevert={(originalMessage, originalResponse, subsequentMessages) => 
                              handleMessageRevert(index, originalMessage, originalResponse, subsequentMessages)
                            }
                            disabled={isLoading}
                            messageIndex={index}
                            messageHistory={messageHistory}
                          />
                        ) : (
                          renderMessage(msg)
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}

              {isLoading && (
                <div className="text-center text-white">
                  Generating response...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Follow-up Questions and Input Area */}
            <div className="w-full px-2 py-2 fixed-bottom-0 z-20 pointer-events-none">
              <div
                className="w-full px-2 py-4 bottom-20
                  transition-all duration-300 ease-in-out
                  transform ${isFollowUpQuestionsMinimized ? 'translate-y-full' : 'translate-y-0'}
                  z-20
                  pointer-events-auto
                "
              >
                <div
                  className="
                    bg-gradient-to-b from-blue-500/20
                    backdrop-blur-lg
                    rounded-t-2xl 
                    sm:rounded-t-3xl 
                    shadow-2xl 
                    overflow-hidden
                    relative 
                  "
                >
                  <div className="flex justify-center mb-1 py-1">
                    <button
                      onClick={toggleFollowUpQuestions}
                      className="text-white p-1 transition-colors"
                    >
                      {isFollowUpQuestionsMinimized ? (
                        <ChevronUp />
                      ) : (
                        <ChevronDown />
                      )}
                    </button>
                  </div>
                  {!isFollowUpQuestionsMinimized &&
                    currentFollowUpQuestions.length > 0 && (
                      <div className="w-full px-4 py-1">
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {currentFollowUpQuestions.map((question, index) => (
                            <Card
                              key={index}
                              title={`Question ${index + 1}`}
                              onClick={() => {
                                setMessage(question);
                                handleSendMessage();
                              }}
                            >
                              {question}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                {/* Input Area */}

                <div
                  className="
                    
                      backdrop-blur-xl 
                      backdrop-blur-lg 
                      rounded-b-2xl
                      sm:rounded-b-3xl  
                      shadow-2xl 
                      p-2 
                      sm:p-4
                      relative
                    "
                >
                  <div className="flex items-center gap-2 max-w-full">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          handleSendMessage()
                        }
                        placeholder="Type your message..."
                        className="
                          w-full 
                          bg-gray-900/20 
                          text-white 
                          rounded-2xl 
                          pl-3 
                          sm:pl-4 
                          pr-10 
                          sm:pr-12 
                          py-2 
                          sm:py-3 
                          text-xs 
                          sm:text-sm 
                          focus:outline-none 
                          focus:ring-2 
                          focus:ring-gray-500/50 
                          backdrop-blur-sm 
                          border 
                          border-white/10
                        "
                        disabled={isLoading}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple // Add this attribute
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Paperclip className="h-5 w-5 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSendMessage(message)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80
                        hover:from-blue-500/70 hover:to-purple-500/70 
                        text-white 
                        p-2 
                        sm:p-3 
                        rounded-2xl 
                        transition-colors 
                        flex-shrink-0"
                    >
                      <Send className="h-5 w-5 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderSummaryView()
        )}
      </div>
      {/* Document Processing Loader - Add this at the top level */}
      {isDocumentProcessing && (
        <DocumentProcessingLoader progress={processingProgress} />
      )}
      {/* Summary Popup
        {isSummaryPopupOpen && (
            <Popup
                title="Document Summary"
                content={propSummary}
                onClose={() => {
                    setIsSummaryPopupOpen(false);
                    onCloseSummary();
                }} 
                className="
                    w-[95%] 
                    max-w-[600px] 
                    mx-auto 
                    my-4 
                    sm:my-10 
                    text-sm 
                    sm:text-base
                "
            />
        )} */}

      {/* Custom Scrollbar Styles */}
      <style>{`

              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }

              .animate-bounce {
                animation: bounce 1s ease-in-out;
              }

              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }

              .animate-pulse {
                animation: pulse 1.5s ease-in-out infinite;
              }
            .custom-tooltip {
              background-color: #1f2937 !important; /* dark gray background */
              color: #ffffff !important;
              padding: 12px !important;
              border-radius: 8px !important;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
              max-width: 300px !important;
              width: 300px !important;
              z-index: 1000 !important;
              animation: fadeIn 0.3s ease-out !important;
            }
          
            
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out;
            }
            
            .citation-inline-wrapper {
              position: relative;
              display: inline-block;
            }
            
            .citation-tooltip {
              display: none;
            }

            .citation-inline-wrapper:hover .citation-tooltip {
              display: block;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
            .group:hover .opacity-0 {
              opacity: 1;
            }

            .transition-opacity {
              transition: opacity 0.2s ease-in-out;
            }
        `}</style>
    </div>
  );
};

MainContent.propTypes = {
  selectedChat: PropTypes.shape({
    conversation_id: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string,
        content: PropTypes.string,
        citations: PropTypes.array,
      })
    ),
    summary: PropTypes.string,
    follow_up_questions: PropTypes.arrayOf(PropTypes.string),
    // conversation_id: PropTypes.string,
    selected_documents: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
  }),

  summary: PropTypes.string,
  followUpQuestions: PropTypes.array,
  isSummaryPopupOpen: PropTypes.bool.isRequired,
  onCloseSummary: PropTypes.func.isRequired,
  setSummary: PropTypes.func.isRequired,
  setFollowUpQuestions: PropTypes.func.isRequired,
  setIsSummaryPopupOpen: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
  setSelectedDocuments: PropTypes.func,
  updateSelectedDocuments: PropTypes.func,
  isDocumentProcessing: PropTypes.bool,
  processingProgress: PropTypes.number,
};

export default MainContent;


