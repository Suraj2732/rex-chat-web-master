import { Search } from "lucide-react";
import { useAppActions, useChatSearchQuery } from "@/store/appStore";

export default function ChatSearch() {
    const chatSearchQuery = useChatSearchQuery();
    const { setChatSearchQuery } = useAppActions();

    return (
        <>
            <div className="px-3 py-2">
                <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-2">
                    <Search size={16} className="opacity-70" />
                    <input
                        placeholder="Search chats"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full text-white"
                    />
                </div>
            </div>
        </>
    )
}