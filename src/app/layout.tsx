import type { Metadata } from 'next';
 
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Poppins, Inter } from "next/font/google";
 

export const metadata: Metadata = {
  title: 'ChatApp - Real-time Messaging',
  description: 'WhatsApp-like chat application',
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-sans bg-[#0b141a] text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}