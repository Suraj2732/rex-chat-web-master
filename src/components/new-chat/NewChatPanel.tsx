import NewChatHeader from "./NewChatHeader";
import NewChatSearch from "./NewChartSearch";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import NewChatList from "./NewChatList";
 

interface UserListModalProps {
    onClose: () => void;
}

export default function NewChatPanel({ onClose }: UserListModalProps) {
     
    return (
        <div className="w-[380px] bg-[#111b21] border-r border-[#222d34] flex flex-col h-full">
            <div className="px-4 py-3 flex items-center gap-4">
                <ArrowLeft className="cursor-pointer" onClick={onClose} />
                <h2 className="text-lg font-medium flex-1">New chat</h2>
                <LayoutGrid className="opacity-70" />
            </div>
            <NewChatSearch />

            <div className="flex-1 overflow-y-auto px-2">

                <NewChatHeader />
                <NewChatList />
            </div>
        </div>
    );
}