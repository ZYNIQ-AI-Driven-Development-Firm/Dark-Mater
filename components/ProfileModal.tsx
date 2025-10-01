import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerminalInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { readOnly?: boolean }> = (props) => (
  <input
    {...props}
    className={`w-full px-2 py-2 bg-transparent border-0 border-b-2 transition-colors duration-300 ${props.readOnly ? 'border-gray-700 text-gray-500' : 'border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33]'}`}
  />
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg mx-auto">
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
           <h2 className="text-lg text-center text-[#63bb33] mb-8">[ USER PROFILE SETTINGS ]</h2>
           <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div>
                  <label htmlFor="username" className="block text-sm text-[#63bb33] mb-2">USERNAME:</label>
                  <TerminalInput type="text" id="username" value="terminal_user_01" readOnly />
              </div>
              <div>
                  <label htmlFor="email" className="block text-sm text-[#63bb33] mb-2">EMAIL_ADDRESS:</label>
                  <TerminalInput type="email" id="email" value="you@example.com" readOnly />
              </div>
             
              <div className="pt-4 border-t border-[#63bb33]/20">
                <h3 className="text-md text-[#63bb33] mb-4">[ CHANGE_PASSWORD ]</h3>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm text-[#63bb33] mb-2">CURRENT_PASSWORD:</label>
                        <TerminalInput type="password" id="currentPassword" placeholder="Enter your current password" />
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-sm text-[#63bb33] mb-2">NEW_PASSWORD:</label>
                        <TerminalInput type="password" id="newPassword" placeholder="Enter a new password" />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm text-[#63bb33] mb-2">CONFIRM_NEW_PASSWORD:</label>
                        <TerminalInput type="password" id="confirmPassword" placeholder="Confirm your new password" />
                    </div>
                </div>
              </div>
            
             <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-[#63bb33]/20">
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#63bb33] hover:bg-[#529f27] text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27]"
                >
                  [ SAVE CHANGES ]
                </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;