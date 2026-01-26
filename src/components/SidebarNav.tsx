import { MessageCircle, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";

export default function SidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-[64px] bg-[#202c33] flex flex-col items-center py-4 gap-6">
      <Link href="/">
        <MessageCircle 
          className={`cursor-pointer transition-colors ${
            isActive('/') ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`} 
        />
      </Link>
      
      <Link href="/profile">
        <User 
          className={`cursor-pointer transition-colors ${
            isActive('/profile') ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`} 
        />
      </Link>

      <div className="flex-1" />

      <Link href="/settings">
        <Settings 
          className={`cursor-pointer transition-colors ${
            isActive('/settings') ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`} 
        />
      </Link>
      
      <Link href="/profile">
        <div className="cursor-pointer">
          <UserAvatar user={currentUser} size="sm" />
        </div>
      </Link>
    </div>
  );
}
