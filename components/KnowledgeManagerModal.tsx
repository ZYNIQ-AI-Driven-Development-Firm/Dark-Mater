import React, { useState, useEffect } from 'react';
import type { McpServer } from '../src/types/api';
import { createMcpServerClient, type KnowledgeSearchResult, type DocumentMetadata } from '../src/clients/mcpServerClient';

interface KnowledgeManagerModalProps {
  server: McpServer | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentEntry {
  id: string;
  title: string;
  source: string;
  content_type: string;
  created_at?: string;
  chunk_count?: number;
}

export default function KnowledgeManagerModal({ server, isOpen, onClose }: KnowledgeManagerModalProps) {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'upload'>('documents');
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    source: '',
    content_type: 'text/plain',
    content: '',
    tags: ''
  });

  const mcpClientRef = React.useRef<ReturnType<typeof createMcpServerClient> | null>(null);

  useEffect(() => {
    if (server && isOpen) {
      const serverToken = (server.credentials as any)?.authToken;
      mcpClientRef.current = createMcpServerClient(server.url, serverToken);
      loadDocuments();
    }
  }, [server, isOpen]);

  const loadDocuments = async () => {
    if (!mcpClientRef.current) return;
    
    setIsLoading(true);
    try {
      const result = await mcpClientRef.current.getDocuments(50, 0);
      setDocuments(result.docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!mcpClientRef.current || !searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await mcpClientRef.current.getKnowledge({
        q: searchQuery,
        topK: 10
      });
      setSearchResults(result);
    } catch (error) {
      console.error('Failed to search knowledge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!mcpClientRef.current || !uploadForm.title.trim() || !uploadForm.content.trim()) return;
    
    setIsUploading(true);
    try {
      // Upload document metadata
      const docResult = await mcpClientRef.current.uploadDocumentMetadata({
        title: uploadForm.title,
        source: uploadForm.source || uploadForm.title,
        content_type: uploadForm.content_type,
        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t),
        metadata: {
          uploaded_at: new Date().toISOString(),
          uploaded_by: 'dashboard_user'
        }
      });

      // Upload content as single chunk
      await mcpClientRef.current.uploadDocumentChunks(docResult.id, [
        {
          content: uploadForm.content,
          position: 0,
          metadata: {
            content_type: uploadForm.content_type,
            char_count: uploadForm.content.length
          }
        }
      ]);

      // Reset form and reload documents
      setUploadForm({
        title: '',
        source: '',
        content_type: 'text/plain',
        content: '',
        tags: ''
      });
      
      await loadDocuments();
      setActiveTab('documents');
      
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!mcpClientRef.current) return;
    
    try {
      await mcpClientRef.current.deleteDocument(docId);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  if (!isOpen || !server) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 to-blue-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Knowledge Manager</h2>
                <p className="text-gray-400 text-sm">{server.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 px-6">
          <div className="flex space-x-8">
            {[
              { id: 'documents', label: 'Documents', icon: '📄' },
              { id: 'search', label: 'Search', icon: '🔍' },
              { id: 'upload', label: 'Upload', icon: '📤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-white">Document Library</h3>
                <button
                  onClick={loadDocuments}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-md text-blue-400 hover:bg-blue-600/30 text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {documents.length === 0 && !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No documents uploaded yet</p>
                  <p className="text-sm mt-1">Use the Upload tab to add knowledge documents</p>
                </div>
              )}

              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{doc.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">Source: {doc.source}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Type: {doc.content_type}</span>
                          {doc.chunk_count && <span>Chunks: {doc.chunk_count}</span>}
                          {doc.created_at && (
                            <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-4 p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search knowledge base..."
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">
                      Search Results ({searchResults.total} found)
                    </h4>
                    <span className="text-xs text-gray-500">
                      Query: "{searchResults.query}"
                    </span>
                  </div>

                  {searchResults.chunks.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <p>No matching content found</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {searchResults.chunks.map((chunk, index) => (
                      <div key={chunk.id || index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-blue-400 text-sm font-medium">
                            {chunk.source}
                          </span>
                          {chunk.score && (
                            <span className="text-xs text-gray-500">
                              Score: {(chunk.score * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Upload Document</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document Title</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="My Important Document"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                  <input
                    type="text"
                    value={uploadForm.source}
                    onChange={(e) => setUploadForm({ ...uploadForm, source: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="company_docs/manual.pdf"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                  <select
                    value={uploadForm.content_type}
                    onChange={(e) => setUploadForm({ ...uploadForm, content_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="text/plain">Plain Text</option>
                    <option value="text/markdown">Markdown</option>
                    <option value="application/json">JSON</option>
                    <option value="text/csv">CSV</option>
                    <option value="application/pdf">PDF</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="manual, procedures, important"
                  />
                  <p className="text-gray-500 text-xs mt-1">Comma-separated tags</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={uploadForm.content}
                  onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-48 resize-none font-mono text-sm"
                  placeholder="Paste your document content here..."
                />
                <p className="text-gray-500 text-xs mt-1">
                  {uploadForm.content.length} characters
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadForm.title.trim() || !uploadForm.content.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}