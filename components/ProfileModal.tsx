import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { userApi } from '../src/lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

const TerminalInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { readOnly?: boolean }> = (props) => (
  <input
    {...props}
    className={`w-full px-2 py-2 bg-transparent border-0 border-b-2 transition-colors duration-300 ${props.readOnly ? 'border-gray-700 text-gray-500' : 'border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33]'}`}
  />
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeletionWarning, setShowDeletionWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const profile = await userApi.getProfile();
      setUserProfile(profile);
      setUsername(profile.username || '');
    } catch (err: any) {
      setError('Failed to load profile');
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await userApi.updateProfile({ username: username.trim() });
      setSuccess('Username updated successfully');
      await loadUserProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await userApi.requestAccountDeletion();
      setShowDeleteConfirm(false);
      setShowDeletionWarning(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

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
           
           {/* Error/Success Messages */}
           {error && (
             <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
               {error}
             </div>
           )}
           {success && (
             <div className="mb-4 p-3 border border-[#63bb33]/30 bg-[#63bb33]/10 text-[#63bb33] text-sm">
               {success}
             </div>
           )}

           {/* Account Deletion Warning Modal */}
           {showDeletionWarning && (
             <div className="mb-6 p-4 border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm space-y-3">
               <h3 className="text-[#63bb33] font-semibold">[ ACCOUNT DELETION SCHEDULED ]</h3>
               <p className="text-xs leading-relaxed">
                 Your account has been scheduled for deletion and will remain inactive for 7 days. 
                 After this grace period, your account and all associated data will be permanently deleted from our database.
               </p>
               <p className="text-xs leading-relaxed">
                 If you log in again during this period, your account will be automatically reactivated 
                 and the deletion process will be cancelled.
               </p>
               <div className="flex gap-4 mt-4">
                 <button
                   onClick={handleConfirmDeletion}
                   className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                 >
                   [ PROCEED WITH LOGOUT ]
                 </button>
                 <button
                   onClick={() => setShowDeletionWarning(false)}
                   className="py-2 px-4 border border-gray-500 text-gray-400 hover:text-white text-xs font-bold transition-colors"
                 >
                   [ STAY LOGGED IN ]
                 </button>
               </div>
             </div>
           )}

           {/* Delete Account Confirmation Modal */}
           {showDeleteConfirm && (
             <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 space-y-4">
               <h3 className="text-red-400 font-semibold">[ CONFIRM ACCOUNT DELETION ]</h3>
               <p className="text-xs text-gray-300 leading-relaxed">
                 Are you sure you want to delete your account? This action will:
               </p>
               <ul className="text-xs text-gray-400 space-y-1 ml-4">
                 <li>• Set your account as inactive for 7 days</li>
                 <li>• Permanently delete all your data after the grace period</li>
                 <li>• Remove access to all MCP servers and conversations</li>
                 <li>• Cannot be undone after the 7-day grace period</li>
               </ul>
               <div className="mt-4">
                 <label htmlFor="deleteConfirm" className="block text-sm text-red-400 mb-2">
                   Type "DELETE" to confirm:
                 </label>
                 <TerminalInput
                   type="text"
                   id="deleteConfirm"
                   value={deleteConfirmText}
                   onChange={(e) => setDeleteConfirmText(e.target.value)}
                   placeholder="DELETE"
                   className="border-red-500/50 focus:border-red-400"
                 />
               </div>
               <div className="flex gap-4 mt-4">
                 <button
                   onClick={handleDeleteAccount}
                   disabled={deleteConfirmText !== 'DELETE' || isLoading}
                   className="py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
                 >
                   {isLoading ? '[ PROCESSING... ]' : '[ CONFIRM DELETION ]'}
                 </button>
                 <button
                   onClick={() => {
                     setShowDeleteConfirm(false);
                     setDeleteConfirmText('');
                     setError('');
                   }}
                   className="py-2 px-4 border border-gray-500 text-gray-400 hover:text-white text-xs font-bold transition-colors"
                 >
                   [ CANCEL ]
                 </button>
               </div>
             </div>
           )}

           <form onSubmit={handleUpdateUsername} className="space-y-6">
              <div>
                  <label htmlFor="username" className="block text-sm text-[#63bb33] mb-2">USERNAME:</label>
                  <TerminalInput 
                    type="text" 
                    id="username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
              </div>
              <div>
                  <label htmlFor="email" className="block text-sm text-[#63bb33] mb-2">EMAIL_ADDRESS:</label>
                  <TerminalInput 
                    type="email" 
                    id="email" 
                    value={userProfile?.email || ''} 
                    readOnly 
                  />
              </div>
            
             <div className="flex justify-between gap-4 mt-8 pt-4 border-t border-[#63bb33]/20">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-4 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:border-red-500/50 text-xs font-bold transition-all duration-300"
                >
                  [ DELETE ACCOUNT ]
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || username === userProfile?.username}
                  className="py-2 px-4 bg-[#63bb33] hover:bg-[#529f27] disabled:bg-[#63bb33]/50 disabled:cursor-not-allowed text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27]"
                >
                  {isLoading ? '[ UPDATING... ]' : '[ UPDATE USERNAME ]'}
                </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;