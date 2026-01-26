'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Camera, Save, X, User, Mail, Calendar, Shield, Activity } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { userService } from '@/lib/services/userService';
import SidebarNav from './SidebarNav';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await userService.updateUserProfile(currentUser.uid, {
        displayName,
        photoURL,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentUser?.displayName || '');
    setPhotoURL(currentUser?.photoURL || '');
    setIsEditing(false);
  };

  return (
    <div className="flex h-screen bg-[#0b141a] text-white">
      <SidebarNav />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-400">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111b21] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#005c4b] rounded-lg hover:bg-[#004a3d] transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <UserAvatar user={currentUser} size="xl" />
                    {isEditing && (
                      <button className="absolute -bottom-2 -right-2 bg-[#005c4b] p-3 rounded-full hover:bg-[#004a3d] transition-colors">
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">{currentUser?.displayName || 'Anonymous User'}</h3>
                    <p className="text-gray-400 text-lg">{currentUser?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-400">Online</span>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full p-3 bg-[#202c33] rounded-lg border border-[#3b4a54] focus:border-[#005c4b] outline-none transition-colors"
                          placeholder="Enter your display name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full p-3 bg-[#202c33] rounded-lg border border-[#3b4a54] opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Profile Photo URL</label>
                      <input
                        type="url"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full p-3 bg-[#202c33] rounded-lg border border-[#3b4a54] focus:border-[#005c4b] outline-none transition-colors"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#005c4b] rounded-lg hover:bg-[#004a3d] disabled:opacity-50 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#3b4a54] rounded-lg hover:bg-[#4a5862] transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#202c33] p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <User className="w-5 h-5 text-[#005c4b] mr-2" />
                          <label className="text-sm font-medium text-gray-400">Display Name</label>
                        </div>
                        <p className="text-lg font-medium">{currentUser?.displayName || 'Not set'}</p>
                      </div>
                      
                      <div className="bg-[#202c33] p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Mail className="w-5 h-5 text-[#005c4b] mr-2" />
                          <label className="text-sm font-medium text-gray-400">Email Address</label>
                        </div>
                        <p className="text-lg font-medium">{currentUser?.email}</p>
                      </div>
                    </div>

                    <div className="bg-[#202c33] p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-[#005c4b] mr-2" />
                        <label className="text-sm font-medium text-gray-400">User ID</label>
                      </div>
                      <p className="text-sm font-mono bg-[#111b21] p-2 rounded border">{currentUser?.uid}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#111b21] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-[#005c4b]" />
                  Account Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Member Since</span>
                    <span className="font-medium">
                      {currentUser?.createdAt 
                        ? new Date(currentUser.createdAt).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Sign In</span>
                    <span className="font-medium">
                      {currentUser?.metadata?.lastSignInTime 
                        ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Account Status</span>
                    <span className="px-2 py-1 bg-green-600 text-green-100 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111b21] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <div className="font-medium">Privacy Settings</div>
                    <div className="text-sm text-gray-400">Manage your privacy preferences</div>
                  </button>
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <div className="font-medium">Notification Settings</div>
                    <div className="text-sm text-gray-400">Configure notifications</div>
                  </button>
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <div className="font-medium">Security</div>
                    <div className="text-sm text-gray-400">Password and security options</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}