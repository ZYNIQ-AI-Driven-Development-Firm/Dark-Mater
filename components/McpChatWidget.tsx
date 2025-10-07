/**
 * MCP Chat Widget - Per-server chat with distributed memory
 * Uses Ollama locally with MCP server for instructions/knowledge/memory
 */
import React, { useState, useRef, useEffect } from 'react';
import { Server, MessageSquare, Loader2, AlertCircle, X, Settings, Brain, Database } from 'lucide-react';
import { createMcpServerClient, type LLMConfig, type KnowledgeSearchResult, type MemoryRetrieveResult } from '../src/clients/mcpServerClient';
import { ollamaApi } from '../src/lib/ollama';
import { renderKnowledge, renderContext, buildSystemMessage, renderProcessingMetadata } from '../src/utils/messageRenderer';

interface McpChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  token_count?: number;
  timestamp: string;
  sources?: string[];
  metadata?: {
    memory_retrieved: number;
    knowledge_used: number;
    processing_time?: number;
  };
}

interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
}

interface McpChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  server: McpServer;
  threadId: string;
  authToken: string;
}

const McpChatWidget: React.FC<McpChatWidgetProps> = ({
  isOpen,
  onClose,
  server,
  threadId,
  authToken
}) => {
  const [messages, setMessages] = useState<McpChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [currentConfig, setCurrentConfig] = useState<LLMConfig | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mcpClientRef = useRef<ReturnType<typeof createMcpServerClient> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      initializeMcpClient();
      loadMessages();
      loadConfig();
    }
  }, [isOpen, server.id, threadId]);

  const initializeMcpClient = () => {
    // Create MCP client with server credentials
    const serverToken = (server.credentials as any)?.authToken || authToken;
    mcpClientRef.current = createMcpServerClient(server.url, serverToken);
  };

  const loadConfig = async () => {
    if (!mcpClientRef.current) return;
    
    try {
      const config = await mcpClientRef.current.getConfig();
      setCurrentConfig(config);
    } catch (err) {
      console.error('Failed to load MCP config:', err);
    }
  };

  const loadMessages = async () => {
    if (!mcpClientRef.current) return;
    
    try {
      setProcessingStage('Loading conversation history...');
      const memoryResult = await mcpClientRef.current.getMemory({
        serverId: server.id,
        threadId,
        limit: 50
      });
      
      const loadedMessages: McpChatMessage[] = memoryResult.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata as any
      }));
      
      setMessages(loadedMessages);
      setMemoryCount(memoryResult.total);
      setProcessingStage('');
      
    } catch (err) {
      console.error('Failed to load MCP messages:', err);
      setProcessingStage('');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !mcpClientRef.current) return;

    const userMessage: McpChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const startTime = Date.now();
      
      // Step 1: Fetch configuration from MCP server
      setProcessingStage('Fetching server configuration...');
      const config = currentConfig || await mcpClientRef.current.getConfig();
      
      // Step 2: Search knowledge base
      setProcessingStage('Searching knowledge base...');
      let knowledgeResult: KnowledgeSearchResult | null = null;
      try {
        knowledgeResult = await mcpClientRef.current.getKnowledge({ 
          q: currentInput, 
          topK: 4 
        });
      } catch (err) {
        console.warn('Knowledge search failed:', err);
      }
      
      // Step 3: Retrieve conversation memory
      setProcessingStage('Retrieving conversation memory...');
      let memoryResult: MemoryRetrieveResult | null = null;
      try {
        memoryResult = await mcpClientRef.current.getMemory({
          serverId: server.id,
          threadId,
          q: currentInput,
          limit: 8
        });
      } catch (err) {
        console.warn('Memory retrieval failed:', err);
      }
      
      // Step 4: Get server context
      setProcessingStage('Loading server context...');
      let context = null;
      try {
        context = await mcpClientRef.current.getContext();
      } catch (err) {
        console.warn('Context retrieval failed:', err);
      }
      
      // Step 5: Build messages array for Ollama using minimal renderer
      setProcessingStage('Preparing AI prompt...');
      const ollamaMessages = buildSystemMessage({
        config,
        context,
        knowledge: knowledgeResult,
        guardrails: config?.tools_allowed || []
      });
      
      // Prior conversation turns from memory
      if (memoryResult && memoryResult.messages.length > 0) {
        memoryResult.messages.forEach(msg => {
          if (msg.role !== 'system') {
            ollamaMessages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }
      
      // Current user message
      ollamaMessages.push({
        role: 'user',
        content: currentInput
      });
      
      // Step 6: Call local Ollama
      setProcessingStage('Generating response with Ollama...');
      const model = config?.runtime_hints?.preferred_model || process.env.MCP_MODEL || 'phi3:mini';
      
      // Use backend Ollama endpoint for streaming
      const response = await fetch('/api/v1/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: true,
          ...config?.runtime_hints
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

      let assistantMessage: McpChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        model_used: model,
        sources: knowledgeResult?.chunks.map(c => c.source) || [],
        metadata: {
          memory_retrieved: memoryResult?.messages.length || 0,
          knowledge_used: knowledgeResult?.chunks.length || 0
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setProcessingStage('Streaming response...');

      // Stream response from Ollama
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message?.content) {
                assistantMessage.content += data.message.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.timestamp === assistantMessage.timestamp && msg.role === 'assistant'
                      ? { ...assistantMessage }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Handle non-JSON chunks
              assistantMessage.content += chunk;
              setMessages(prev => 
                prev.map(msg => 
                  msg.timestamp === assistantMessage.timestamp && msg.role === 'assistant'
                    ? { ...assistantMessage }
                    : msg
                )
              );
            }
          }
        }
      }

      // Step 7: Append both messages to MCP server memory
      setProcessingStage('Saving to memory...');
      try {
        const processingTime = Date.now() - startTime;
        assistantMessage.metadata!.processing_time = processingTime;
        
        await mcpClientRef.current.appendMemory({
          serverId: server.id,
          threadId,
          messages: [
            {
              role: 'user',
              content: currentInput,
              metadata: { timestamp: userMessage.timestamp }
            },
            {
              role: 'assistant',
              content: assistantMessage.content,
              metadata: {
                ...assistantMessage.metadata,
                model_used: assistantMessage.model_used,
                sources: assistantMessage.sources,
                timestamp: assistantMessage.timestamp
              }
            }
          ]
        });
        
        setMemoryCount(prev => prev + 2);
      } catch (err) {
        console.warn('Failed to save to memory:', err);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: McpChatMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMsg]);
      
    } finally {
      setIsLoading(false);
      setProcessingStage('');
      abortControllerRef.current = null;
    }
  };

  const clearThread = async () => {
    try {
      // Clear local messages immediately
      setMessages([]);
      setMemoryCount(0);
      
      // TODO: Add endpoint to clear thread memory on MCP server
      // For now, just clear local state
      console.log('Thread cleared locally. Server-side clearing not implemented yet.');
    } catch (err) {
      console.error('Failed to clear thread:', err);
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

  const getStatusColor = () => {
    switch (server.status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusDot = () => {
    switch (server.status) {
      case 'active': return 'bg-green-400';
      case 'inactive': return 'bg-gray-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-[#63bb33]/30 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#63bb33]/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Server className="h-5 w-5 text-[#63bb33]" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusDot()}`} />
            </div>
            <div>
              <h2 className="text-[#63bb33] font-semibold">{server.name}</h2>
              <p className={`text-sm ${getStatusColor()}`}>
                {server.status} • {memoryCount} memories stored
              </p>
              {currentConfig && (
                <p className="text-xs text-gray-500">
                  Model: {currentConfig.runtime_hints?.preferred_model || 'default'} • 
                  Tools: {currentConfig.tools_allowed?.length || 0}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearThread}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/30 text-red-400 rounded text-sm hover:bg-red-900/50 transition-colors"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chat with {server.name}</p>
                <p className="text-sm mt-1">This conversation is stored on the MCP server</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#63bb33] text-black'
                      : message.role === 'assistant'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-700 text-gray-300 text-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && <Server className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#63bb33]" />}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Minimal metadata display using renderer */}
                      <div className="mt-2 space-y-1" dangerouslySetInnerHTML={{
                        __html: renderProcessingMetadata(message.sources, message.metadata, message.model_used, message.token_count)
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#63bb33]" />
                  <div className="flex flex-col">
                    <span className="text-gray-300">Processing...</span>
                    {processingStage && (
                      <span className="text-xs text-gray-500">{processingStage}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[#63bb33]/30 p-4">
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Send command or question to ${server.name}...`}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#63bb33] focus:outline-none resize-none"
                rows={2}
                disabled={isLoading || server.status !== 'active'}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading || server.status !== 'active'}
                  className="px-4 py-2 bg-[#63bb33] text-black rounded-lg font-medium hover:bg-[#63bb33]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
                {isLoading && (
                  <button
                    onClick={cancelRequest}
                    className="px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {server.status !== 'active' && (
              <p className="text-red-400 text-sm mt-2">
                Server is {server.status}. Cannot send messages.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpChatWidget;