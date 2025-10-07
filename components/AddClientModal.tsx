import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { serversApi } from '../src/lib/api';
import { ApiClient } from './ApiClient';
import type { CreateServerRequest } from '../src/types/api';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerAdded?: () => void;
}

const TerminalInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="w-full px-2 py-2 bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] transition-colors duration-300"
  />
);

const TerminalSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select
            {...props}
            className="w-full appearance-none px-2 py-2 bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none transition-colors duration-300"
        >
            {props.children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

const TerminalCheckbox: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, ...props }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
        <input type="checkbox" {...props} className="hidden" />
        <span className={`w-4 h-4 border-2 flex items-center justify-center ${props.checked ? 'border-[#63bb33] bg-[#63bb33]/20' : 'border-gray-600'}`}>
            {props.checked && <span className="block w-2 h-2 bg-[#63bb33]"></span>}
        </span>
        <span className="text-gray-300">{label}</span>
    </label>
);

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onServerAdded }) => {
  const [serverType, setServerType] = useState<'generic' | 'kali'>('generic');
  const [authMethod, setAuthMethod] = useState<'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt'>('none');
  const [sslVerify, setSslVerify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    serverName: '',
    serverUrl: '',
    apiKey: '',
    authToken: '',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    timeout: 30,
    // Kali MCP server fields
    host: '',
    port: 5000,
    serverId: '',
    // Legacy enrollment fields (kept for backward compatibility)
    enrollmentId: '',
    enrollmentToken: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user types
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const buildCredentials = () => {
    switch (authMethod) {
      case 'api_key':
        return formData.apiKey ? { api_key: formData.apiKey } : undefined;
      case 'jwt':
        return formData.authToken ? { authToken: formData.authToken } : undefined;
      case 'oauth':
        return formData.clientId && formData.clientSecret ? {
          client_id: formData.clientId,
          client_secret: formData.clientSecret
        } : undefined;
      case 'none':
      case 'enrollment':
      default:
        return undefined;
    }
  };

  const buildServerData = (): CreateServerRequest => ({
    name: formData.serverName,
    url: serverType === 'kali' ? `http://${formData.host}:${formData.port}` : formData.serverUrl,
    auth_method: authMethod,
    credentials: buildCredentials(),
    timeout: formData.timeout,
    ssl_verify: sslVerify,
  });

  const buildKaliConnectionData = () => ({
    name: formData.serverName,
    host: formData.host,
    port: formData.port,
    server_id: formData.serverId,
    api_key: formData.apiKey,
    ssl_verify: sslVerify,
  });

  const validateForm = (): string | null => {
    if (!formData.serverName.trim()) return 'Server name is required';
    
    if (serverType === 'kali') {
      // Kali server validation
      if (!formData.host.trim()) return 'Host/IP is required for Kali servers';
      if (formData.port < 1 || formData.port > 65535) return 'Port must be between 1 and 65535';
      if (!formData.serverId.trim()) return 'Server ID is required';
      if (!formData.apiKey.trim()) return 'API Key is required';
    } else {
      // Generic server validation
      if (!formData.serverUrl.trim()) return 'Server URL is required';
      
      // Validate URL format
      try {
        new URL(formData.serverUrl);
      } catch {
        return 'Invalid URL format';
      }

      // Validate auth method requirements
      if (authMethod === 'api_key' && !formData.apiKey.trim()) {
        return 'API Key is required for API Key authentication';
      }
      if (authMethod === 'jwt' && !formData.authToken.trim()) {
        return 'JWT Token is required for JWT authentication';
      }
      if (authMethod === 'oauth') {
        if (!formData.clientId.trim()) return 'Client ID is required for OAuth';
        if (!formData.clientSecret.trim()) return 'Client Secret is required for OAuth';
      }
    }

    return null;
  };

  const handleTestConnection = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const testData = {
        url: formData.serverUrl,
        auth_method: authMethod,
        credentials: buildCredentials(),
        timeout: formData.timeout,
        ssl_verify: sslVerify,
      };

      const result = await serversApi.test(testData);
      
      if (result.success) {
        setSuccess(`Connection successful! ${result.latency_ms ? `Latency: ${result.latency_ms}ms` : ''}`);
      } else {
        setError(result.message || 'Connection test failed');
      }
    } catch (err: any) {
      console.error('Test connection failed:', err);
      setError(err.response?.data?.detail || err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let result;
      
      if (serverType === 'kali') {
        // Use direct connection for Kali servers
        const connectionData = buildKaliConnectionData();
        result = await serversApi.create({
          name: connectionData.name,
          url: `http://${connectionData.host}:${connectionData.port}`,
          auth_method: 'api_key',
          credentials: { 
            api_key: connectionData.api_key,
            server_id: connectionData.server_id 
          },
          timeout: formData.timeout,
          ssl_verify: connectionData.ssl_verify,
        });
        setSuccess('Kali MCP server connected successfully!');
      } else {
        // Use generic server creation
        const serverData = buildServerData();
        result = await serversApi.create(serverData);
        setSuccess('Server added successfully!');
      }
      
      // Reset form
      setFormData({
        serverName: '',
        serverUrl: '',
        apiKey: '',
        username: '',
        password: '',
        clientId: '',
        clientSecret: '',
        timeout: 30,
        host: '',
        port: 5000,
        serverId: '',
        enrollmentId: '',
        enrollmentToken: '',
      });
      setServerType('generic');
      setAuthMethod('api_key');
      setSslVerify(true);
      
      // Notify parent component
      if (onServerAdded) {
        onServerAdded();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
      
    } catch (err: any) {
      console.error('Failed to add server:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to add server');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !testing) {
      onClose();
      // Reset state
      setError(null);
      setSuccess(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Decorative Corners */}
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
        
        <div className="relative bg-gray-900/80 border border-[#63bb33]/30 p-8 shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
           <button 
             onClick={handleClose}
             disabled={loading || testing}
             className="absolute top-3 right-3 text-gray-500 hover:text-[#63bb33] transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="Close modal"
            >
             <CloseIcon className="w-6 h-6" />
           </button>
           
           <h2 className="text-lg text-center text-[#63bb33] mb-6">[ CONNECT TO NEW MCP SERVER ]</h2>
           
           {/* Server Type Selection */}
           <div className="mb-6">
             <label htmlFor="serverType" className="block text-sm text-[#63bb33] mb-2">SERVER_TYPE:</label>
             <TerminalSelect 
               id="serverType" 
               value={serverType} 
               onChange={(e) => setServerType(e.target.value as 'generic' | 'kali')}
               disabled={loading || testing}
             >
               <option value="generic">Generic MCP Server</option>
               <option value="kali">Kali MCP Server</option>
             </TerminalSelect>
           </div>
           
           {/* Status Messages */}
           {error && (
             <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">
               {error}
             </div>
           )}
           {success && (
             <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded text-green-300 text-sm">
               {success}
             </div>
           )}
           
           <form onSubmit={handleSubmit}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label htmlFor="serverName" className="block text-sm text-[#63bb33] mb-2">SERVER_NAME:</label>
                    <TerminalInput 
                      type="text" 
                      id="serverName" 
                      placeholder="e.g., Production Server"
                      value={formData.serverName}
                      onChange={(e) => handleInputChange('serverName', e.target.value)}
                      disabled={loading || testing}
                    />
                </div>
                {serverType === 'generic' ? (
                  <div className="md:col-span-2">
                      <label htmlFor="serverUrl" className="block text-sm text-[#63bb33] mb-2">SERVER_URL:</label>
                      <TerminalInput 
                        type="text" 
                        id="serverUrl" 
                        placeholder="https://api.example.com/mcp"
                        value={formData.serverUrl}
                        onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                        disabled={loading || testing}
                      />
                  </div>
                ) : (
                  <>
                    <div>
                        <label htmlFor="host" className="block text-sm text-[#63bb33] mb-2">HOST:</label>
                        <TerminalInput 
                          type="text" 
                          id="host" 
                          placeholder="localhost or server IP"
                          value={formData.host}
                          onChange={(e) => handleInputChange('host', e.target.value)}
                          disabled={loading || testing}
                        />
                    </div>
                    <div>
                        <label htmlFor="port" className="block text-sm text-[#63bb33] mb-2">PORT:</label>
                        <TerminalInput 
                          type="number" 
                          id="port" 
                          placeholder="5000"
                          value={formData.port.toString()}
                          onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5000)}
                          disabled={loading || testing}
                        />
                    </div>
                    <div>
                        <label htmlFor="serverId" className="block text-sm text-[#63bb33] mb-2">SERVER_ID:</label>
                        <TerminalInput 
                          type="text" 
                          id="serverId" 
                          placeholder="Enter Server ID"
                          value={formData.serverId}
                          onChange={(e) => handleInputChange('serverId', e.target.value)}
                          disabled={loading || testing}
                        />
                    </div>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm text-[#63bb33] mb-2">API_KEY:</label>
                        <TerminalInput 
                          type="password" 
                          id="apiKey" 
                          placeholder="Enter API Key"
                          value={formData.apiKey}
                          onChange={(e) => handleInputChange('apiKey', e.target.value)}
                          disabled={loading || testing}
                        />
                    </div>
                  </>
                )}
                
                {serverType === 'generic' && (
                  <>
                    <div className="md:col-span-2">
                        <label htmlFor="authMethod" className="block text-sm text-[#63bb33] mb-2">AUTHENTICATION_METHOD:</label>
                        <TerminalSelect 
                          id="authMethod" 
                          value={authMethod} 
                          onChange={(e) => setAuthMethod(e.target.value as 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt')}
                          disabled={loading || testing}
                        >
                            <option value="none">None</option>
                            <option value="api_key">API Key</option>
                            <option value="jwt">JWT Token</option>
                            <option value="oauth">OAuth 2.0</option>
                        </TerminalSelect>
                    </div>

                    {authMethod === 'api_key' && (
                        <div className="md:col-span-2">
                            <label htmlFor="genericApiKey" className="block text-sm text-[#63bb33] mb-2">API_KEY:</label>
                            <TerminalInput 
                              type="password" 
                              id="genericApiKey" 
                              placeholder="Enter your API Key"
                              value={formData.apiKey}
                              onChange={(e) => handleInputChange('apiKey', e.target.value)}
                              disabled={loading || testing}
                            />
                        </div>
                    )}

                    {authMethod === 'jwt' && (
                        <div className="md:col-span-2">
                            <label htmlFor="genericAuthToken" className="block text-sm text-[#63bb33] mb-2">JWT_TOKEN:</label>
                            <textarea 
                              id="genericAuthToken" 
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                              value={formData.authToken}
                              onChange={(e) => handleInputChange('authToken', e.target.value)}
                              disabled={loading || testing}
                              className="w-full px-2 py-2 bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] transition-colors duration-300 font-mono text-sm h-20 resize-none"
                            />
                        </div>
                    )}
                    
                    {authMethod === 'oauth' && (
                        <>
                            <div>
                                <label htmlFor="clientId" className="block text-sm text-[#63bb33] mb-2">CLIENT_ID:</label>
                                <TerminalInput 
                                  type="text" 
                                  id="clientId" 
                                  placeholder="Enter Client ID"
                                  value={formData.clientId}
                                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                                  disabled={loading || testing}
                                />
                            </div>
                            <div>
                                <label htmlFor="clientSecret" className="block text-sm text-[#63bb33] mb-2">CLIENT_SECRET:</label>
                                <TerminalInput 
                                  type="password" 
                                  id="clientSecret" 
                                  placeholder="Enter Client Secret"
                                  value={formData.clientSecret}
                                  onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                                  disabled={loading || testing}
                                />
                            </div>
                        </>
                    )}
                  </>
                )}
             </div>

             {serverType === 'generic' && (
               <div className="mt-8">
                  <h3 className="text-md text-[#63bb33] mb-4">[ ADVANCED_OPTIONS ]</h3>
                  <div className="flex flex-col md:flex-row gap-6">
                      <div>
                          <label htmlFor="timeout" className="block text-sm text-[#63bb33] mb-2">TIMEOUT (SECONDS):</label>
                          <TerminalInput 
                            type="number" 
                            id="timeout" 
                            placeholder="e.g., 30" 
                            value={formData.timeout}
                            onChange={(e) => handleInputChange('timeout', parseInt(e.target.value) || 30)}
                            min="1"
                            max="300"
                            disabled={loading || testing}
                          />
                      </div>
                      <div className="flex items-end pb-2">
                          <TerminalCheckbox 
                            label="Verify SSL Certificate" 
                            checked={sslVerify} 
                            onChange={(e) => setSslVerify(e.target.checked)}
                          />
                      </div>
                  </div>
               </div>
             )}

             <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8 pt-4 border-t border-[#63bb33]/20">
                <button
                  type="submit"
                  disabled={loading || testing}
                  className="py-2 px-4 bg-[#63bb33] hover:bg-[#529f27] text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#63bb33]"
                >
                  {loading ? '[ CONNECTING... ]' : '[ CONNECT ]'}
                </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;