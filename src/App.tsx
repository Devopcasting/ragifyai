import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import FileManager from './components/FileManager';
import ChatInterface, { ChatInterfaceRef } from './components/ChatInterface';
import SearchPanel from './components/SearchPanel';
import LogViewer from './components/LogViewer';
import { FileData, ChatSession, ChatSessionWithMessages } from './types';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'chat' | 'logs'>('upload');
  const [isLoading, setIsLoading] = useState(true);

  // Chat history state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSessionWithMessages | null>(null);
  const [clearChatFlag, setClearChatFlag] = useState<number>(0); // Force re-render when cleared
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  // Load chat sessions on component mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadChatSessions(),
          loadFilesFromDatabase()
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load current session when activeSessionId changes
  useEffect(() => {
    console.log('DEBUG: activeSessionId changed to:', activeSessionId);
    if (activeSessionId) {
      loadChatSession(activeSessionId);
    } else {
      console.log('DEBUG: Setting currentSession to null');
      setCurrentSession(null);
    }
  }, [activeSessionId]);

  // Periodic refresh of files to show processing status
  useEffect(() => {
    const interval = setInterval(() => {
      loadFilesFromDatabase();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const loadChatSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat-history/sessions');
      if (response.ok) {
        const sessions = await response.json();
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadChatSession = async (sessionId: number) => {
    try {
      console.log('DEBUG: Loading chat session:', sessionId);
      const response = await fetch(`http://localhost:8000/api/chat-history/sessions/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        console.log('DEBUG: Loaded session:', session);
        setCurrentSession(session);
      } else {
        console.log('DEBUG: Failed to load session, status:', response.status);
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      setCurrentSession(null);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat-history/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New Chat ${new Date().toLocaleTimeString()}`
        })
      });

      if (response.ok) {
        const newSession = await response.json();
        setChatSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const deleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat-history/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const updateSessionTitle = async (sessionId: number, title: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat-history/sessions/${sessionId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        setChatSessions(prev => prev.map(session =>
          session.id === sessionId ? { ...session, title } : session
        ));
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const clearAllSessions = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/chat-history/sessions/clear-all', {
        method: 'DELETE'
      });

      if (response.ok) {
        // Clear all session-related state
        setChatSessions([]);
        setActiveSessionId(null);
        setCurrentSession(null);
        setClearChatFlag(prev => prev + 1);

        // Force clear messages in ChatInterface
        if (chatInterfaceRef.current) {
          chatInterfaceRef.current.clearMessages();
        }

        // Force a small delay to ensure state updates are processed
        setTimeout(() => {
          console.log('DEBUG: Chat history cleared, state reset complete');
        }, 100);

        alert('All chat history cleared successfully!');
      } else {
        alert('Error clearing chat history');
      }
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      alert('Error clearing chat history');
    }
  };

  const handleFileUpload = (newFiles: FileData[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    // Refresh files from database to ensure we have the latest data
    loadFilesFromDatabase();
  };

  const handleFileUpdate = (fileId: string, updates: Partial<FileData>) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, ...updates } : file
    ));
  };

  const handleFileDelete = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const loadFilesFromDatabase = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/');
      if (response.ok) {
        const fileRecords = await response.json();
        const files: FileData[] = fileRecords.map((record: any) => ({
          id: record.id,
          name: record.name,
          type: record.type as FileData['type'],
          size: record.size,
          uploadedAt: new Date(record.uploaded_at),
          status: record.status as FileData['status'],
          progress: record.progress
        }));
        setFiles(files);
        console.log('Loaded files from database:', files.length);
      }
    } catch (error) {
      console.error('Error loading files from database:', error);
    }
  };

  const refreshFiles = async () => {
    await loadFilesFromDatabase();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <Sidebar
          files={files}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFileDelete={handleFileDelete}
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSessionId}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          onUpdateSessionTitle={updateSessionTitle}
          onClearAllSessions={clearAllSessions}
        />

        {/* Right Main Content */}
        <div className="flex-1 p-4 overflow-auto overflow-x-hidden min-w-0">
          <div className="h-full max-w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 text-center shadow-sm border border-white/20">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your documents...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'upload' && (
                  <FileUpload onFileUpload={handleFileUpload} onFileUpdate={handleFileUpdate} />
                )}
                {activeTab === 'files' && (
                  <FileManager files={files} onFileDelete={handleFileDelete} />
                )}
                {activeTab === 'chat' && (
                  <ChatInterface
                    key={`chat-${clearChatFlag}`}
                    files={files}
                    currentSession={currentSession}
                    activeSessionId={activeSessionId}
                    onSessionUpdate={loadChatSessions}
                    setActiveSessionId={setActiveSessionId}
                    clearChatFlag={clearChatFlag}
                    ref={chatInterfaceRef}
                  />
                )}
                {activeTab === 'logs' && (
                  <LogViewer />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;