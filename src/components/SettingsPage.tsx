'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Bell, Moon, Sun, LogOut, Shield, Volume2, VolumeX, User, Lock, Palette, Globe, HelpCircle, Info } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import SidebarNav from './SidebarNav';
import { handleSignOut } from '@/utils';

export default function SettingsPage() {
  const { currentUser } = useAuth();

  const { permission, requestPermission } = useNotificationPermission();
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //   } catch (error) {
  //     console.error('Failed to logout:', error);
  //   }
  // };

  const handleNotificationToggle = async () => {
    if (permission === 'default') {
      await requestPermission();
    }
  };

  return (
    <div className="flex h-screen bg-[#0b141a] text-white overflow-auto">
      <SidebarNav />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-400">Customize your chat experience and manage your account</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#111b21] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Bell className="w-6 h-6 mr-3 text-[#005c4b]" />
                  Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <Bell className="w-4 h-4 mr-2 text-[#005c4b]" />
                        <p className="font-medium">Browser Notifications</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {permission === 'granted' ? 'Notifications are enabled' : 
                         permission === 'denied' ? 'Blocked - Enable in browser settings' : 
                         'Click to enable desktop notifications'}
                      </p>
                    </div>
                    <button
                      onClick={handleNotificationToggle}
                      disabled={permission === 'denied'}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        permission === 'granted' 
                          ? 'bg-[#005c4b]' 
                          : 'bg-[#3b4a54]'
                      } ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                        permission === 'granted' ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {soundEnabled ? <Volume2 className="w-4 h-4 mr-2 text-[#005c4b]" /> : <VolumeX className="w-4 h-4 mr-2 text-gray-400" />}
                        <p className="font-medium">Sound Notifications</p>
                      </div>
                      <p className="text-sm text-gray-400">Play sound when receiving new messages</p>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        soundEnabled ? 'bg-[#005c4b]' : 'bg-[#3b4a54]'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                        soundEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#111b21] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Palette className="w-6 h-6 mr-3 text-[#005c4b]" />
                  Appearance
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {darkMode ? <Moon className="w-4 h-4 mr-2 text-[#005c4b]" /> : <Sun className="w-4 h-4 mr-2 text-yellow-500" />}
                        <p className="font-medium">Dark Mode</p>
                      </div>
                      <p className="text-sm text-gray-400">Use dark theme for better night viewing</p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        darkMode ? 'bg-[#005c4b]' : 'bg-[#3b4a54]'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                        darkMode ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#111b21] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-[#005c4b]" />
                  Privacy & Security
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <User className="w-4 h-4 mr-2 text-[#005c4b]" />
                        <p className="font-medium">Show Online Status</p>
                      </div>
                      <p className="text-sm text-gray-400">Let others see when you're online</p>
                    </div>
                    <button
                      onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        showOnlineStatus ? 'bg-[#005c4b]' : 'bg-[#3b4a54]'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 ${
                        showOnlineStatus ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#111b21] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#005c4b]" />
                  Account
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-[#202c33] rounded-lg">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="font-medium truncate">{currentUser?.email}</p>
                  </div>
                  <div className="p-3 bg-[#202c33] rounded-lg">
                    <p className="text-sm text-gray-400">Account Type</p>
                    <p className="font-medium">Free Plan</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#111b21] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Storage & Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#202c33] rounded-lg">
                    <div>
                      <p className="font-medium">Auto-download Media</p>
                      <p className="text-sm text-gray-400">Download images automatically</p>
                    </div>
                    <button
                      onClick={() => setAutoDownload(!autoDownload)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        autoDownload ? 'bg-[#005c4b]' : 'bg-[#3b4a54]'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                        autoDownload ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="p-3 bg-[#202c33] rounded-lg">
                    <p className="text-sm text-gray-400">Storage Used</p>
                    <p className="font-medium">2.3 GB of 15 GB</p>
                    <div className="w-full bg-[#3b4a54] rounded-full h-2 mt-2">
                      <div className="bg-[#005c4b] h-2 rounded-full" style={{width: '15%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
            <div className="bg-[#111b21] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-[#005c4b]" />
                  Help & Support
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <p className="font-medium">Help Center</p>
                    <p className="text-sm text-gray-400">Get help and support</p>
                  </button>
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <p className="font-medium">Contact Us</p>
                    <p className="text-sm text-gray-400">Send feedback or report issues</p>
                  </button>
                  <button className="w-full text-left p-3 bg-[#202c33] rounded-lg hover:bg-[#3b4a54] transition-colors">
                    <p className="font-medium flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      About Rex Chat
                    </p>
                    <p className="text-sm text-gray-400">Version 1.0.0</p>
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}