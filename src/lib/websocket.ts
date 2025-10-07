/**
 * WebSocket client for real-time MCP server communication.
 */
import { config, endpoints, storage } from './config';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface ConnectionStatus {
  status: 'online' | 'offline' | 'connecting' | 'error';
  latency?: number;
  serverName?: string;
  connectedAt?: string;
}

export interface ChatMessage {
  sender: 'AGENT' | 'USER' | 'SYSTEM';
  text: string;
  timestamp: string;
}

export interface TaskNode {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'completed' | 'error';
  position: { x: number; y: number };
  dependsOn?: string[];
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private serverId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private connectionStatus: ConnectionStatus = { status: 'offline' };

  constructor(serverId: string) {
    this.serverId = serverId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = storage.getToken();
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        const wsUrl = `${config.wsBaseUrl}${endpoints.websocket.server(this.serverId)}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`WebSocket connected to server ${this.serverId}`);
          this.reconnectAttempts = 0;
          this.connectionStatus = { status: 'connecting' };
          this.emit('connection_status', this.connectionStatus);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket disconnected from server ${this.serverId}:`, event.code, event.reason);
          this.connectionStatus = { status: 'offline' };
          this.emit('connection_status', this.connectionStatus);
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error(`WebSocket error for server ${this.serverId}:`, error);
          this.connectionStatus = { status: 'error' };
          this.emit('connection_status', this.connectionStatus);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect');
      this.ws = null;
    }
    this.connectionStatus = { status: 'offline' };
    this.emit('connection_status', this.connectionStatus);
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  sendChatMessage(text: string): void {
    this.sendMessage({
      type: 'chat_message',
      payload: { text }
    });
  }

  approveTask(nodeId: string): void {
    this.sendMessage({
      type: 'approve_task',
      payload: { node_id: nodeId }
    });
  }

  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Update connection status if applicable
    if (message.type === 'connection_status') {
      this.connectionStatus = {
        ...this.connectionStatus,
        ...message.payload,
        status: 'online'
      };
    }

    // Emit to all handlers for this message type
    this.emit(message.type, message);
  }

  private emit(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler({ type: eventType, payload: data });
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${eventType}:`, error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch(error => {
          console.error('WebSocket reconnect failed:', error);
        });
      }
    }, delay);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// WebSocket client factory
export const createWebSocketClient = (serverId: string): WebSocketClient => {
  return new WebSocketClient(serverId);
};

export default WebSocketClient;