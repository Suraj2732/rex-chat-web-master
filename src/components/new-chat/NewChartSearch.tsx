import { useSearchQuery, useAppActions } from "@/store/appStore";
import { Search } from "lucide-react";


 
  
export default function NewChatSearch() {
    const searchQuery = useSearchQuery();
    const { setSearchQuery } = useAppActions();
    return (
        <div className="px-3 py-2">
            <div className="flex items-center gap-2 bg-[#202c33] rounded-full px-4 py-2 border border-green-500">
                <Search size={16} className="opacity-70" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or number"
                    className="bg-transparent outline-none text-sm w-full"
                />
            </div>
        </div>
    );
}