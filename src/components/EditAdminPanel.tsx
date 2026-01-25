// src/components/AdminPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { User, UserRole } from '@/types';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/lib/services/fileService';
import { userService } from '@/lib/services/userService';

interface AdminPanelProps {
  onClose: () => void;
  setEditingUser: (user: User | null) => void;
  editingUser: User;
}

export default function EditAdminPanel({ onClose, setEditingUser, editingUser }: AdminPanelProps) {
  const { firebaseUser } = useAuth();

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);


  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = fileService.validateProfileImage(file);
      if (validation.valid) {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(validation.error || 'Invalid image');
      }
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      const idToken = await firebaseUser!.getIdToken();

      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setEditingUser(null);

    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };


  return (
    <div className=" inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
      <div className=" rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Edit Contact</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-700 cursor-pointer rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault(); // ✅ prevent full page reload
          handleUpdateUser(editingUser);
        }}
          className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => profileImageRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
              </button>
              <input
                ref={profileImageRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Upload profile image (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Name
            </label>
            <input
              type="text"
              value={editingUser.displayName}
              onChange={(e) =>
                setEditingUser({ ...editingUser, displayName: e.target.value })
              }
              className="w-full px-4 py-2 border-b border-gray-300 text-sm  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editingUser.email}
              onChange={(e) =>
                setEditingUser({ ...editingUser, email: e.target.value })
              }
              className="w-full px-4 py-2 border-b border-gray-300 text-sm  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={editingUser.password}
              onChange={(e) =>
                setEditingUser({ ...editingUser, password: e.target.value })
              }
              className="w-full px-4 py-2 border-b border-gray-300 text-sm  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password (min 6 characters)"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Role
            </label>
            <select
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value as UserRole })
              }
              className="w-full px-4 py-2 border-b border-gray-300 text-sm  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-2 rounded-lg hover:bg-green-700 cursor-pointer transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating User...
              </span>
            ) : (
              'Updating User'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
