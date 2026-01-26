import { companyName } from "@/config/constants";
import { useAppActions } from "@/store/appStore";
import { handleSignOut } from "@/utils";
import { LogOut, MessageCircle, User, Settings } from "lucide-react";
import Link from "next/link";

export default function ChatHeader() {
     const { setShowUserList } = useAppActions();
    return (
        <>
            <div className="px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold">{companyName} WEB</h1>
                <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                        <Link href="/profile">
                            <button
                                className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                                title="Profile"
                            >
                                <User size={18} />
                            </button>
                        </Link>
                        
                        <Link href="/settings">
                            <button
                                className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </Link>

                        <button
                            onClick={()=>setShowUserList(true)}
                            className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                            title="New Chat"
                        >
                            <MessageCircle size={18} />
                        </button>
                        
                        <button
                            onClick={handleSignOut}
                            className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}