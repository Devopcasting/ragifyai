import React, { useState, useEffect } from 'react';
import { Upload, FileText, MessageCircle, FileSearch } from 'lucide-react';
import { FileData, ChatSession } from '../types';
import ChatHistory from './ChatHistory';

interface SidebarProps {
  files: FileData[];
  activeTab: 'upload' | 'files' | 'chat' | 'logs';
  onTabChange: (tab: 'upload' | 'files' | 'chat' | 'logs') => void;
  onFileDelete: (id: string) => void;
  // Chat history props
  chatSessions: ChatSession[];
  activeSessionId: number | null;
  onSessionSelect: (sessionId: number) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: number) => void;
  onUpdateSessionTitle: (sessionId: number, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeTab,
  onTabChange,
  onFileDelete,
  chatSessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onUpdateSessionTitle
}) => {
  const [fileStats, setFileStats] = useState({
    total_files: 0,
    ready_files: 0,
    processing_files: 0,
    error_files: 0,
    type_breakdown: {}
  });

  // Load file statistics from database
  useEffect(() => {
    const loadFileStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/files/stats');
        if (response.ok) {
          const stats = await response.json();
          setFileStats(stats);
        }
      } catch (error) {
        console.error('Error loading file stats:', error);
      }
    };

    // Load stats immediately
    loadFileStats();

    // Set up polling to refresh stats every 3 seconds
    const interval = setInterval(loadFileStats, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []); // Remove files dependency to avoid conflicts with polling

  const navigationItems = [
    { id: 'upload', label: 'Upload Files', icon: Upload, description: 'Add new documents' },
    { id: 'files', label: 'File Manager', icon: FileText, description: 'Manage your files', count: fileStats.total_files },
    { id: 'chat', label: 'Ask Questions', icon: MessageCircle, description: 'Chat with your data' },
    { id: 'logs', label: 'API Logs', icon: FileSearch, description: 'View backend API logs' }
  ];

  return (
    <div className="w-80 bg-white/70 backdrop-blur-sm border-r border-white/20 flex flex-col h-full overflow-hidden">
      {/* Navigation */}
      <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as any)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${activeTab === item.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${activeTab === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </div>
              {item.count !== undefined && (
                <span className={`px-2 py-1 text-xs rounded-full ${activeTab === item.id
                  ? 'bg-blue-400 text-white'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Chat History - Only show when chat tab is active */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-hidden">
          <ChatHistory
            sessions={chatSessions}
            activeSessionId={activeSessionId}
            onSessionSelect={onSessionSelect}
            onNewSession={onNewSession}
            onDeleteSession={onDeleteSession}
            onUpdateSessionTitle={onUpdateSessionTitle}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;