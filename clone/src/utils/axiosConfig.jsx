//4.12.2023

//axiosConfig.jsx
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Django backend URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const dataAnalysisService = {
  uploadFile: (formData) => {
    return axiosInstance.post('/data/analysis/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  analyzeData: (query) => {
    return axiosInstance.post('/data/analysis/', { query }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  },

  saveResults: (results) => {
    return axiosInstance.post('/data/save-results/', { results }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }
};

export const ideaService = {
  generateIdeas: (data) => {
    return axiosInstance.post('/ideas/generate_ideas/', data);
  },

  updateIdea: (data) => {
    return axiosInstance.put('/ideas/update_idea/', data);
  },

  deleteIdea: (ideaId) => {
    return axiosInstance.delete('/ideas/delete_idea/', { data: { idea_id: ideaId } });
  },

  generateProductImage: (data) => {
    return axiosInstance.post('/ideas/generate_product_image/', data);
  },

  regenerateProductImage: (data) => {
    return axiosInstance.post('/ideas/regenerate_product_image/', data);
  }
};

export const authService = {
  // ... existing auth methods ...

  initiatePasswordReset: (email) => {
    return axiosInstance.post('/password-reset/initiate/', { email });
  },

  confirmPasswordReset: (token, newPassword) => {
    return axiosInstance.post('/password-reset/confirm/', { 
      token, 
      new_password: newPassword 
    });
  }
};

// Export services
export const documentService = {
  uploadDocument: (formData) => {
    return axiosInstance.post('/upload-documents/', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    });
    
  },

  setActiveDocument: (documentId) => {
    return axiosInstance.post('/set-active-document/', { document_id: documentId })
      .then(response => {
        // Optionally store in localStorage or sessionStorage
        sessionStorage.setItem('active_document_id', documentId);
        return response.data;
      });
  },

  getUserDocuments: () => {
    return axiosInstance.get('/user-documents/');
  },

  getChatHistory: () => {
    return axiosInstance.get('/chat-history/', {
      params: {
        limit: 50,  // Optional: limit number of chats
        include_messages: true,
        include_documents: true
      }
    });
  },

  deleteDocument: (documentId) => {
    return axiosInstance.delete(`/documents/${documentId}/delete/`)
      .then(response => {
        console.log("Document deleted:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to delete document:", error.response?.data || error.message);
        throw error;
      });
  },
};

export const chatService = {
  sendMessage: (data) => {
    console.log("Sending data to chat service:", data);
    return axiosInstance.post('/api/chat/', data)
        .then(response => {
            console.log("Chat service response:", response.data);
            return response.data;
        })
        .catch(error => {
            console.error("Full Error Object:", error);
            console.error("Error Response:", error.response);
            
            if (error.response) {
                // Server responded with an error
                console.error('Error Status:', error.response.status);
                console.error('Error Data:', error.response.data);
                throw error.response.data;
            } else if (error.request) {
                // Request made but no response received
                console.error('No response received:', error.request);
                throw new Error('No response from server');
            } else {
                // Something happened in setting up the request
                console.error('Error Message:', error.message);
                throw error;
            }
        });
  },

  updateConversationTitle: (conversationId, updateData) => {
    console.log('Calling updateConversationTitle with:', {
      conversationId, 
      updateData
    });
  
    return axiosInstance.patch(`/conversations/${conversationId}/`, updateData)
      .then(response => {
        console.log('Update conversation title response:', response);
        return response.data;
      })
      .catch(error => {
        // Log the full error object for debugging
        console.error('Full error object:', error);
  
        // More detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error Status:', error.response.status);
          console.error('Error Data:', error.response.data);
          
          // Throw a more informative error
          throw new Error(
            error.response.data?.error || 
            error.response.data?.message || 
            'Failed to update conversation title'
          );
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          throw new Error('No response from server');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error Message:', error.message);
          throw error;
        }
      });
  },

  manageConversation: (conversationId, data) => {
    return axiosInstance.patch(`/conversations/${conversationId}/`, data)
      .then(response => {
        console.log("Conversation management response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Conversation management error:", error);
        throw error;
      });
  },

  getConversationDetails: (conversationId) => {
    return axiosInstance.get(`/conversations/${conversationId}/`)
      .then(response => {
        console.log("Full Conversation Details:", response.data);
        
        // Ensure messages are in the correct format
        const formattedMessages = (response.data.messages || []).map(msg => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          citations: msg.citations || []
        }));
  
        return {
          ...response.data,
          messages: formattedMessages,
          conversation_id: conversationId
        };
      })
      .catch(error => {
        console.error("Failed to fetch conversation details:", error.response?.data || error.message);
        throw error;
      });
  },

  // Add a method to fetch all conversations
  getAllConversations: () => {
    return axiosInstance.get('/conversations/')
      .then(response => {
        console.log("All Conversations:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to fetch conversations:", error.response?.data || error.message);
        throw error;
      });
  },

  // Optional: Method to delete a conversation
  deleteConversation: (conversationId) => {
    return axiosInstance.delete(`/conversations/${conversationId}/delete/`)
      .then(response => {
        console.log("Conversation deleted:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to delete conversation:", error.response?.data || error.message);
        throw error;
      });
  },

  startConversation: (documentId, message) => {
    return axiosInstance.post('/conversation/start/', {
      document_id: documentId,
      message: message
    });
  },

  continueConversation: (conversationId, message) => {
    return axiosInstance.post('/conversation/continue/', {
      conversation_id: conversationId,
      message: message
    });
  }
};


export default axiosInstance;


      