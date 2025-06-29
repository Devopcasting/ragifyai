import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, User, FileText, Loader2, Filter, X, Check } from 'lucide-react';
import { ChatMessage, FileData, ChatSessionWithMessages } from '../types';

interface ChatInterfaceProps {
  files: FileData[];
  currentSession: ChatSessionWithMessages | null;
  activeSessionId: number | null;
  onSessionUpdate: () => void;
  setActiveSessionId: (sessionId: number | null) => void;
  clearChatFlag?: number;
}

export interface ChatInterfaceRef {
  clearMessages: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({
  files,
  currentSession,
  activeSessionId,
  onSessionUpdate,
  setActiveSessionId,
  clearChatFlag = 0
}, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'selected'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from current session
  useEffect(() => {
    console.log('DEBUG: ChatInterface useEffect - currentSession:', currentSession);
    console.log('DEBUG: ChatInterface useEffect - activeSessionId:', activeSessionId);

    // Force clear messages first
    setMessages([]);

    if (currentSession) {
      const sessionMessages: ChatMessage[] = currentSession.messages.map(msg => ({
        id: msg.id.toString(),
        type: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        sources: msg.sources,
        metadata: {
          scope: 'all'
        }
      }));
      setMessages(sessionMessages);
    } else {
      // Clear messages and show default welcome message when no session is active
      setMessages([{
        id: '1',
        type: 'assistant',
        content: files.length > 0
          ? `Hello! I'm ready to help you analyze your ${files.length} uploaded document${files.length !== 1 ? 's' : ''}. Just start typing your question below and I'll automatically save our conversation. You can ask questions about all your files or specify particular documents. What would you like to know?`
          : "Hello! I don't see any uploaded documents yet. Please upload some files first using the 'Upload Files' tab, then come back here to start asking questions about your documents. Your conversations will be automatically saved.",
        timestamp: new Date(),
      }]);
    }
  }, [currentSession, files.length, activeSessionId]);

  // Force clear messages when there's no active session
  useEffect(() => {
    if (!activeSessionId && !currentSession) {
      console.log('DEBUG: Force clearing messages - no active session');
      setMessages([{
        id: '1',
        type: 'assistant',
        content: files.length > 0
          ? `Hello! I'm ready to help you analyze your ${files.length} uploaded document${files.length !== 1 ? 's' : ''}. Just start typing your question below and I'll automatically save our conversation. You can ask questions about all your files or specify particular documents. What would you like to know?`
          : "Hello! I don't see any uploaded documents yet. Please upload some files first using the 'Upload Files' tab, then come back here to start asking questions about your documents. Your conversations will be automatically saved.",
        timestamp: new Date(),
      }]);
    }
  }, [activeSessionId, currentSession, files.length]);

  // Additional force clear when component mounts or when switching to chat tab
  useEffect(() => {
    console.log('DEBUG: ChatInterface component mounted/updated');
    if (!currentSession) {
      console.log('DEBUG: No current session, clearing messages');
      setMessages([{
        id: '1',
        type: 'assistant',
        content: files.length > 0
          ? `Hello! I'm ready to help you analyze your ${files.length} uploaded document${files.length !== 1 ? 's' : ''}. Just start typing your question below and I'll automatically save our conversation. You can ask questions about all your files or specify particular documents. What would you like to know?`
          : "Hello! I don't see any uploaded documents yet. Please upload some files first using the 'Upload Files' tab, then come back here to start asking questions about your documents. Your conversations will be automatically saved.",
        timestamp: new Date(),
      }]);
    }
  }, []); // Run only on mount

  // Force clear messages when clearChatFlag changes
  useEffect(() => {
    console.log('DEBUG: clearChatFlag changed to:', clearChatFlag);
    if (clearChatFlag > 0) {
      console.log('DEBUG: Force clearing messages due to clearChatFlag');
      setMessages([{
        id: '1',
        type: 'assistant',
        content: files.length > 0
          ? `Hello! I'm ready to help you analyze your ${files.length} uploaded document${files.length !== 1 ? 's' : ''}. Just start typing your question below and I'll automatically save our conversation. You can ask questions about all your files or specify particular documents. What would you like to know?`
          : "Hello! I don't see any uploaded documents yet. Please upload some files first using the 'Upload Files' tab, then come back here to start asking questions about your documents. Your conversations will be automatically saved.",
        timestamp: new Date(),
      }]);
    }
  }, [clearChatFlag, files.length]);

  // Expose clearMessages function to parent component
  useImperativeHandle(ref, () => ({
    clearMessages: () => {
      console.log('DEBUG: clearMessages called via ref');
      setMessages([{
        id: '1',
        type: 'assistant',
        content: files.length > 0
          ? `Hello! I'm ready to help you analyze your ${files.length} uploaded document${files.length !== 1 ? 's' : ''}. Just start typing your question below and I'll automatically save our conversation. You can ask questions about all your files or specify particular documents. What would you like to know?`
          : "Hello! I don't see any uploaded documents yet. Please upload some files first using the 'Upload Files' tab, then come back here to start asking questions about your documents. Your conversations will be automatically saved.",
        timestamp: new Date(),
      }]);
    }
  }), [files.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileIcon = (type: FileData['type']) => {
    const iconMap = {
      'pdf': '📄',
      'image': '🖼️',
      'text': '📝',
      'audio': '🎵',
      'video': '🎬'
    };
    return iconMap[type] || '📄';
  };

  const getFileTypeColor = (type: FileData['type']) => {
    const colorMap = {
      'pdf': 'bg-red-100 text-red-800',
      'image': 'bg-green-100 text-green-800',
      'text': 'bg-blue-100 text-blue-800',
      'audio': 'bg-purple-100 text-purple-800',
      'video': 'bg-orange-100 text-orange-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const clearFileSelection = () => {
    setSelectedFiles([]);
    setSearchScope('all');
  };

  const sendMessageToBackend = async (userMessage: string) => {
    setIsLoading(true);

    const typingMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      // Prepare document IDs for the request
      // Convert file IDs to filenames since backend expects filenames as "source" in ChromaDB
      let documentIds: string[] | undefined = undefined;
      if (searchScope === 'selected' && selectedFiles.length > 0) {
        documentIds = selectedFiles.map(fileId => {
          const file = files.find(f => f.id === fileId);
          return file ? file.name : fileId; // Use filename if found, fallback to fileId
        });
      }

      // Call the backend chat API - it will auto-create session if needed
      console.log('DEBUG: Sending document_ids:', documentIds);
      console.log('DEBUG: Selected files:', selectedFiles);
      console.log('DEBUG: Search scope:', searchScope);

      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          document_ids: documentIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('DEBUG: API Response:', result);
      console.log('DEBUG: Timing data:', result.timing);
      console.log('DEBUG: Timing data type:', typeof result.timing);
      console.log('DEBUG: Timing data keys:', result.timing ? Object.keys(result.timing) : 'null');

      // Remove typing message
      setMessages(prev => prev.filter(m => !m.isTyping));

      // Add the real response
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: result.message,
        timestamp: new Date(),
        sources: result.sources && result.sources.length > 0 ? result.sources : undefined,
        timing: result.timing ? {
          document_analysis: result.timing.document_analysis,
          response_generation: result.timing.response_generation,
          total_time: result.timing.total_time
        } : undefined
      };

      console.log('DEBUG: Created assistant message:', assistantMessage);
      console.log('DEBUG: Assistant message timing:', assistantMessage.timing);

      setMessages(prev => [...prev, assistantMessage]);

      // If a new session was created, update the session list and set it as active
      if (result.session_id && result.session_id !== activeSessionId) {
        setActiveSessionId(result.session_id);
        onSessionUpdate();
      }

    } catch (error) {
      console.error('Chat error:', error);

      // Remove typing message
      setMessages(prev => prev.filter(m => !m.isTyping));

      // Check if it's the HNSW index error
      const errorMessage = error instanceof Error ? error.message : String(error);
      let displayMessage = 'Sorry, I encountered an error while processing your request. Please try again.';

      if (errorMessage.includes('Cannot return the results in a contigious 2D array') ||
        errorMessage.includes('insufficient data in the index')) {
        displayMessage = 'The search index needs to be rebuilt. This can happen when there are too few documents or the index becomes corrupted. You can try uploading more documents or contact support to reset the index.';
      }

      // Add error message
      const errorMessageObj: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: displayMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || files.length === 0) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      metadata: searchScope === 'selected' && selectedFiles.length > 0
        ? { selectedFiles: selectedFiles.length, scope: 'selected' }
        : { scope: 'all' }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    await sendMessageToBackend(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 text-center shadow-sm border border-white/20 max-w-md">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Documents Available</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            You need to upload some documents first before you can start asking questions.
            Head over to the "Upload Files" tab to add your documents.
          </p>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 Once you upload files, you'll be able to ask questions about their content,
              get summaries, and extract insights using AI.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentSession ? currentSession.title : 'Chat with Documents'}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeSessionId
                    ? 'Active conversation • Auto-saving enabled'
                    : 'Start typing to begin • Auto-saving enabled'
                  }
                </p>
              </div>
            </div>

            {/* File Selection Button */}
            <button
              onClick={() => setShowFileSelector(!showFileSelector)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-gray-700">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} selected`
                  : 'Select documents'
                }
              </span>
            </button>
          </div>

          {/* File Selector */}
          {showFileSelector && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Choose documents to focus on</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSearchScope('all')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${searchScope === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    All Documents
                  </button>
                  <button
                    onClick={() => setSearchScope('selected')}
                    disabled={selectedFiles.length === 0}
                    className={`px-3 py-1 text-xs rounded-full transition-colors disabled:opacity-50 ${searchScope === 'selected'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Selected Only
                  </button>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={clearFileSelection}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {files.map((file) => (
                  <label
                    key={file.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedFiles.includes(file.id)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${getFileTypeColor(file.type)}`}>
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{file.type}</p>
                    </div>
                    {selectedFiles.includes(file.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Selected Files Summary */}
          {selectedFiles.length > 0 && searchScope === 'selected' && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Focusing on {selectedFiles.length} document{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => setSearchScope('all')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Include all documents
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                  ? 'bg-blue-500'
                  : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}>
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your documents...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed">{message.content}</p>

                      {/* Query Scope Indicator */}
                      {message.type === 'user' && message.metadata && (
                        <div className="mt-2 pt-2 border-t border-blue-400/30">
                          <p className="text-xs text-blue-100">
                            {message.metadata.scope === 'selected'
                              ? `🎯 ${message.metadata.selectedFiles} selected documents`
                              : '🌐 All documents'
                            }
                          </p>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-700 truncate">
                                  {typeof source === 'string' ? source : source.display || source.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timing Information */}
                      {message.type === 'assistant' && message.timing && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Document analysis: {message.timing.document_analysis.toFixed(2)}s
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Response generation: {message.timing.response_generation.toFixed(2)}s
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Total time: {message.timing.total_time.toFixed(2)}s
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your documents..."
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 text-sm"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatInterface;