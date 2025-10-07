import React, { useState, useEffect } from 'react';
import { ollamaApi, OllamaStatus } from '../src/lib/api';
import { Tooltip } from 'react-tooltip'

const OllamaStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const statusData = await ollamaApi.getStatus();
        setStatus(statusData);
      } catch (error) {
        console.error("Failed to fetch Ollama status:", error);
        setStatus({ connected: false, status: 'offline', model_count: 0, error: 'Failed to connect' });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (loading || !status) return 'bg-yellow-500';
    if (status.status === 'online') return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (!status) return 'Unknown';
    if (status.status === 'online') return 'Online';
    return 'Offline';
  };

  return (
    <>
      <div 
        className="flex items-center gap-2"
        data-tooltip-id="ollama-tooltip"
        data-tooltip-content={loading ? 'Checking connection...' : `Ollama is ${getStatusText()}. Models available: ${status?.model_count ?? 0}`}
      >
        <div className="text-xs font-mono text-gray-400">LLM</div>
        <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor()}`} style={{ animationDuration: '2s' }}></div>
        <div className="text-xs font-mono text-gray-300">{getStatusText()}</div>
      </div>
      <Tooltip id="ollama-tooltip" place="bottom" className="z-50" />
    </>
  );
};

export default OllamaStatusIndicator;