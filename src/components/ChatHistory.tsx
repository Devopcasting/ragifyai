import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
    sessions: ChatSession[];
    activeSessionId: number | null;
    onSessionSelect: (sessionId: number) => void;
    onNewSession: () => void;
    onDeleteSession: (sessionId: number) => void;
    onUpdateSessionTitle: (sessionId: number, title: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
    sessions,
    activeSessionId,
    onSessionSelect,
    onNewSession,
    onDeleteSession,
    onUpdateSessionTitle
}) => {
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const handleEditStart = (session: ChatSession) => {
        setEditingSessionId(session.id);
        setEditingTitle(session.title);
    };

    const handleEditSave = () => {
        if (editingSessionId && editingTitle.trim()) {
            onUpdateSessionTitle(editingSessionId, editingTitle.trim());
            setEditingSessionId(null);
            setEditingTitle('');
        }
    };

    const handleEditCancel = () => {
        setEditingSessionId(null);
        setEditingTitle('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) { // 7 days
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
                    <button
                        onClick={onNewSession}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="New chat"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="p-6 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No chat history yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start typing to begin a new conversation</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {/* New Chat Option */}
                        <div className="group relative rounded-lg transition-all duration-200 hover:bg-gray-50 border border-transparent">
                            <button
                                onClick={onNewSession}
                                className="w-full p-3 text-left group"
                            >
                                <div className="flex items-center space-x-3">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">New Chat</p>
                                        <p className="text-xs text-gray-500">Start a new conversation</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Existing Sessions */}
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative rounded-lg transition-all duration-200 ${activeSessionId === session.id
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                {editingSessionId === session.id ? (
                                    <div className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleEditSave}
                                                className="p-1 text-green-600 hover:text-green-700"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleEditCancel}
                                                className="p-1 text-gray-600 hover:text-gray-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onSessionSelect(session.id)}
                                        className="w-full p-3 text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                <MessageCircle className={`w-4 h-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-blue-600' : 'text-gray-400'
                                                    }`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-blue-900' : 'text-gray-900'
                                                        }`}>
                                                        {session.title}
                                                    </p>
                                                    <p className={`text-xs ${activeSessionId === session.id ? 'text-blue-600' : 'text-gray-500'
                                                        }`}>
                                                        {formatDate(session.updated_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditStart(session);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                    title="Edit title"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSession(session.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                    title="Delete chat"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistory; 