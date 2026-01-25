'use client';

import { useRef, useState } from 'react';
import { User, UserRole } from '@/types';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/lib/services/fileService';
import { useAppActions } from '@/store/appStore';

interface ContactFormModalProps {
  onClose: () => void;
  editingUser?: User | null;
  onSuccess?: () => void;
}

export default function ContactFormModal({ onClose, editingUser, onSuccess }: ContactFormModalProps) {
  const { firebaseUser } = useAuth();
  const { setRefresh } = useAppActions();
  
  const [formData, setFormData] = useState({
    email: editingUser?.email || '',
    password: '',
    displayName: editingUser?.displayName || '',
    role: (editingUser?.role || 'employee') as UserRole,
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>(editingUser?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingUser;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      toast.error('You must be logged in as admin');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setLoading(true);

    try {
      let photoURL = null;

      if (profileImage) {
        photoURL = await fileService.uploadProfileImage(profileImage, 'temp_' + Date.now());
        if (!photoURL) {
          toast.error('Failed to upload profile image');
          setLoading(false);
          return;
        }
      }

      const idToken = await firebaseUser.getIdToken();
      const endpoint = isEditing ? '/api/admin/update-user' : '/api/admin/create-user';
      const method = isEditing ? 'PUT' : 'POST';

      const body = isEditing 
        ? {
            userId: editingUser.uid,
            displayName: formData.displayName,
            email: formData.email,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
            ...(photoURL && { photoURL }),
          }
        : {
            email: formData.email,
            password: formData.password,
            displayName: formData.displayName,
            role: formData.role,
            ...(photoURL && { photoURL }),
          };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }

      toast.success(`User ${isEditing ? 'updated' : 'created'} successfully!`);
      setRefresh(prev => !prev);
      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} user:`, error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-700 cursor-pointer rounded-full text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-sm text-gray-400 mt-2">Upload profile image (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-4 py-2 bg-[#2a3942] border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 bg-[#2a3942] border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password {isEditing && <span className="text-gray-400">(leave empty to keep current)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-2 bg-[#2a3942] border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password (min 6 characters)"
              minLength={6}
              required={!isEditing}
            />

            <div className="my-2 flex items-center justify-between">
               {showPassword && (
              <span className="mt-1 text-sm text-gray-400">
                Password: {formData.password || '(no change)'}
              </span>
            )}
              <button className="ms-auto text-sm text-blue-400 hover:underline" type="button" onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
            </div>
           
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-4 py-2 bg-[#2a3942] border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEditing ? 'Update Contact' : 'Create Contact'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}