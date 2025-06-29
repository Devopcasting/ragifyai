import React, { useState, useRef } from 'react';
import { Upload, File, Image, FileText, Music, Video, X, Check, Zap, Search } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileUpload: (files: FileData[]) => void;
  onFileUpdate: (fileId: string, updates: Partial<FileData>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onFileUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): FileData['type'] => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    return 'text';
  };

  const getFileIcon = (type: FileData['type']) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const uploadFileToPublic = async (file: File): Promise<any> => {
    // Use the new backend endpoint to upload to public folder
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/documents/upload-to-public', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the full response object with id, filename, etc.
  };

  const processDocumentWithBackend = async (filePath: string, filename: string, documentType: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          filename: filename,
          document_type: documentType.toUpperCase()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  };

  const handleFileUpload = async (fileData: FileData, file: File) => {
    try {
      // Upload file to public folder first to get the backend-generated ID
      const uploadResult = await uploadFileToPublic(file);

      // Update the file data with the backend-generated ID
      const updatedFileData = {
        ...fileData,
        id: uploadResult.id // Use the backend-generated ID
      };

      // Update status to uploading in main state
      onFileUpdate(updatedFileData.id, { status: 'uploading', progress: 0 });

      // Also update local state for UI - replace the old ID with the new one
      setUploadingFiles(prev =>
        prev.map(f => f.id === fileData.id ? { ...f, id: updatedFileData.id, status: 'uploading', progress: 0 } : f)
      );

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onFileUpdate(updatedFileData.id, { progress });
        setUploadingFiles(prev =>
          prev.map(f => f.id === updatedFileData.id ? { ...f, progress } : f)
        );

        // Update progress in database
        await fetch(`http://localhost:8000/api/files/${updatedFileData.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'uploading',
            progress: progress / 100
          })
        });
      }

      // Update status to processing
      onFileUpdate(updatedFileData.id, { status: 'processing' });
      setUploadingFiles(prev =>
        prev.map(f => f.id === updatedFileData.id ? { ...f, status: 'processing' } : f)
      );

      // Update status in database
      await fetch(`http://localhost:8000/api/files/${updatedFileData.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'processing',
          progress: 1.0
        })
      });

      // Wait for processing to complete by polling the file status
      let attempts = 0;
      const maxAttempts = 60; // Wait up to 5 minutes (60 * 5 seconds)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks

        // Update UI to show we're still processing
        setUploadingFiles(prev =>
          prev.map(f => f.id === updatedFileData.id ? {
            ...f,
            status: 'processing',
            progress: Math.min(95, 50 + (attempts * 0.75)) // Show progress from 50% to 95%
          } : f)
        );

        try {
          const response = await fetch(`http://localhost:8000/api/files/${updatedFileData.id}`);
          if (response.ok) {
            const fileRecord = await response.json();

            if (fileRecord.status === 'ready') {
              // Processing completed successfully
              onFileUpdate(updatedFileData.id, { status: 'ready' });
              setUploadingFiles(prev =>
                prev.map(f => f.id === updatedFileData.id ? { ...f, status: 'ready', progress: 100 } : f)
              );

              // Add to main state only after successful processing
              onFileUpload([updatedFileData]);

              // Show success message for longer
              console.log(`File ${updatedFileData.name} is ready for analysis!`);
              break;
            } else if (fileRecord.status === 'error') {
              // Processing failed
              throw new Error(fileRecord.error_message || 'Processing failed');
            }
            // If still processing, continue waiting
          }
        } catch (error) {
          console.error('Error checking file status:', error);
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Processing timed out');
      }

      // Remove from local uploading files after a longer delay to show success message
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== updatedFileData.id));
      }, 15000); // Increased from 5000 to 15000 (15 seconds)

    } catch (error) {
      console.error('Upload error:', error);
      onFileUpdate(fileData.id, { status: 'error' });
      setUploadingFiles(prev =>
        prev.map(f => f.id === fileData.id ? { ...f, status: 'error' } : f)
      );

      // Update error status in database
      await fetch(`http://localhost:8000/api/files/${fileData.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          progress: 0.0,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
      });
    }
  };

  const handleFiles = async (files: FileList) => {
    const newFiles: FileData[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: getFileType(file),
      size: file.size,
      uploadedAt: new Date(),
      status: 'uploading' as const,
      progress: 0
    }));

    // Only keep track in local state for UI during processing
    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    Array.from(files).forEach((file, index) => {
      handleFileUpload(newFiles[index], file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
    // Note: We don't remove from main state here as the file might still be processing
    // The main state should reflect all files that have been uploaded
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">Upload Documents</h1>
          <p className="text-gray-600 mt-1">Add files to your knowledge base for AI analysis</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
          <Zap className="w-4 h-4" />
          <span>Local processing</span>
        </div>
      </div>

      {/* Two Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full w-full">
        {/* Upload Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 min-w-0 w-full overflow-hidden">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400 bg-white/50'
              }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov"
            />

            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-100 scale-110' : 'bg-gray-100'
                }`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragging ? 'Drop your files here' : 'Upload your documents'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Support for PDF, images, text files, audio, and video
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105"
                  >
                    Choose Files
                  </button>

                  <p className="text-gray-500 text-sm">or drag and drop files here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 overflow-hidden">
              {[
                { icon: <FileText className="w-4 h-4" />, label: 'PDF', color: 'text-red-500' },
                { icon: <Image className="w-4 h-4" />, label: 'Images', color: 'text-green-500' },
                { icon: <File className="w-4 h-4" />, label: 'Text', color: 'text-blue-500' },
                { icon: <Music className="w-4 h-4" />, label: 'Audio', color: 'text-purple-500' },
                { icon: <Video className="w-4 h-4" />, label: 'Video', color: 'text-orange-500' }
              ].map((format, index) => (
                <div key={index} className="flex items-center space-x-1 p-2 bg-white rounded-md border border-gray-200 flex-shrink-0">
                  <div className={format.color}>{format.icon}</div>
                  <span className="font-medium">{format.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 min-w-0 w-full overflow-hidden h-96">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Features & Capabilities</h3>

          <div className="space-y-3">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                title: 'AI Processing',
                desc: 'Automatic content analysis and extraction',
                color: 'text-blue-500 bg-blue-100'
              },
              {
                icon: <File className="w-4 h-4" />,
                title: 'Local Storage',
                desc: 'Files stored securely on your device',
                color: 'text-green-500 bg-green-100'
              },
              {
                icon: <Search className="w-4 h-4" />,
                title: 'Smart Search',
                desc: 'Semantic search across all documents',
                color: 'text-purple-500 bg-purple-100'
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.color}`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{feature.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{feature.desc}</div>
                </div>
              </div>
            ))}

            {/* Quick Stats */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Ready to analyze</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-blue-600">PDF</div>
                    <div className="text-[10px] text-gray-500">Documents</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-600">IMG</div>
                    <div className="text-[10px] text-gray-500">Images</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-600">A/V</div>
                    <div className="text-[10px] text-gray-500">Media</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Files Section - Moved below the main cards */}
      {uploadingFiles.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Processing Files</h3>
          <div className="space-y-3">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 text-gray-500">
                  {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center space-x-2">
                      {file.status === 'ready' && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      <button
                        onClick={() => removeUploadingFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Uploading...</span>
                        <span>{file.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {file.status === 'processing' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Processing with AI...</span>
                        <span>{Math.round(file.progress || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-[10px] text-blue-600 flex items-center space-x-2">
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Extracting text and generating embeddings...</span>
                      </div>
                    </div>
                  )}

                  {file.status === 'ready' && (
                    <div className="mt-2">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Ready for analysis!</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Your document has been processed and is now available for AI analysis.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;