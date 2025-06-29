import React, { useState } from 'react';
import { File, Image, FileText, Music, Video, Trash2, Eye, Download, Search } from 'lucide-react';
import { FileData } from '../types';

interface FileManagerProps {
  files: FileData[];
  onFileDelete: (id: string) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ files, onFileDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getFileIcon = (type: FileData['type'], className = "w-5 h-5") => {
    switch (type) {
      case 'image': return <Image className={className} />;
      case 'pdf': return <FileText className={className} />;
      case 'audio': return <Music className={className} />;
      case 'video': return <Video className={className} />;
      default: return <File className={className} />;
    }
  };

  const getFileColor = (type: FileData['type']) => {
    switch (type) {
      case 'image': return 'text-green-600 bg-green-100';
      case 'pdf': return 'text-red-600 bg-red-100';
      case 'audio': return 'text-purple-600 bg-purple-100';
      case 'video': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  const fileTypes = [
    { value: 'all', label: 'All Files', count: files.length },
    { value: 'pdf', label: 'PDFs', count: files.filter(f => f.type === 'pdf').length },
    { value: 'image', label: 'Images', count: files.filter(f => f.type === 'image').length },
    { value: 'audio', label: 'Audio', count: files.filter(f => f.type === 'audio').length },
    { value: 'video', label: 'Video', count: files.filter(f => f.type === 'video').length },
    { value: 'text', label: 'Text', count: files.filter(f => f.type === 'text').length },
  ];

  const fileStats = [
    { type: 'Documents', count: files.filter(f => f.type === 'pdf' || f.type === 'text').length, color: 'bg-blue-500' },
    { type: 'Images', count: files.filter(f => f.type === 'image').length, color: 'bg-green-500' },
    { type: 'Audio', count: files.filter(f => f.type === 'audio').length, color: 'bg-purple-500' },
    { type: 'Video', count: files.filter(f => f.type === 'video').length, color: 'bg-orange-500' }
  ];

  const handleFileDelete = async (fileId: string) => {
    try {
      // Delete from database first
      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Then update local state
        onFileDelete(fileId);
      } else {
        console.error('Failed to delete file from database');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all documents and embeddings? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch('http://localhost:8000/api/documents/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('All documents and embeddings cleared successfully!');
        // Optionally refresh the page or update the UI
        window.location.reload();
      } else {
        const error = await response.text();
        alert(`Error clearing documents: ${error}`);
      }
    } catch (error) {
      alert(`Error clearing documents: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetCollection = async () => {
    if (!confirm('Are you sure you want to reset the search index? This will rebuild the index with optimized parameters. All documents will need to be reprocessed.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('http://localhost:8000/api/documents/reset-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Search index reset successfully! You may need to re-upload your documents for optimal performance.');
        // Optionally refresh the page or update the UI
        window.location.reload();
      } else {
        const error = await response.text();
        alert(`Error resetting collection: ${error}`);
      }
    } catch (error) {
      alert(`Error resetting collection: ${error}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 text-center shadow-sm border border-white/20">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <File className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No files uploaded yet</h3>
          <p className="text-gray-600 mb-4 text-sm">Start by uploading your documents, images, or media files.</p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            Upload First File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Top Row: File Manager Controls and Knowledge Base Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* File Manager Controls - Takes 2/3 of the space */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900">File Manager</h2>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetCollection}
                disabled={isResetting}
                className="px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Reset search index (fixes HNSW errors)"
              >
                {isResetting ? 'Resetting...' : 'Reset Index'}
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Clear all documents and embeddings"
              >
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                {viewMode === 'grid' ? '📋' : '⚏'}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {fileTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.count})
                </option>
              ))}
            </select>
          </div>

          {/* File Grid/List */}
          <div className="overflow-y-auto max-h-96">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200 ${viewMode === 'list' ? 'p-3' : 'p-4'
                    }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(file.type)}`}>
                          {getFileIcon(file.type, "w-5 h-5")}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 truncate mb-1 text-sm">{file.name}</h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="capitalize">{file.type}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {file.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {file.tags.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{file.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileColor(file.type)}`}>
                        {getFileIcon(file.type, "w-4 h-4")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">{file.name}</h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="capitalize">{file.type}</span>
                          <span>{file.uploadedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFiles.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No files found</h3>
                  <p className="text-gray-600 text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Base Stats - Takes 1/3 of the space with fixed height */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-white/20 h-fit">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Knowledge Base Overview</h3>

          {/* File Type Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">File Types</h4>
            <div className="space-y-1">
              {fileStats.map((stat) => (
                <div key={stat.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                    <span className="text-gray-700 text-xs">{stat.type}</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-xs">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Files Summary */}
          <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{files.length}</div>
              <div className="text-[10px] text-gray-600">Total Files in Knowledge Base</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;