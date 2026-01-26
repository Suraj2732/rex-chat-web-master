// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, error } = await authService.signIn(email, password);
      
      if (error) {
        toast.error(error);
      } if (user) {
        toast.success('Logged in successfully');
  
        await new Promise(r => setTimeout(r, 600)); // 600ms
        router.push('/');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-teal-900/50 rounded-xl">
            <MessageCircle className="w-10 h-10 text-teal-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-200">
          Sign in to ChatApp
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Welcome back! Please enter your details.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#202c33] py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-[#2a3942] border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-[#2a3942] border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#202c33] focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#202c33] text-gray-400">
                  Contact your administrator for account access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}