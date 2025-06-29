import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Download } from 'lucide-react';

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    logger: string;
}

interface LogResponse {
    entries: LogEntry[];
    total_count: number;
    log_file: string;
    start_time?: string;
    end_time?: string;
}

interface LogStats {
    total_logs: number;
    error_count: number;
    api_requests: number;
    document_uploads: number;
    chat_messages: number;
    last_24h_requests: number;
}

const LogViewer: React.FC = () => {
    const [logFiles, setLogFiles] = useState<string[]>([]);
    const [selectedLogFile, setSelectedLogFile] = useState<string>('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [lines, setLines] = useState(100);
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [autoRefresh, setAutoRefresh] = useState(false);

    const API_BASE = 'http://localhost:8000/api';

    useEffect(() => {
        fetchLogFiles();
        fetchStats();
    }, []);

    useEffect(() => {
        if (selectedLogFile) {
            fetchLogs();
        }
    }, [selectedLogFile, lines, levelFilter, startTime, endTime]);

    useEffect(() => {
        let interval: number;
        if (autoRefresh && selectedLogFile) {
            interval = window.setInterval(() => {
                fetchLogs();
                fetchStats();
            }, 5000); // Refresh every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, selectedLogFile]);

    const fetchLogFiles = async () => {
        try {
            const response = await fetch(`${API_BASE}/logs/files`);
            if (response.ok) {
                const files = await response.json();
                setLogFiles(files);
                if (files.length > 0 && !selectedLogFile) {
                    setSelectedLogFile(files[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching log files:', error);
        }
    };

    const fetchLogs = async () => {
        if (!selectedLogFile) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                lines: lines.toString(),
                ...(levelFilter && { level: levelFilter }),
                ...(startTime && { start_time: startTime }),
                ...(endTime && { end_time: endTime })
            });

            const response = await fetch(`${API_BASE}/logs/${selectedLogFile}?${params}`);
            if (response.ok) {
                const data: LogResponse = await response.json();
                setLogs(data.entries);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/logs/stats/overview`);
            if (response.ok) {
                const data: LogStats = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const clearLogFile = async () => {
        if (!selectedLogFile) return;

        try {
            const response = await fetch(`${API_BASE}/logs/${selectedLogFile}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchLogs();
                fetchStats();
            }
        } catch (error) {
            console.error('Error clearing log file:', error);
        }
    };

    const clearAllLogs = async () => {
        try {
            const response = await fetch(`${API_BASE}/logs/`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchLogFiles();
                fetchStats();
            }
        } catch (error) {
            console.error('Error clearing all logs:', error);
        }
    };

    const downloadLogs = () => {
        if (!selectedLogFile) return;

        const logContent = logs.map(log =>
            `${log.timestamp} - ${log.logger} - ${log.level} - ${log.message}`
        ).join('\n');

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedLogFile}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return 'bg-red-100 text-red-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'info': return 'bg-blue-100 text-blue-800';
            case 'debug': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.total_logs}</div>
                            <div className="text-sm text-gray-600">Total Logs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.error_count}</div>
                            <div className="text-sm text-gray-600">Errors</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.api_requests}</div>
                            <div className="text-sm text-gray-600">API Requests</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.document_uploads}</div>
                            <div className="text-sm text-gray-600">Uploads</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{stats.chat_messages}</div>
                            <div className="text-sm text-gray-600">Chat Messages</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{stats.last_24h_requests}</div>
                            <div className="text-sm text-gray-600">24h Requests</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Controls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Log File</label>
                        <select
                            value={selectedLogFile}
                            onChange={(e) => setSelectedLogFile(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {logFiles.map(file => (
                                <option key={file} value={file}>{file}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Lines</label>
                        <input
                            type="number"
                            value={lines}
                            onChange={(e) => setLines(parseInt(e.target.value) || 100)}
                            min="1"
                            max="1000"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Level Filter</label>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All levels</option>
                            <option value="ERROR">Error</option>
                            <option value="WARNING">Warning</option>
                            <option value="INFO">Info</option>
                            <option value="DEBUG">Debug</option>
                        </select>
                    </div>

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-3 py-2 border rounded-lg ${autoRefresh ? 'bg-green-100 border-green-300' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                            Auto
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex space-x-2 mt-4">
                    <button onClick={downloadLogs} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </button>
                    <button onClick={clearLogFile} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear File
                    </button>
                    <button onClick={clearAllLogs} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </button>
                </div>
            </div>

            {/* Log Display */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Logs: {selectedLogFile} ({logs.length} entries)
                </h2>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="space-y-2">
                        {logs.map((log, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                                                {log.level}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                [{log.logger}]
                                            </span>
                                        </div>
                                        <div className="text-sm font-mono break-words">
                                            {log.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No logs found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogViewer; 