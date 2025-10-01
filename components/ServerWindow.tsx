import React, { useState, useEffect, useRef } from 'react';
import { CollapseIcon } from './icons/CollapseIcon';
import TaskGraph from './TaskGraph';
import { SendIcon } from './icons/SendIcon';

interface Server {
  id: number;
  name: string;
  status: 'online' | 'offline';
}

interface Message {
    sender: 'USER' | 'AGENT' | 'SYSTEM';
    text: string;
    timestamp: string;
}

interface ServerWindowProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServerWindow: React.FC<ServerWindowProps> = ({ server, isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [showGraph, setShowGraph] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);


    const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset state when window is closed
            const resetTimer = setTimeout(() => {
                setMessages([]);
                setLogs([]);
                setShowGraph(false);
            }, 300); // Delay reset to allow for fade-out transition
            return () => clearTimeout(resetTimer);
        }

        const initialMessages: Message[] = [
            { sender: 'SYSTEM', text: `Connection established with ${server?.name}. Authenticated successfully.`, timestamp: new Date().toLocaleTimeString() }
        ];
        const initialLogs: string[] = [
            `[${new Date().toLocaleTimeString()}] Attempting to connect to server...`,
            `[${new Date().toLocaleTimeString()}] Connection established with ${server?.name}.`,
            `[${new Date().toLocaleTimeString()}] Authenticated successfully.`,
            `[${new Date().toLocaleTimeString()}] Listening for tasks...`,
        ];

        setMessages(initialMessages);
        setLogs(initialLogs);

        const logInterval = setInterval(() => {
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] System heartbeat OK.`]);
        }, 5000);

        return () => clearInterval(logInterval);
    }, [isOpen, server]);

    useEffect(() => scrollToBottom(chatEndRef), [messages]);
    useEffect(() => scrollToBottom(logEndRef), [logs]);

    if (!server) return null;

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('chat-input') as HTMLInputElement;
        const messageText = input.value.trim();
        if (messageText) {
            const userMessage: Message = { sender: 'USER', text: messageText, timestamp: new Date().toLocaleTimeString() };
            setMessages(prev => [...prev, userMessage]);
            setLogs(prev => [...prev, `[${userMessage.timestamp}] User input received: "${userMessage.text}"`]);
            input.value = '';

            setTimeout(() => {
                const agentMessage: Message = { sender: 'AGENT', text: 'Understood. Generating a task plan for your request.', timestamp: new Date().toLocaleTimeString() };
                 setMessages(prev => [...prev, agentMessage]);
                 setLogs(prev => [...prev, `[${agentMessage.timestamp}] Agent responded and proposed a plan.`]);
                 setShowGraph(true);
            }, 1000);
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col p-4 md:p-6 text-gray-300 font-mono transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Header and Close Button */}
            <div className="flex-shrink-0 flex items-start justify-between mb-4">
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <h2 className="text-lg text-[#63bb33]">[ SESSION: {server.name} ]</h2>
                    <p>STATUS: <span className="text-green-400">{server.status.toUpperCase()}</span></p>
                    <p>LATENCY: <span className="text-white">12ms</span></p>
                    <p>MODEL: <span className="text-white">gemini-2.5-flash</span></p>
                    <p>MEMORY: <span className="text-white">256MB / 1024MB</span></p>
                 </div>
                 <button 
                    onClick={onClose} 
                    className="p-2 text-gray-500 hover:text-[#63bb33] transition-colors"
                    aria-label="Collapse window"
                 >
                    <CollapseIcon className="w-7 h-7" />
                 </button>
            </div>
            
            {/* Main Content */}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
                {/* Left: Chat + Tools */}
                <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-grow flex flex-col bg-gray-900/30 border border-[#63bb33]/20 p-3 min-h-0">
                        <h3 className="text-sm text-[#63bb33] mb-3 flex-shrink-0">[ CHAT ]</h3>
                        <div className="flex-grow overflow-y-auto text-xs space-y-3 pr-2">
                            {messages.map((msg, index) => (
                                <div key={index}>
                                    <p className={`font-bold ${msg.sender === 'USER' ? 'text-[#63bb33]' : msg.sender === 'AGENT' ? 'text-purple-400' : 'text-gray-500'}`}>
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
                            name="chat-input"
                            type="text" 
                            placeholder="> Send a message to the agent..."
                            className="flex-grow bg-transparent border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] py-2 px-1"
                        />
                        <button type="submit" className="p-2 text-gray-500 hover:text-[#63bb33] transition-colors" aria-label="Send message">
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
                           {logs.map((log, index) => <p key={index} className="whitespace-pre-wrap break-words">{log}</p>)}
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