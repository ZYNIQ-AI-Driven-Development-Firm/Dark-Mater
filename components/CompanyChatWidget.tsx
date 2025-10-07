/**
 * Company Chat Widget - Shared knowledge chat with RAG
 */
import React, { useState, useRef, useEffect } from 'react';
import { User, MessageSquare, Loader2, AlertCircle, BookOpen, X } from 'lucide-react';

interface CompanyChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  token_count?: number;
  created_at: string;
}

interface CompanyChatSource {
  id: string;
  title: string;
  source: string;
  source_type: string;
  similarity: number;
}

interface CompanyChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  authToken: string;
}

const CompanyChatWidget: React.FC<CompanyChatWidgetProps> = ({
  isOpen,
  onClose,
  userId,
  authToken
}) => {
  const [messages, setMessages] = useState<CompanyChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sources, setSources] = useState<CompanyChatSource[]>([]);
  const [showSources, setShowSources] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !threadId) {
      createThread();
    }
  }, [isOpen]);

  const createThread = async () => {
    try {
      setError(null); // Clear any previous errors
      
      const response = await fetch('/api/v1/company-chat/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Company Chat Session'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setThreadId(data.id);
      
      // Load existing messages if any
      await loadMessages(data.id);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to initialize chat session';
      console.error('Thread creation error:', err);
      setError(`Chat initialization failed: ${errorMessage}`);
      
      // Add a system message about the error
      const systemMessage: CompanyChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `⚠️ Unable to connect to chat service. Please check your connection and try refreshing the page. If the problem persists, contact support.`,
        created_at: new Date().toISOString()
      };
      setMessages([systemMessage]);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/v1/company-chat/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !threadId || isLoading) return;

    const userMessage: CompanyChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setError(null);
    setSources([]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/v1/company-chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          text: currentInput
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage: CompanyChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Update the assistant message with accumulated content
        assistantMessage.content += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...assistantMessage }
              : msg
          )
        );

        // Extract sources from content if present
        extractSourcesFromContent(assistantMessage.content);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: CompanyChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMsg]);
      
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const extractSourcesFromContent = (content: string) => {
    // Extract source citations from content like [Source: handbook_v2] 
    const sourceRegex = /\[Source: ([^\]]+)\]/g;
    const matches = [...content.matchAll(sourceRegex)];
    
    if (matches.length > 0) {
      const extractedSources: CompanyChatSource[] = matches.map((match, index) => ({
        id: `source_${index}`,
        title: match[1],
        source: match[1], 
        source_type: 'document',
        similarity: 0.8 // Placeholder
      }));
      
      setSources(extractedSources);
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 187, 51, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 187, 51, 0.7);
        }
      `}</style>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-[#63bb33]/50 rounded-xl shadow-2xl shadow-[#63bb33]/20 w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Enhanced Animated border effects */}
        <div className="absolute inset-0 rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#63bb33]/20 via-transparent to-[#529f27]/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-[#63bb33]/5 to-transparent"></div>
          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#63bb33]/60 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#63bb33]/60 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#63bb33]/60 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#63bb33]/60 rounded-br-lg"></div>
        </div>
        
        <div className="absolute inset-[2px] rounded-xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 z-10 flex flex-col">
          
          {/* Enhanced Header */}
          <div className="border-b border-[#63bb33]/40 p-5 flex items-center justify-between bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm relative">
            {/* Subtle header glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#63bb33]/5 via-transparent to-[#529f27]/5"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="p-4 rounded-full bg-gradient-to-r from-[#63bb33]/30 to-[#529f27]/30 border-2 border-[#63bb33]/60 shadow-lg shadow-[#63bb33]/30">
                  <MessageSquare className="h-7 w-7 text-[#63bb33]" />
                </div>
                {/* Enhanced Connection indicator */}
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-[#63bb33] to-[#529f27] animate-pulse"></div>
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#63bb33]/30 animate-ping opacity-60"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#63bb33] font-mono tracking-wider mb-1">
                  [TCHIKO AI v1.0]
                </h2>
                <div className="flex items-center space-x-3 text-sm text-gray-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#63bb33] rounded-full animate-pulse shadow-lg shadow-[#63bb33]/50"></span>
                    <span>Company Knowledge Assistant</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  <span>{messages.length} messages</span>
                  {threadId && (
                    <>
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <span className="text-xs opacity-60">ID: {threadId.slice(-8)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              {sources.length > 0 && (
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#63bb33]/20 to-[#529f27]/20 text-[#63bb33] rounded-lg text-sm hover:from-[#63bb33]/30 hover:to-[#529f27]/30 transition-all duration-300 border border-[#63bb33]/40 font-mono shadow-lg backdrop-blur-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>[{sources.length}] SOURCES</span>
                  <div className="w-2 h-2 bg-[#63bb33] rounded-full animate-pulse ml-1"></div>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 transition-all duration-300 p-3 rounded-full hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20 border border-transparent hover:border-red-500/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

        <div className="flex-1 flex">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {/* Enhanced Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-900/20">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="relative mb-6">
                    <MessageSquare className="h-16 w-16 mx-auto opacity-30" />
                    <div className="absolute inset-0 animate-ping">
                      <MessageSquare className="h-16 w-16 mx-auto opacity-10" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-[#63bb33] mb-2 font-mono">[TCHIKO AI READY]</h3>
                  <p className="text-gray-400 mb-1">Hello! I'm Tchiko, your company knowledge assistant.</p>
                  <p className="text-sm text-gray-500">Ask me anything about policies, documentation, procedures, or general company information.</p>
                  <div className="mt-6 text-xs text-gray-600 font-mono bg-gray-800/30 rounded-lg p-3 max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-[#63bb33] rounded-full animate-pulse"></div>
                      <span>RAG Search Active</span>
                    </div>
                    <div className="text-left space-y-1">
                      <div>• Company policies & procedures</div>
                      <div>• Technical documentation</div>
                      <div>• Team knowledge base</div>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`max-w-[85%] rounded-xl relative ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#63bb33] to-[#529f27] text-black shadow-lg shadow-[#63bb33]/20'
                        : message.role === 'assistant'
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-[#63bb33]/20 shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 text-sm border border-gray-600/30'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {message.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#63bb33]/30 to-[#529f27]/30 border border-[#63bb33]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MessageSquare className="h-4 w-4 text-[#63bb33]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-mono text-xs mb-2 opacity-70 ${
                            message.role === 'user' ? 'text-black/70' : 'text-gray-400'
                          }`}>
                            {message.role === 'user' ? '[USER]' : '[ASSISTANT]'}
                            <span className="ml-2 font-sans">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          </div>
                          {message.token_count && (
                            <div className="flex items-center gap-2 mt-3 text-xs opacity-60">
                              <div className="w-1 h-1 bg-current rounded-full"></div>
                              <span>{message.token_count} tokens</span>
                              {message.model_used && (
                                <>
                                  <div className="w-1 h-1 bg-current rounded-full"></div>
                                  <span>{message.model_used}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Message decoration */}
                    {message.role === 'assistant' && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#63bb33]/40 rounded-tl-lg"></div>
                    )}
                    {message.role === 'user' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-black/20 rounded-tr-lg"></div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-[#63bb33]/20 rounded-xl p-4 flex items-center gap-3 shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#63bb33]/30 to-[#529f27]/30 border border-[#63bb33]/50 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-[#63bb33]" />
                    </div>
                    <div>
                      <div className="text-[#63bb33] font-mono text-sm mb-1">[PROCESSING]</div>
                      <div className="text-gray-300 text-sm">Analyzing query and searching knowledge base...</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Error Display */}
            {error && (
              <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-red-900/40 to-red-800/40 border-2 border-red-500/60 rounded-xl flex items-center gap-3 shadow-lg shadow-red-500/20">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-red-300 font-mono text-sm font-semibold mb-1">[ERROR]</div>
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Enhanced Input Area */}
            <div className="border-t border-[#63bb33]/40 p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about company policies, procedures, technical docs, or general questions..."
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-[#63bb33]/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#63bb33] focus:outline-none focus:ring-2 focus:ring-[#63bb33]/20 resize-none transition-all duration-300 shadow-lg backdrop-blur-sm font-mono text-sm"
                    rows={3}
                    disabled={isLoading}
                  />
                  {/* Input decoration */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>{inputText.length}/4000</span>
                    {inputText.trim() && (
                      <div className="w-2 h-2 bg-[#63bb33] rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-[#63bb33] to-[#529f27] text-black rounded-xl font-semibold hover:from-[#63bb33]/90 hover:to-[#529f27]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-[#63bb33]/20 border border-[#63bb33]/30 min-w-[100px] relative overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">SENDING</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span className="hidden sm:inline">SEND</span>
                        </>
                      )}
                    </div>
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#63bb33]/20 to-[#529f27]/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  {isLoading && (
                    <button
                      onClick={cancelRequest}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/20 font-semibold"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>
              
              {/* Input help text */}
              <div className="mt-3 text-xs text-gray-500 font-mono flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>Press Enter + Shift for new line</span>
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  <span>Enter to send</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#63bb33] rounded-full animate-pulse"></div>
                  <span>RAG Search Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Sources Panel */}
          {showSources && sources.length > 0 && (
            <div className="w-96 border-l border-[#63bb33]/40 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#63bb33] font-bold font-mono text-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#63bb33]/30 to-[#529f27]/30 border border-[#63bb33]/50 flex items-center justify-center">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    [SOURCES]
                  </h3>
                  <div className="text-xs text-gray-400 font-mono bg-[#63bb33]/10 px-2 py-1 rounded-full border border-[#63bb33]/20">
                    {sources.length} found
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {sources.map((source, index) => (
                    <div 
                      key={source.id} 
                      className="bg-gradient-to-r from-gray-800 to-gray-700 border border-[#63bb33]/20 rounded-xl p-4 shadow-lg hover:border-[#63bb33]/40 transition-all duration-300 relative"
                    >
                      {/* Source number badge */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-[#63bb33] to-[#529f27] text-black rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        {index + 1}
                      </div>
                      
                      <div className="ml-2">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold text-sm pr-2 leading-tight">{source.title}</h4>
                          <div className="text-xs font-mono text-[#63bb33] bg-[#63bb33]/10 px-2 py-1 rounded-full border border-[#63bb33]/20 whitespace-nowrap">
                            {Math.round(source.similarity * 100)}%
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-[#63bb33]/60 rounded-full"></div>
                            <span className="font-mono">{source.source_type.toUpperCase()}</span>
                          </div>
                          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                          <span className="truncate max-w-[200px]">{source.source}</span>
                        </div>
                        
                        {/* Similarity indicator */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-gradient-to-r from-[#63bb33] to-[#529f27] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round(source.similarity * 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-xs text-gray-400 font-mono">
                          Relevance: <span className="text-[#63bb33]">
                            {source.similarity > 0.8 ? 'High' : source.similarity > 0.6 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CompanyChatWidget;