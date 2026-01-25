import { User } from "@/types";
import { Video, Phone, MoreVertical } from "lucide-react";

export default function ChatHeader({
  currentUser
}:{
  currentUser : User | null
}) {
 
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-[#2a3942]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-500">
          {/* <img src={currentUser?.photoURL} alt={currentUser?.displayName} /> */}
        </div>
        <div>
          <p className="text-sm font-medium">{currentUser?.displayName}</p>
          <p className="text-xs text-gray-200">{currentUser?.isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      <div className="flex gap-4 text-[#aebac1]">
        {/* <Video size={20} />
        <Phone size={20} /> */}
        <MoreVertical size={20} />
      </div>
    </div>
  );
}
