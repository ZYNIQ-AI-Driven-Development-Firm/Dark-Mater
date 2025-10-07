import React, { useState, useEffect, useRef } from 'react';
import { CollapseIcon } from './icons/CollapseIcon';
import TaskGraph from './TaskGraph';
import { SendIcon } from './icons/SendIcon';
import { createWebSocketClient, WebSocketClient, ChatMessage, LogEntry, ConnectionStatus } from '../src/lib/websocket';
import { serversApi } from '../src/lib/api';
import type { McpServer } from '../src/types/api';

interface ServerWindowProps {
  server: McpServer | null;
  isOpen: boolean;
  onClose: () => void;
  onServerDeleted?: (serverId: string) => void;
}

const ServerWindow: React.FC<ServerWindowProps> = ({ server, isOpen, onClose, onServerDeleted }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'offline' });
  const [inputValue, setInputValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when messages/logs update
  useEffect(() => scrollToBottom(chatEndRef), [messages]);
  useEffect(() => scrollToBottom(logEndRef), [logs]);

  // Initialize WebSocket connection when server changes
  useEffect(() => {
    if (server && isOpen) {
      initializeWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [server, isOpen]);

  // Clean up when component unmounts or window closes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when window is closed
      const resetTimer = setTimeout(() => {
        setMessages([]);
        setLogs([]);
        setShowGraph(false);
        setConnectionStatus({ status: 'offline' });
        setInputValue('');
      }, 300);

      return () => clearTimeout(resetTimer);
    }
  }, [isOpen]);

  const initializeWebSocket = async () => {
    if (!server) return;

    try {
      setIsConnecting(true);
      
      // Disconnect existing connection
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }

      // Create new WebSocket client
      const wsClient = createWebSocketClient(server.id);
      wsClientRef.current = wsClient;

      // Set up event handlers
      wsClient.on('connection_status', handleConnectionStatus);
      wsClient.on('chat_message', handleChatMessage);
      wsClient.on('agent_response', handleAgentResponse);
      wsClient.on('task_graph_update', handleTaskGraphUpdate);
      wsClient.on('log_entry', handleLogEntry);
      wsClient.on('system_message', handleSystemMessage);

      // Connect
      await wsClient.connect();
      
      // Add initial system log
      const connectTime = new Date().toLocaleTimeString();
      addLog('info', `Connected to ${server.name} at ${connectTime}`);
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionStatus({ status: 'error' });
      addLog('error', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    setConnectionStatus({ status: 'offline' });
  };

  const handleConnectionStatus = (message: any) => {
    const status = message.payload as ConnectionStatus;
    setConnectionStatus(status);
    
    if (status.status === 'online') {
      addLog('info', 'Connection established successfully');
    } else if (status.status === 'error') {
      addLog('error', 'Connection error occurred');
    }
  };

  const handleChatMessage = (message: any) => {
    const chatMsg = message.payload as ChatMessage;
    setMessages(prev => [...prev, chatMsg]);
  };

  const handleAgentResponse = (message: any) => {
    const { text, requires_approval = false, task_id } = message.payload;
    const timestamp = new Date().toLocaleTimeString();
    
    const agentMessage: ChatMessage = {
      sender: 'AGENT',
      text,
      timestamp
    };
    
    setMessages(prev => [...prev, agentMessage]);
    addLog('info', `Agent responded: ${requires_approval ? 'Awaiting approval' : 'Task completed'}`);
    
    if (requires_approval || task_id) {
      setShowGraph(true);
    }
  };

  const handleTaskGraphUpdate = (message: any) => {
    setShowGraph(true);
    addLog('info', 'Task graph updated');
  };

  const handleLogEntry = (message: any) => {
    const logEntry = message.payload as LogEntry;
    setLogs(prev => [...prev, logEntry]);
  };

  const handleSystemMessage = (message: any) => {
    const { text, level = 'info' } = message.payload;
    const timestamp = new Date().toLocaleTimeString();
    
    const systemMessage: ChatMessage = {
      sender: 'SYSTEM',
      text,
      timestamp
    };
    
    setMessages(prev => [...prev, systemMessage]);
    addLog(level, text);
  };

  const addLog = (level: 'info' | 'warning' | 'error', message: string) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev, logEntry]);
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !wsClientRef.current?.isConnected()) {
      return;
    }

    try {
      const timestamp = new Date().toLocaleTimeString();
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        sender: 'USER',
        text: inputValue,
        timestamp
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to WebSocket server
      wsClientRef.current.sendChatMessage(inputValue);
      
      // Add to logs
      addLog('info', `User message sent: "${inputValue}"`);
      
      // Clear input
      setInputValue('');
      
    } catch (error) {
      console.error('Failed to send message:', error);
      addLog('error', `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'online': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (isConnecting) return 'CONNECTING';
    return connectionStatus?.status?.toUpperCase() || 'UNKNOWN';
  };

  const formatLogEntry = (log: LogEntry) => {
    const levelColor = log.level === 'error' ? 'text-red-400' : 
                      log.level === 'warning' ? 'text-yellow-400' : 
                      'text-gray-300';
    return `[${log.timestamp}] ${log.level?.toUpperCase() || 'INFO'}: ${log.message}`;
  };

  const handleDeleteServer = async () => {
    if (!server) return;
    
    setIsDeleting(true);
    try {
      await serversApi.delete(server.id);
      addLog('info', `Server ${server.name} disconnected successfully`);
      
      // Close WebSocket connection
      disconnectWebSocket();
      
      // Notify parent component
      if (onServerDeleted) {
        onServerDeleted(server.id);
      }
      
      // Close window
      onClose();
    } catch (error) {
      console.error('Failed to disconnect server:', error);
      addLog('error', `Failed to disconnect server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!server) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col p-4 md:p-6 text-gray-300 font-mono transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Header and Close Button */}
      <div className="flex-shrink-0 flex items-start justify-between mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <h2 className="text-lg text-[#63bb33]">[ SESSION: {server.name} ]</h2>
          <p>STATUS: <span className={getStatusColor()}>{getStatusText()}</span></p>
          <p>LATENCY: <span className="text-white">{connectionStatus.latency ? `${connectionStatus.latency}ms` : '--'}</span></p>
          <p>MODEL: <span className="text-white">MCP Server</span></p>
          <p>MEMORY: <span className="text-white">256MB / 1024MB</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1 text-xs bg-orange-900/30 border border-orange-500/50 text-orange-300 hover:bg-orange-900/50 hover:text-orange-200 transition-colors rounded"
            aria-label="Disconnect server"
            disabled={isDeleting}
          >
            {isDeleting ? 'DISCONNECTING...' : 'DISCONNECT'}
          </button>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-[#63bb33] transition-colors"
            aria-label="Close window"
          >
            <CollapseIcon className="w-7 h-7" />
          </button>
        </div>
      </div>
      
      {/* Connection Error Message */}
      {connectionStatus.status === 'error' && (
        <div className="flex-shrink-0 mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">
          Connection failed. WebSocket communication is not available.
          <button 
            onClick={initializeWebSocket}
            className="ml-2 underline hover:text-red-200"
            disabled={isConnecting}
          >
            {isConnecting ? 'Reconnecting...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="flex-shrink-0 mb-4 p-4 bg-orange-900/20 border border-orange-500/50 rounded">
          <p className="text-orange-300 mb-3">
            Are you sure you want to disconnect server <span className="text-white font-bold">{server.name}</span>?
          </p>
          <p className="text-orange-400 text-sm mb-4">
            This will remove the server from your workspace. You can reconnect it later if needed.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleDeleteServer}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? 'Disconnecting...' : 'Yes, Disconnect'}
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Left: Chat + Tools */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-grow flex flex-col bg-gray-900/30 border border-[#63bb33]/20 p-3 min-h-0">
            <h3 className="text-sm text-[#63bb33] mb-3 flex-shrink-0">[ CHAT ]</h3>
            <div className="flex-grow overflow-y-auto text-xs space-y-3 pr-2">
              {messages.map((msg, index) => (
                <div key={index}>
                  <p className={`font-bold ${
                    msg.sender === 'USER' ? 'text-[#63bb33]' : 
                    msg.sender === 'AGENT' ? 'text-purple-400' : 
                    'text-gray-500'
                  }`}>
                    {msg.sender} @ {msg.timestamp}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="flex-shrink-0 bg-gray-900/30 border border-[#63bb33]/20 p-3">
            <h3 className="text-sm text-[#63bb33] mb-3">[ TOOLS ]</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="text-left p-1 hover:bg-[#63bb33]/20 rounded">File Upload</button>
              <button className="text-left p-1 hover:bg-[#63bb33]/20 rounded">Function Call</button>
              <button className="text-left p-1 hover:bg-[#63bb33]/20 rounded">Database</button>
              <button className="text-left p-1 hover:bg-[#63bb33]/20 rounded">API Endpoint</button>
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center gap-2">
            <input 
              type="text" 
              placeholder={connectionStatus.status === 'online' ? "> Send a message to the agent..." : "> Not connected"}
              className="flex-grow bg-transparent border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] py-2 px-1 disabled:opacity-50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={connectionStatus.status !== 'online' || isConnecting}
            />
            <button 
              type="submit" 
              className="p-2 text-gray-500 hover:text-[#63bb33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="Send message"
              disabled={connectionStatus.status !== 'online' || isConnecting || !inputValue.trim()}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>

        {/* Center: Task Graph */}
        <div className="lg:col-span-2 overflow-hidden">
          {showGraph ? (
            <TaskGraph />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900/30 border border-dashed border-[#63bb33]/20 p-4">
              <p className="text-gray-500">Task graph will appear here after the first message.</p>
            </div>
          )}
        </div>

        {/* Right: Logs + Artifacts */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-grow flex flex-col bg-gray-900/30 border border-[#63bb33]/20 p-3 min-h-0">
            <h3 className="text-sm text-[#63bb33] mb-3 flex-shrink-0">[ LIVE LOGS ]</h3>
            <div className="flex-grow overflow-y-auto text-xs space-y-1 pr-2">
              {logs.map((log, index) => (
                <p key={index} className={`whitespace-pre-wrap break-words ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {formatLogEntry(log)}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
          <div className="flex-shrink-0 bg-gray-900/30 border border-dashed border-[#63bb33]/20 p-3 h-1/3">
            <h3 className="text-sm text-[#63bb33] mb-3">[ ARTIFACTS ]</h3>
            <div className="text-center text-xs text-gray-500 mt-4">
              Generated files will appear here.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServerWindow;
