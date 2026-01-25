import { User } from "@/types";
import { Video, Phone, MoreVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";

export default function ChatHeader({
  currentUser
}:{
  currentUser : User | null
}) {
 
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-[#2a3942]">
      <div className="flex items-center gap-3">
        {currentUser && <UserAvatar user={currentUser} size="sm" showOnlineStatus={true} />}
        <div>
          <p className="text-sm font-medium">{currentUser?.displayName}</p>
          <p className="text-xs text-gray-200">{currentUser?.isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      <div className="flex gap-4 text-[#aebac1]">
        <MoreVertical size={20} />
      </div>
    </div>
  );
}
