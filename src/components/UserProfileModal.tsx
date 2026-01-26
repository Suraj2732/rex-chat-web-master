'use client';

import { X, Mail, Calendar, Shield } from 'lucide-react';
import { User } from '@/types';
import UserAvatar from './UserAvatar';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111b21] rounded-xl max-w-md w-full p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#202c33] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h3 className="text-xl font-semibold">{user.displayName || 'Anonymous User'}</h3>
              <div className="flex items-center mt-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">{user.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#202c33] p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="w-5 h-5 text-[#005c4b] mr-2" />
                <label className="text-sm font-medium text-gray-400">Email</label>
              </div>
              <p className="text-lg">{user.email}</p>
            </div>

            <div className="bg-[#202c33] p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-[#005c4b] mr-2" />
                <label className="text-sm font-medium text-gray-400">Member Since</label>
              </div>
              <p className="text-lg">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>

            <div className="bg-[#202c33] p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 text-[#005c4b] mr-2" />
                <label className="text-sm font-medium text-gray-400">Role</label>
              </div>
              <p className="text-lg capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}