import React, { useState, useEffect } from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { PlusIcon } from './icons/PlusIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { ServerIcon } from './icons/ServerIcon';
import AddClientModal from './AddClientModal';
import ProfileModal from './ProfileModal';
import ServerWindow from './ServerWindow';
import { serversApi } from '../src/lib/api';
import { ollamaApi, type OllamaStatus } from '../src/lib/ollama';
import type { McpServer } from '../src/types/api';
import CompanyChatWidget from './CompanyChatWidget';
import McpChatWidget from './McpChatWidget';
import ServerSettingsModal from './ServerSettingsModal';
import AIInstructionsModal from './AIInstructionsModal';
import KnowledgeManagerModal from './KnowledgeManagerModal';

interface MainPageProps {
  onLogout: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeServer, setActiveServer] = useState<McpServer | null>(null);
  const [connectedServers, setConnectedServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('user@example.com');
  const [isCompanyChatOpen, setIsCompanyChatOpen] = useState(false);
  const [activeMcpChat, setActiveMcpChat] = useState<{ server: McpServer; threadId: string } | null>(null);
  const [serverSettings, setServerSettings] = useState<{ server: McpServer; isOpen: boolean } | null>(null);
  const [serverAIInstructions, setServerAIInstructions] = useState<{ server: McpServer; isOpen: boolean } | null>(null);
  const [knowledgeManager, setKnowledgeManager] = useState<{ server: McpServer; isOpen: boolean } | null>(null);

  // Load servers and status from backend on component mount
  useEffect(() => {
    loadServers();
    loadOllamaStatus();
    
    // Set up periodic status refresh
    const statusInterval = setInterval(() => {
      loadOllamaStatus();
    }, 30000); // Check every 30 seconds
    
    // Load user info from localStorage
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setCurrentUser(user.email || user.username || 'user@example.com');
      } catch (e) {
        console.warn('Failed to parse user info:', e);
      }
    }
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const servers = await serversApi.list();
      setConnectedServers(servers);
    } catch (err: any) {
      console.error('Failed to load servers:', err);
      setError(err.response?.data?.detail || 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const loadOllamaStatus = async () => {
    try {
      const status = await ollamaApi.getStatus();
      setOllamaStatus(status);
    } catch (err: any) {
      console.error('Failed to load Ollama status:', err);
      setOllamaStatus({
        connected: false,
        status: 'offline',
        model_count: 0,
        error: 'Connection failed'
      });
    }
  };

  const handleServerClick = (server: McpServer) => {
    setActiveServer(server);
  };

  const handleCloseServerWindow = () => {
    setActiveServer(null);
  };

  const handleServerAdded = () => {
    // Refresh servers list when a new server is added
    loadServers();
    setIsModalOpen(false);
  };

  const handleServerDeleted = (serverId: string) => {
    // Remove deleted server from state
    setConnectedServers(prev => prev.filter(server => server.id !== serverId));
    // Close active server window if it was the deleted server
    if (activeServer?.id === serverId) {
      setActiveServer(null);
    }
  };

  const handleServerSettingsSave = async (serverId: string, settings: any) => {
    try {
      // Update server settings via API
      const response = await fetch(`/api/v1/servers/${serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          name: settings.name,
          url: settings.url,
          auth_method: settings.auth_method,
          credentials: {
            ...settings.credentials,
            command: settings.command,
            args: settings.args,
            env: settings.env,
            retryAttempts: settings.retryAttempts,
            autoRestart: settings.autoRestart,
            logLevel: settings.logLevel,
            description: settings.description
          },
          timeout: settings.timeout,
          ssl_verify: settings.ssl_verify
        })
      });

      if (response.ok) {
        const updatedServer = await response.json();
        setConnectedServers(prev => 
          prev.map(s => s.id === serverId ? updatedServer : s)
        );
        if (activeServer?.id === serverId) {
          setActiveServer(updatedServer);
        }
      }
    } catch (error) {
      console.error('Failed to save server settings:', error);
    }
  };

  const handleAIInstructionsSave = async (serverId: string, instructions: any) => {
    try {
      // Update AI instructions via API - store them in server credentials
      const server = connectedServers.find(s => s.id === serverId);
      if (!server) return;

      const response = await fetch(`/api/v1/servers/${serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          credentials: {
            ...server.credentials,
            aiInstructions: instructions
          }
        })
      });

      if (response.ok) {
        const updatedServer = await response.json();
        setConnectedServers(prev => 
          prev.map(s => s.id === serverId ? updatedServer : s)
        );
        if (activeServer?.id === serverId) {
          setActiveServer(updatedServer);
        }
      }
    } catch (error) {
      console.error('Failed to save AI instructions:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Get refresh token before clearing
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        // Call logout API to revoke tokens on server
        const response = await fetch('http://localhost:8000/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          }),
        });
        
        // Log the API call result (optional)
        if (response.ok) {
          console.log('Successfully logged out from server');
        } else {
          console.warn('Server logout failed, but continuing with client logout');
        }
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with client logout even if server call fails
    } finally {
      // Always clear local tokens and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      onLogout();
    }
  };

  return (
    <div className="flex h-screen bg-black text-gray-300">
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm border-b border-[#63bb33]/20">
        <div className="flex justify-between items-center px-6 py-3">
          {/* Status Indicators */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-[#63bb33]">Backend: Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                ollamaStatus?.connected 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
              <span className={`text-sm ${
                ollamaStatus?.connected 
                  ? 'text-[#63bb33]' 
                  : 'text-red-400'
              }`}>
                LLM: {ollamaStatus?.connected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Model: <span className={`${
                ollamaStatus?.current_model 
                  ? 'text-[#63bb33]' 
                  : 'text-red-400'
              }`}>
                {ollamaStatus?.current_model || 'None'}
              </span>
              {ollamaStatus?.model_count !== undefined && ollamaStatus.model_count > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({ollamaStatus.model_count} available)
                </span>
              )}
              {ollamaStatus?.connected && ollamaStatus?.model_count === 0 && (
                <span className="text-xs text-yellow-500 ml-1">
                  (no models installed)
                </span>
              )}
            </div>
          </div>
          
          {/* Username */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">User:</span>
            <span className="text-sm text-[#63bb33] font-mono">{currentUser}</span>
          </div>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 pt-20">
        <div className="relative w-96">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
            <img 
              src="https://raw.githubusercontent.com/khalilpreview/M7yapp9sColl3c1oncdn/refs/heads/main/dark_mater_white_inline_logo.png" 
              alt="Dark Matter Logo" 
              className="w-full h-auto p-4 mx-auto logo-fade-pulse" 
            />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm max-w-md text-center">
            {error}
            <button 
              onClick={loadServers}
              className="ml-2 underline hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-4 text-[#63bb33] text-sm">
            Loading servers...
          </div>
        )}

        {/* Server Count Display */}
        {!loading && !error && (
          <div className="mt-4 text-gray-400 text-sm">
            {connectedServers.length} server{connectedServers.length !== 1 ? 's' : ''} connected
          </div>
        )}

        {/* Tchiko AI Assistant */}
        <div className="mt-8 flex flex-col items-center">
          <div className="text-gray-500 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask if you have any questions
          </div>
          
          <button
            onClick={() => setIsCompanyChatOpen(true)}
            className="group relative px-6 py-3 bg-gradient-to-r from-[#63bb33]/20 to-[#529f27]/20 border-2 border-[#63bb33]/60 rounded-lg text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/30 hover:from-[#63bb33]/30 hover:to-[#529f27]/30 transition-all duration-300 backdrop-blur-sm font-mono tracking-wider flex items-center gap-3"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* AI indicator */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#63bb33] rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">TCHIKO AI v1.0</span>
              <span className="text-xs text-gray-400">Company Knowledge Assistant</span>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#63bb33]/10 to-[#529f27]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 z-50">
         <div className="relative flex flex-col items-center gap-4">

            {/* Menu Button with Dropdown */}
            <div className="relative flex flex-col items-center">
              {isMenuOpen && (
                <div className="absolute bottom-full mb-4 flex flex-col items-center gap-3">
                  <div className="group relative flex items-center">
                    <button 
                      onClick={() => setIsProfileModalOpen(true)}
                      className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
                      aria-label="Profile Settings"
                    >
                      <ProfileIcon className="w-6 h-6" />
                    </button>
                    <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-sm bg-gray-900/90 px-3 py-1 text-sm text-[#63bb33] opacity-0 transition-opacity group-hover:opacity-100">
                      [PROFILE]
                    </span>
                  </div>
                  <div className="group relative flex items-center">
                    <button 
                      onClick={handleLogout}
                      className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
                      aria-label="Logout"
                    >
                      <LogoutIcon className="w-6 h-6" />
                    </button>
                    <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-sm bg-gray-900/90 px-3 py-1 text-sm text-[#63bb33] opacity-0 transition-opacity group-hover:opacity-100">
                      [LOGOUT]
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-14 h-14 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <MenuIcon className="w-7 h-7" />
              </button>
            </div>
         </div>
      </div>
      
      {/* Server List */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative flex flex-col items-center gap-3">
          {connectedServers.map(server => (
            <div key={server.id} className="group relative flex items-center">
               <button 
                  onClick={() => handleServerClick(server)}
                  className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300 relative z-10"
                  aria-label={`Server: ${server.name}`}
                >
                  <ServerIcon className="w-6 h-6" />
                  {server.status === 'active' && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-[#63bb33] border-2 border-gray-900"></span>
                  )}
                  {server.status === 'inactive' && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-gray-900"></span>
                  )}
                </button>

                {/* Creative Tree-like Hover Menu */}
                <div className="pointer-events-none absolute right-full mr-4 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                  <div className="relative flex items-center">
                    {/* Tree branches */}
                    <div className="absolute left-full top-1/2 w-6 h-px bg-[#63bb33]/40"></div>
                    <div className="absolute left-full top-1/2 w-px h-12 bg-[#63bb33]/40 -translate-y-6"></div>
                    <div className="absolute left-full w-6 h-px bg-[#63bb33]/40 -translate-y-4"></div>
                    <div className="absolute left-full w-6 h-px bg-[#63bb33]/40"></div>
                    <div className="absolute left-full w-6 h-px bg-[#63bb33]/40 translate-y-4"></div>
                    
                    {/* Server Label */}
                    <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 border border-[#63bb33]/40 rounded-lg px-3 py-2 backdrop-blur-sm">
                      <div className="text-[#63bb33] font-mono text-sm font-bold">[{server.name}]</div>
                      <div className="text-gray-400 text-xs font-mono">Status: {server.status}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex flex-col gap-2">
                      {/* Server Window */}
                      <button
                        onClick={() => handleServerClick(server)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-md text-blue-400 hover:bg-blue-600/30 hover:border-blue-500/50 transition-all duration-200 text-xs font-mono whitespace-nowrap"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                        </svg>
                        CONSOLE
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => setServerSettings({ server, isOpen: true })}
                        className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-md text-purple-400 hover:bg-purple-600/30 hover:border-purple-500/50 transition-all duration-200 text-xs font-mono whitespace-nowrap"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        CONFIG
                      </button>

                      {/* AI Instructions */}
                      <button
                        onClick={() => setServerAIInstructions({ server, isOpen: true })}
                        className="flex items-center gap-2 px-3 py-1 bg-[#63bb33]/20 border border-[#63bb33]/30 rounded-md text-[#63bb33] hover:bg-[#63bb33]/30 hover:border-[#63bb33]/50 transition-all duration-200 text-xs font-mono whitespace-nowrap"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI ROLE
                      </button>

                      {/* Knowledge Manager */}
                      <button
                        onClick={() => setKnowledgeManager({ server, isOpen: true })}
                        className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-md text-purple-400 hover:bg-purple-600/30 hover:border-purple-500/50 transition-all duration-200 text-xs font-mono whitespace-nowrap"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        DOCS
                      </button>

                      {/* MCP Chat */}
                      <button
                        onClick={() => setActiveMcpChat({ 
                          server, 
                          threadId: `thread_${Date.now()}` 
                        })}
                        className="flex items-center gap-2 px-3 py-1 bg-orange-600/20 border border-orange-500/30 rounded-md text-orange-400 hover:bg-orange-600/30 hover:border-orange-500/50 transition-all duration-200 text-xs font-mono whitespace-nowrap"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        CHAT
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          ))}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
            aria-label="Connect to new MCP Server"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
        </div>
      </div>
      
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onServerAdded={handleServerAdded}
      />
      
      {/* Chat Widgets */}      
      {isCompanyChatOpen && (
        <CompanyChatWidget 
          isOpen={isCompanyChatOpen}
          onClose={() => setIsCompanyChatOpen(false)}
          userId={currentUser}
          authToken={localStorage.getItem('access_token') || ''}
        />
      )}
      
      {activeMcpChat && (
        <McpChatWidget
          isOpen={!!activeMcpChat}
          onClose={() => setActiveMcpChat(null)}
          server={activeMcpChat.server}
          threadId={activeMcpChat.threadId}
          authToken={localStorage.getItem('token') || ''}
        />
      )}
      
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onLogout={handleLogout}
      />
      <ServerWindow 
        server={activeServer} 
        isOpen={!!activeServer} 
        onClose={handleCloseServerWindow} 
        onServerDeleted={handleServerDeleted}
      />

      {/* Server Settings Modal */}
      {serverSettings && (
        <ServerSettingsModal
          server={serverSettings.server}
          isOpen={serverSettings.isOpen}
          onClose={() => setServerSettings(null)}
          onSave={handleServerSettingsSave}
        />
      )}

      {/* AI Instructions Modal */}
      {serverAIInstructions && (
        <AIInstructionsModal
          server={serverAIInstructions.server}
          isOpen={serverAIInstructions.isOpen}
          onClose={() => setServerAIInstructions(null)}
          onSave={handleAIInstructionsSave}
        />
      )}

      {/* Knowledge Manager Modal */}
      {knowledgeManager && (
        <KnowledgeManagerModal
          server={knowledgeManager.server}
          isOpen={knowledgeManager.isOpen}
          onClose={() => setKnowledgeManager(null)}
        />
      )}
    </div>
  );
};

export default MainPage;
