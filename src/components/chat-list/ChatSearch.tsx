import { Search } from "lucide-react";

export default function ChatSearch() {
    return (
        <>
            <div className="px-3 py-2">
                <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-2">
                    <Search size={16} className="opacity-70" />
                    <input
                        placeholder="Search"
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>
            </div>
        </>
    )
}