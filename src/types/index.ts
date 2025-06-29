export interface FileData {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'text' | 'audio' | 'video';
  size: number;
  uploadedAt: Date;
  preview?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress?: number;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    name: string;
    page_number: number;
    display: string;
  }>;
  isTyping?: boolean;
  metadata?: {
    scope?: 'all' | 'selected';
    selectedFiles?: number;
  };
  timing?: {
    document_analysis: number;
    response_generation: number;
    total_time: number;
  };
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: Array<{
    id: number;
    session_id: number;
    role: string;
    content: string;
    sources?: Array<{
      name: string;
      page_number: number;
      display: string;
    }>;
    confidence?: number;
    created_at: string;
  }>;
}

export interface SearchResult {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
  score: number;
  highlightedContent: string;
}