// src/components/UserListModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services/userService';
import { chatService } from '@/lib/services/chatService';
import { User } from '@/types';
import { X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserListModalProps {
  onClose: () => void;
  onSelectUser: (user: User , chatId : string) => void;
}

export default function UserListModal({ onClose, onSelectUser }: UserListModalProps) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser) return;

    try {
      let usersList: User[] = [];

      if (currentUser.role === 'admin') {
        // Admin can see all users
        usersList = await userService.getAllUsers();
      } else {
        // Employee can only see other employees
        usersList = await userService.getEmployees();
      }

      // Filter out current user
      setUsers(usersList.filter(u => u.uid !== currentUser.uid));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    if (!currentUser) return;

    const chatId = await chatService.createOrGetChat(currentUser.uid, user.uid);
    
    if (chatId) {
      onSelectUser(user , chatId);
      onClose();
    } else {
      toast.error('Failed to create chat');
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select User</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* User List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.uid}
                onClick={() => handleSelectUser(user)}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold">{user.displayName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    user.role === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {user.isOnline && (
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


