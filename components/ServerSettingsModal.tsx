import React, { useState, useEffect } from 'react';
import type { McpServer } from '../src/types/api';
import { createMcpServerClient, type LLMConfig } from '../src/clients/mcpServerClient';

interface ServerSettingsModalProps {
  server: McpServer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
}

interface ServerSettings {
  name: string;
  url: string;
  auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt';
  credentials: Record<string, any>;
  timeout: number;
  ssl_verify: boolean;
  // Extended settings for configuration
  command: string;
  args: string[];
  env: Record<string, string>;
  retryAttempts: number;
  autoRestart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  description: string;
}

export default function ServerSettingsModal({ server, isOpen, onClose, onSave }: ServerSettingsModalProps) {
  const [settings, setSettings] = useState<ServerSettings>({
    name: '',
    url: '',
    auth_method: 'none',
    credentials: {},
    timeout: 30,
    ssl_verify: true,
    command: '',
    args: [],
    env: {},
    retryAttempts: 3,
    autoRestart: true,
    logLevel: 'info',
    description: ''
  });
  
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    system_prompt: 'You are a helpful AI assistant.',
    tools_allowed: [],
    runtime_hints: {
      preferred_model: 'phi3:mini',
      temperature: 0.7,
      num_ctx: 4096,
      keep_alive: 0
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [argsInput, setArgsInput] = useState('');
  const [envInput, setEnvInput] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'llm' | 'runtime'>('basic');
  const [toolsInput, setToolsInput] = useState('');

  useEffect(() => {
    if (server && isOpen) {
      setSettings({
        name: server.name,
        url: server.url,
        auth_method: server.auth_method,
        credentials: server.credentials || {},
        timeout: server.timeout,
        ssl_verify: server.ssl_verify,
        command: (server.credentials as any)?.command || '',
        args: (server.credentials as any)?.args || [],
        env: (server.credentials as any)?.env || {},
        retryAttempts: (server.credentials as any)?.retryAttempts || 3,
        autoRestart: (server.credentials as any)?.autoRestart ?? true,
        logLevel: ((server.credentials as any)?.logLevel as 'debug' | 'info' | 'warn' | 'error') || 'info',
        description: (server.credentials as any)?.description || ''
      });
      setArgsInput(((server.credentials as any)?.args || []).join(' '));
      setEnvInput(Object.entries((server.credentials as any)?.env || {}).map(([k, v]) => `${k}=${v}`).join('\n'));
      
      // Load LLM config from MCP server
      loadLlmConfig();
    }
  }, [server, isOpen]);

  const loadLlmConfig = async () => {
    if (!server) return;
    
    try {
      const serverToken = (server.credentials as any)?.authToken;
      const mcpClient = createMcpServerClient(server.url, serverToken);
      const config = await mcpClient.getConfig();
      setLlmConfig(config);
      setToolsInput(config.tools_allowed?.join('\n') || '');
    } catch (error) {
      console.error('Failed to load LLM config:', error);
      // Set default config
      setLlmConfig({
        system_prompt: 'You are a helpful AI assistant.',
        tools_allowed: [],
        runtime_hints: {
          preferred_model: 'phi3:mini',
          temperature: 0.7,
          num_ctx: 4096,
          keep_alive: 0
        }
      });
    }
  };

  const handleSave = async () => {
    if (!server) return;
    
    setIsSaving(true);
    try {
      // Parse args and env from string inputs
      const parsedArgs = argsInput.trim() ? argsInput.trim().split(/\s+/) : [];
      const parsedEnv: Record<string, string> = {};
      
      envInput.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          parsedEnv[key.trim()] = valueParts.join('=').trim();
        }
      });

      // Save LLM config to MCP server
      const serverToken = (settings.credentials as any)?.authToken;
      const mcpClient = createMcpServerClient(settings.url, serverToken);
      const configToSave = {
        ...llmConfig,
        tools_allowed: toolsInput.split('\n').map(tool => tool.trim()).filter(tool => tool)
      };
      
      // Note: This would update the LLM config on the MCP server
      // await mcpClient.updateConfig(configToSave);

      // Build complete settings object for server update
      const updatedSettings = {
        ...settings,
        args: parsedArgs,
        env: parsedEnv,
        credentials: {
          ...settings.credentials,
          command: settings.command,
          args: parsedArgs,
          env: parsedEnv,
          retryAttempts: settings.retryAttempts,
          autoRestart: settings.autoRestart,
          logLevel: settings.logLevel,
          description: settings.description
        }
      };

      await onSave(updatedSettings);
      onClose();
    } catch (error) {
      console.error('Failed to save server settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !server) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-purple-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Server Settings</h2>
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
              { id: 'basic', label: 'Basic Settings', icon: '⚙️' },
              { id: 'llm', label: 'LLM Configuration', icon: '🤖' },
              { id: 'runtime', label: 'Runtime Parameters', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
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
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Basic Settings</h3>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Server Name</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                      placeholder="Server display name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Log Level</label>
                    <select
                      value={settings.logLevel}
                      onChange={(e) => setSettings({ ...settings, logLevel: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 h-20 resize-none"
                    placeholder="Optional server description"
                  />
                </div>
              </div>

              {/* Connection Settings */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Connection Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Server URL</label>
                    <input
                      type="text"
                      value={settings.url}
                      onChange={(e) => setSettings({ ...settings, url: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                      placeholder="http://localhost:8080"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Authentication Method</label>
                    <select
                      value={settings.auth_method}
                      onChange={(e) => setSettings({ ...settings, auth_method: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    >
                      <option value="none">None</option>
                      <option value="api_key">API Key</option>
                      <option value="jwt">JWT Token</option>
                      <option value="oauth">OAuth</option>
                      <option value="enrollment">Enrollment</option>
                    </select>
                  </div>
                </div>

                {/* Authentication Credentials */}
                {settings.auth_method === 'api_key' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                    <input
                      type="password"
                      value={(settings.credentials as any)?.api_key || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        credentials: { ...settings.credentials, api_key: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                      placeholder="Enter API key..."
                    />
                  </div>
                )}

                {settings.auth_method === 'jwt' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">JWT Token</label>
                    <textarea
                      value={(settings.credentials as any)?.authToken || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        credentials: { ...settings.credentials, authToken: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm h-24 resize-none"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <p className="text-gray-500 text-xs mt-1">JWT token for authentication with MCP server</p>
                  </div>
                )}

                {settings.auth_method === 'oauth' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client ID</label>
                      <input
                        type="text"
                        value={(settings.credentials as any)?.client_id || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          credentials: { ...settings.credentials, client_id: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                        placeholder="OAuth client ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client Secret</label>
                      <input
                        type="password"
                        value={(settings.credentials as any)?.client_secret || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          credentials: { ...settings.credentials, client_secret: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                        placeholder="OAuth client secret"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={settings.timeout}
                      onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                      min="5"
                      max="300"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="ssl_verify"
                      checked={settings.ssl_verify}
                      onChange={(e) => setSettings({ ...settings, ssl_verify: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="ssl_verify" className="text-sm text-gray-300">Verify SSL Certificate</label>
                  </div>
                </div>
              </div>

              {/* Execution Settings */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Execution Settings</h3>
              
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Command</label>
                  <input
                    type="text"
                    value={settings.command}
                    onChange={(e) => setSettings({ ...settings, command: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                    placeholder="python"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Arguments</label>
                  <input
                    type="text"
                    value={argsInput}
                    onChange={(e) => setArgsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                    placeholder="-m my_mcp_server --port 8080"
                  />
                  <p className="text-gray-500 text-xs mt-1">Space-separated arguments</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Environment Variables</label>
                  <textarea
                    value={envInput}
                    onChange={(e) => setEnvInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 h-24 resize-none font-mono text-sm"
                    placeholder="DATABASE_URL=sqlite:///data.db&#10;DEBUG=true&#10;API_KEY=your_key_here"
                  />
                  <p className="text-gray-500 text-xs mt-1">One variable per line (KEY=value)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Retry Attempts</label>
                    <input
                      type="number"
                      value={settings.retryAttempts}
                      onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) || 3 })}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                      min="0"
                      max="10"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="auto_restart"
                      checked={settings.autoRestart}
                      onChange={(e) => setSettings({ ...settings, autoRestart: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="auto_restart" className="text-sm text-gray-300">Auto Restart on Failure</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LLM Configuration Tab */}
          {activeTab === 'llm' && llmConfig && (
            <div className="space-y-6">
              <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">LLM Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
                <textarea
                  value={llmConfig.system_prompt}
                  onChange={(e) => setLlmConfig({ ...llmConfig, system_prompt: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 h-32 resize-none"
                  placeholder="Define the AI's behavior and context..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Available Tools</label>
                <textarea
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 h-24 resize-none font-mono text-sm"
                  placeholder="web_search&#10;code_execution&#10;file_operations"
                />
                <p className="text-gray-500 text-xs mt-1">One tool per line</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Model</label>
                  <input
                    type="text"
                    value={llmConfig.runtime_hints?.preferred_model || ''}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, preferred_model: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                    placeholder="phi3:mini"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={llmConfig.runtime_hints?.temperature || 0.7}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, temperature: parseFloat(e.target.value) || 0.7 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Runtime Settings Tab */}
          {activeTab === 'runtime' && llmConfig && (
            <div className="space-y-6">
              <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Runtime Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Context Length</label>
                  <input
                    type="number"
                    value={llmConfig.runtime_hints?.num_ctx || 4096}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, num_ctx: parseInt(e.target.value) || 4096 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    min="1024"
                    max="32768"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Keep Alive (s)</label>
                  <input
                    type="number"
                    value={llmConfig.runtime_hints?.keep_alive || 0}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, keep_alive: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    min="0"
                    max="3600"
                  />
                  <p className="text-gray-500 text-xs mt-1">0 = unload after use</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Top K</label>
                  <input
                    type="number"
                    value={llmConfig.runtime_hints?.top_k || 40}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, top_k: parseInt(e.target.value) || 40 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Top P</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={llmConfig.runtime_hints?.top_p || 0.9}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, top_p: parseFloat(e.target.value) || 0.9 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Repeat Penalty</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2"
                    value={llmConfig.runtime_hints?.repeat_penalty || 1.1}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, repeat_penalty: parseFloat(e.target.value) || 1.1 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">GPU Layers</label>
                  <input
                    type="number"
                    value={llmConfig.runtime_hints?.num_gpu || 0}
                    onChange={(e) => setLlmConfig({ 
                      ...llmConfig, 
                      runtime_hints: { ...llmConfig.runtime_hints, num_gpu: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    min="0"
                    max="100"
                  />
                  <p className="text-gray-500 text-xs mt-1">Number of layers to run on GPU</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}