import { companyName } from "@/config/constants";
import { useAppActions } from "@/store/appStore";
import { handleSignOut } from "@/utils";
import { LogOut, MessageCircle } from "lucide-react";

export default function ChatHeader() {
     const { setShowUserList } = useAppActions();
    return (
        <>
            <div className="px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold">{companyName} WEB</h1>
                <div className="flex gap-4">
                    <div className="flex items-center space-x-4">

                        <button
                            onClick={()=>setShowUserList(true)}
                            className="hover:bg-gray-100 hover:text-gray-800 p-1 cursor-pointer rounded-full transition-colors"
                            title="New Chat"
                        >
                            <MessageCircle size={20} />
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="hover:bg-gray-100 hover:text-gray-800 p-1 cursor-pointer rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}