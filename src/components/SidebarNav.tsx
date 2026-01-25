import { MessageCircle, CircleDot, Users, Settings } from "lucide-react";

export default function SidebarNav() {
  return (
    <div className="w-[64px] bg-[#202c33] flex flex-col items-center py-4 gap-6">
      <MessageCircle className="text-green-500" />
      <CircleDot className="opacity-70 hover:opacity-100 cursor-pointer" />
      <Users className="opacity-70 hover:opacity-100 cursor-pointer" />

      <div className="flex-1" />

      <Settings className="opacity-70 hover:opacity-100 cursor-pointer" />
      <img
        src="https://i.pravatar.cc/40"
        className="rounded-full w-8 h-8"
      />
    </div>
  );
}
