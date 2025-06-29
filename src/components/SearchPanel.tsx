import React, { useState } from 'react';
import { Search, Filter, FileText, Calendar, Tag, ArrowUpDown } from 'lucide-react';
import { FileData, SearchResult } from '../types';

interface SearchPanelProps {
  files: FileData[];
}

const SearchPanel: React.FC<SearchPanelProps> = ({ files }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const fileTypes = [
    { value: 'pdf', label: 'PDF', count: files.filter(f => f.type === 'pdf').length },
    { value: 'image', label: 'Images', count: files.filter(f => f.type === 'image').length },
    { value: 'audio', label: 'Audio', count: files.filter(f => f.type === 'audio').length },
    { value: 'video', label: 'Video', count: files.filter(f => f.type === 'video').length },
    { value: 'text', label: 'Text', count: files.filter(f => f.type === 'text').length },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        fileId: files[0]?.id || '1',
        fileName: files[0]?.name || 'Sample Document.pdf',
        content: `...${searchQuery} appears multiple times in this document with relevant context about the topic...`,
        score: 0.95,
        highlightedContent: `...${searchQuery} appears multiple times in this document with relevant context about the topic...`
      },
      {
        id: '2',
        fileId: files[1]?.id || '2',
        fileName: files[1]?.name || 'Research Notes.txt',
        content: `This section mentions ${searchQuery} in relation to important findings and conclusions...`,
        score: 0.87,
        highlightedContent: `This section mentions ${searchQuery} in relation to important findings and conclusions...`
      }
    ].filter((_, index) => index < files.length);

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Search Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Search</h2>
        
        {/* Main Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search across all your documents..."
            className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md font-medium transition-colors text-sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File Types</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {fileTypes.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFileTypes.includes(type.value)}
                    onChange={() => toggleFileType(type.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {type.label} ({type.count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Searching through your documents...</p>
          </div>
        )}

        {searchResults.length > 0 && !isSearching && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results ({searchResults.length})
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ArrowUpDown className="w-4 h-4" />
                <span>Sorted by {sortBy}</span>
              </div>
            </div>

            <div className="space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900 text-sm">{result.fileName}</h4>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {Math.round(result.score * 100)}% match
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                    {result.highlightedContent}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Found in document content</span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View in context →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4 text-sm">
              No matches found for "{searchQuery}". Try different keywords or adjust your filters.
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Clear filters and try again
            </button>
          </div>
        )}

        {!searchQuery && files.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files to search</h3>
            <p className="text-gray-600 text-sm">Upload some documents first to start searching through your content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;