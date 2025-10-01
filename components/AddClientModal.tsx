import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
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


const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const [authMethod, setAuthMethod] = useState('apiKey');
  const [sslVerify, setSslVerify] = useState(true);

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
             onClick={onClose}
             className="absolute top-3 right-3 text-gray-500 hover:text-[#63bb33] transition-colors z-10"
             aria-label="Close modal"
            >
             <CloseIcon className="w-6 h-6" />
           </button>
           <h2 className="text-lg text-center text-[#63bb33] mb-6">[ CONNECT TO NEW MCP SERVER ]</h2>
           <form onSubmit={(e) => e.preventDefault()}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label htmlFor="serverName" className="block text-sm text-[#63bb33] mb-2">SERVER_NAME:</label>
                    <TerminalInput type="text" id="serverName" placeholder="e.g., Production Server" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="serverUrl" className="block text-sm text-[#63bb33] mb-2">SERVER_URL:</label>
                    <TerminalInput type="text" id="serverUrl" placeholder="https://api.example.com/mcp" />
                </div>
                
                <div className="md:col-span-2">
                    <label htmlFor="authMethod" className="block text-sm text-[#63bb33] mb-2">AUTHENTICATION_METHOD:</label>
                    <TerminalSelect id="authMethod" value={authMethod} onChange={(e) => setAuthMethod(e.target.value)}>
                        <option value="apiKey">API Key</option>
                        <option value="basic">Basic Auth</option>
                        <option value="oauth2">OAuth 2.0</option>
                    </TerminalSelect>
                </div>

                {authMethod === 'apiKey' && (
                    <div className="md:col-span-2">
                        <label htmlFor="apiKey" className="block text-sm text-[#63bb33] mb-2">API_KEY:</label>
                        <TerminalInput type="password" id="apiKey" placeholder="Enter your API Key" />
                    </div>
                )}

                {authMethod === 'basic' && (
                    <>
                        <div>
                            <label htmlFor="username" className="block text-sm text-[#63bb33] mb-2">USERNAME:</label>
                            <TerminalInput type="text" id="username" placeholder="Enter username" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm text-[#63bb33] mb-2">PASSWORD:</label>
                            <TerminalInput type="password" id="password" placeholder="Enter password" />
                        </div>
                    </>
                )}
                
                {authMethod === 'oauth2' && (
                    <>
                        <div>
                            <label htmlFor="clientId" className="block text-sm text-[#63bb33] mb-2">CLIENT_ID:</label>
                            <TerminalInput type="text" id="clientId" placeholder="Enter Client ID" />
                        </div>
                        <div>
                            <label htmlFor="clientSecret" className="block text-sm text-[#63bb33] mb-2">CLIENT_SECRET:</label>
                            <TerminalInput type="password" id="clientSecret" placeholder="Enter Client Secret" />
                        </div>
                    </>
                )}
             </div>

             <div className="mt-8">
                <h3 className="text-md text-[#63bb33] mb-4">[ ADVANCED_OPTIONS ]</h3>
                <div className="flex flex-col md:flex-row gap-6">
                    <div>
                        <label htmlFor="timeout" className="block text-sm text-[#63bb33] mb-2">TIMEOUT (SECONDS):</label>
                        <TerminalInput type="number" id="timeout" placeholder="e.g., 30" defaultValue={30} />
                    </div>
                    <div className="flex items-end pb-2">
                        <TerminalCheckbox label="Verify SSL Certificate" checked={sslVerify} onChange={(e) => setSslVerify(e.target.checked)} />
                    </div>
                </div>
             </div>

             <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8 pt-4 border-t border-[#63bb33]/20">
                <button
                  type="button"
                  className="py-2 px-4 text-[#63bb33] font-bold border-2 border-transparent hover:border-[#63bb33]/50 transition-colors"
                >
                  [ TEST CONNECTION ]
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#63bb33] hover:bg-[#529f27] text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27]"
                >
                  [ CONNECT ]
                </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;